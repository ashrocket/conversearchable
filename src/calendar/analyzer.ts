import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';
import { getConfig } from '../config/index.js';
import type { CalendarEvent, TravelNeed, TravelUrgency } from '../types/index.js';

/**
 * LLM-powered calendar event analyzer.
 * Examines events and detects ones that imply travel.
 */
export class EventAnalyzer {
  private anthropic: Anthropic | null = null;

  private getClient(): Anthropic {
    if (!this.anthropic) {
      const config = getConfig();
      this.anthropic = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });
    }
    return this.anthropic;
  }

  /**
   * Analyze a batch of calendar events and identify travel needs.
   */
  async analyzeEvents(
    events: CalendarEvent[],
    userHomeCity: string,
    userHomeAirport: string
  ): Promise<TravelNeed[]> {
    const config = getConfig();

    if (config.USE_MOCK_LLM) {
      return this.mockAnalyze(events, userHomeCity, userHomeAirport);
    }

    return this.llmAnalyze(events, userHomeCity, userHomeAirport);
  }

  /**
   * Use Claude to analyze events for travel implications.
   */
  private async llmAnalyze(
    events: CalendarEvent[],
    userHomeCity: string,
    userHomeAirport: string
  ): Promise<TravelNeed[]> {
    const client = this.getClient();

    const eventsJson = events.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      location: e.location,
      startTime: e.startTime,
      endTime: e.endTime,
      attendees: e.attendees,
    }));

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: `You are a travel detection system. Your job is to analyze calendar events and identify ones that require travel from the user's home city. Be accurate and conservative - only flag events that clearly imply being physically present in another city.

The user lives in ${userHomeCity} (airport code: ${userHomeAirport}).

For each event that implies travel, extract:
- destinationCity: the city the user needs to travel to
- departureDate: when they should depart (usually the day before the event, or same day for morning flights)
- returnDate: when they could return (evening of the last day, or next morning)
- urgency: "low" (>2 weeks away), "medium" (1-2 weeks), "high" (<1 week), "critical" (<3 days)
- confidence: 0-1 how confident you are this requires travel
- reasoning: brief explanation
- requiresFlight: whether this likely needs a flight vs. driving

Respond with valid JSON only. Format:
{
  "travelEvents": [
    {
      "eventId": "...",
      "eventTitle": "...",
      "destinationCity": "...",
      "departureDate": "YYYY-MM-DD",
      "returnDate": "YYYY-MM-DD",
      "urgency": "low|medium|high|critical",
      "confidence": 0.0-1.0,
      "reasoning": "...",
      "requiresFlight": true|false
    }
  ]
}

If no events require travel, return: {"travelEvents": []}`,
      messages: [
        {
          role: 'user',
          content: `Analyze these calendar events and identify which ones require travel:\n\n${JSON.stringify(eventsJson, null, 2)}`,
        },
      ],
    });

    const text = response.content[0];
    if (text.type !== 'text') return [];

    try {
      const parsed = JSON.parse(text.text);
      return (parsed.travelEvents ?? []).map((te: Record<string, unknown>) => {
        const event = events.find((e) => e.id === te.eventId);
        return {
          id: uuidv4(),
          userId: event?.userId ?? '',
          calendarEventId: te.eventId as string,
          eventTitle: te.eventTitle as string,
          destinationCity: te.destinationCity as string,
          originCity: userHomeCity,
          originAirport: userHomeAirport,
          departureDate: te.departureDate as string,
          returnDate: te.returnDate as string,
          urgency: te.urgency as TravelUrgency,
          confidence: te.confidence as number,
          reasoning: te.reasoning as string,
          requiresFlight: te.requiresFlight as boolean,
          createdAt: new Date().toISOString(),
        } satisfies TravelNeed;
      });
    } catch {
      console.error('[EventAnalyzer] Failed to parse LLM response');
      return [];
    }
  }

  /**
   * Rule-based mock analyzer for development.
   * Uses simple heuristics to detect travel-implying events.
   */
  private mockAnalyze(
    events: CalendarEvent[],
    userHomeCity: string,
    userHomeAirport: string
  ): TravelNeed[] {
    // City names that imply travel. Use word-boundary regex to avoid
    // false positives (e.g., "la" matching inside "planning").
    const travelCities = [
      'chicago', 'austin', 'las vegas', 'san francisco', 'denver',
      'new york', 'nyc', 'boston', 'seattle', 'los angeles',
      'miami', 'atlanta', 'dallas', 'houston', 'phoenix', 'portland',
    ];
    const travelContextKeywords = ['conference', 'offsite', 'summit', 'retreat'];

    const cityAirportMap: Record<string, string> = {
      'chicago': 'ORD', 'austin': 'AUS', 'las vegas': 'LAS',
      'san francisco': 'SFO', 'denver': 'DEN', 'new york': 'JFK',
      'nyc': 'JFK', 'boston': 'BOS', 'seattle': 'SEA',
      'los angeles': 'LAX', 'miami': 'MIA',
      'atlanta': 'ATL', 'dallas': 'DFW', 'houston': 'IAH',
      'phoenix': 'PHX', 'portland': 'PDX',
    };

    const travelNeeds: TravelNeed[] = [];

    for (const event of events) {
      const searchText = `${event.title} ${event.description ?? ''} ${event.location ?? ''}`.toLowerCase();
      const homeCityLower = userHomeCity.toLowerCase();

      // Check if event mentions a city that is not the home city.
      // Use word-boundary regex to avoid substring false positives.
      let detectedCity: string | null = null;
      for (const city of travelCities) {
        const regex = new RegExp(`\\b${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(searchText) && !regex.test(homeCityLower)) {
          if (cityAirportMap[city]) {
            detectedCity = city;
            break;
          }
        }
      }

      // If no city found, check for travel context keywords (conference, offsite, etc.)
      // These alone aren't enough — they just indicate the event MIGHT be travel
      if (!detectedCity) {
        const hasContext = travelContextKeywords.some((kw) => searchText.includes(kw));
        if (!hasContext) {
          // No city detected and no travel context — skip checking location
        }
      }

      // Also check for explicit location patterns with word boundaries
      if (!detectedCity && event.location) {
        const locationLower = event.location.toLowerCase();
        for (const [city] of Object.entries(cityAirportMap)) {
          const regex = new RegExp(`\\b${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
          if (regex.test(locationLower) && !regex.test(homeCityLower)) {
            detectedCity = city;
            break;
          }
        }
      }

      if (!detectedCity) continue;

      const startDate = new Date(event.startTime);
      const endDate = new Date(event.endTime);
      const now = new Date();
      const daysUntil = Math.floor((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      let urgency: TravelUrgency = 'low';
      if (daysUntil < 3) urgency = 'critical';
      else if (daysUntil < 7) urgency = 'high';
      else if (daysUntil < 14) urgency = 'medium';

      // Depart the day before if event is in the morning
      const departureDate = new Date(startDate);
      if (startDate.getHours() < 12) {
        departureDate.setDate(departureDate.getDate() - 1);
      }

      // Return the evening of the last day or next morning
      const returnDate = new Date(endDate);
      if (endDate.getHours() >= 15) {
        returnDate.setDate(returnDate.getDate() + 1);
      }

      const destAirport = cityAirportMap[detectedCity] ?? '';
      const cityName = detectedCity.charAt(0).toUpperCase() + detectedCity.slice(1);

      travelNeeds.push({
        id: uuidv4(),
        userId: event.userId,
        calendarEventId: event.id,
        eventTitle: event.title,
        destinationCity: cityName,
        destinationAirport: destAirport,
        originCity: userHomeCity,
        originAirport: userHomeAirport,
        departureDate: departureDate.toISOString().split('T')[0]!,
        returnDate: returnDate.toISOString().split('T')[0]!,
        urgency,
        confidence: 0.85,
        reasoning: `Event "${event.title}" mentions ${cityName}, which is different from home city ${userHomeCity}. Location: ${event.location ?? 'not specified'}.`,
        requiresFlight: true,
        createdAt: new Date().toISOString(),
      });
    }

    return travelNeeds;
  }
}
