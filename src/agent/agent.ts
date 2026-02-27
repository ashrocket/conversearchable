import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';
import { getConfig } from '../config/index.js';
import { SYSTEM_PROMPT } from './prompts.js';
import { MockCalendarService, EventAnalyzer, calendarStore } from '../calendar/index.js';
import { DuffelFlightService, rankFlights, generateHonestComparison } from '../flights/index.js';
import { GeocodingService } from '../locations/index.js';
import { preferenceStore, PreferenceLearner } from '../preferences/index.js';
import { userStore } from '../users/index.js';
import { GroupTravelCoordinator } from './coordinator.js';
import type { GroupTravelPlan, MemberAssignment } from './coordinator.js';
import type {
  ChatMessage,
  Conversation,
  TravelNeed,
  FlightSearchResult,
  User,
} from '../types/index.js';

// ---- Group Flow Types ----

interface ConferenceInfo {
  title: string;
  city: string;
  airport: string;
  startDate: string;
  endDate: string;
}

interface GroupFlowState {
  step: 'conferences_detected' | 'awaiting_team' | 'showing_results' | 'awaiting_approval' | 'complete';
  conferences: ConferenceInfo[];
  teamMembers?: Array<{ userId: string; name: string; homeAirport: string; homeCity: string }>;
  orgId?: string;
  plans?: GroupTravelPlan[];
  backToBackNote?: string;
}

/**
 * The core LLM-powered travel agent.
 * Orchestrates calendar analysis, flight search, and user interaction.
 */
export class TravelAgent {
  private anthropic: Anthropic | null = null;
  private conversations: Map<string, Conversation> = new Map();
  private flightService = new DuffelFlightService();
  private calendarService = new MockCalendarService();
  private eventAnalyzer = new EventAnalyzer();
  private geocoding = new GeocodingService();
  private preferenceLearner = new PreferenceLearner();
  private coordinator = new GroupTravelCoordinator();

  // Cache of recent flight searches per user
  private searchCache: Map<string, FlightSearchResult[]> = new Map();

  // Group travel flow state per user
  private groupFlowState: Map<string, GroupFlowState> = new Map();

  private getClient(): Anthropic {
    if (!this.anthropic) {
      const config = getConfig();
      this.anthropic = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });
    }
    return this.anthropic;
  }

  /**
   * Start or retrieve a conversation for a user.
   */
  getOrCreateConversation(userId: string): Conversation {
    // Find existing active conversation
    for (const conv of this.conversations.values()) {
      if (conv.userId === userId) return conv;
    }

    const now = new Date().toISOString();
    const conv: Conversation = {
      id: uuidv4(),
      userId,
      title: 'Travel Planning',
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
    this.conversations.set(conv.id, conv);
    return conv;
  }

  /**
   * Process a user message and generate a response.
   * This is the main entry point for the conversational interface.
   */
  async chat(userId: string, userMessage: string): Promise<ChatMessage> {
    const conversation = this.getOrCreateConversation(userId);
    const now = new Date().toISOString();

    // Store the user message
    const userMsg: ChatMessage = {
      id: uuidv4(),
      conversationId: conversation.id,
      role: 'user',
      content: userMessage,
      timestamp: now,
    };
    conversation.messages.push(userMsg);

    // Process the message and generate a response
    const responseContent = await this.processMessage(userId, userMessage, conversation);

    const assistantMsg: ChatMessage = {
      id: uuidv4(),
      conversationId: conversation.id,
      role: 'assistant',
      content: responseContent,
      timestamp: new Date().toISOString(),
    };
    conversation.messages.push(assistantMsg);
    conversation.updatedAt = new Date().toISOString();

    return assistantMsg;
  }

  /**
   * Proactively scan a user's calendar and identify travel needs.
   */
  async scanCalendar(userId: string): Promise<{
    travelNeeds: TravelNeed[];
    summary: string;
  }> {
    const user = userStore.getUserById(userId);
    const homeCity = user?.homeCity ?? 'New York';
    const homeAirport = user?.homeAirport ?? 'JFK';

    // Ensure calendar is connected (mock)
    let calendars = this.calendarService.getCalendarsForUser(userId);
    if (calendars.length === 0) {
      this.calendarService.connectCalendar(userId);
      calendars = this.calendarService.getCalendarsForUser(userId);
    }

    // Fetch events
    const events = this.calendarService.fetchEvents(userId, 30);
    calendarStore.saveEvents(events);

    // Analyze for travel needs
    const travelNeeds = await this.eventAnalyzer.analyzeEvents(events, homeCity, homeAirport);
    calendarStore.saveTravelNeeds(travelNeeds);

    // Generate summary
    let summary: string;
    if (travelNeeds.length === 0) {
      summary = 'I scanned your upcoming calendar events and did not detect any that require travel. If I missed something, let me know and I can search flights manually.';
    } else {
      const needsList = travelNeeds
        .map((n) => {
          const urgencyEmoji: Record<string, string> = {
            critical: '[URGENT]',
            high: '[SOON]',
            medium: '',
            low: '',
          };
          return `- ${urgencyEmoji[n.urgency] ?? ''} "${n.eventTitle}" -> ${n.destinationCity} (depart ${n.departureDate}${n.returnDate ? `, return ${n.returnDate}` : ''}) [${Math.round(n.confidence * 100)}% confidence]`;
        })
        .join('\n');

      summary = `I found ${travelNeeds.length} upcoming event${travelNeeds.length > 1 ? 's' : ''} that ${travelNeeds.length > 1 ? 'appear' : 'appears'} to require travel:\n\n${needsList}\n\nWould you like me to search for flights for any of these trips? I can also adjust if I misidentified anything.`;
    }

    return { travelNeeds, summary };
  }

  /**
   * Search flights for a specific travel need.
   */
  async searchFlightsForNeed(
    userId: string,
    travelNeed: TravelNeed
  ): Promise<string> {
    const prefs = preferenceStore.getPreferences(userId);
    const originAirport = travelNeed.originAirport ?? this.geocoding.resolveAirport(travelNeed.originCity) ?? 'JFK';
    const destAirport = travelNeed.destinationAirport ?? this.geocoding.resolveAirport(travelNeed.destinationCity);

    if (!destAirport) {
      return `I could not determine the airport for ${travelNeed.destinationCity}. Could you tell me which airport you'd fly into?`;
    }

    // Check if flight is even needed
    const distance = await this.geocoding.calculateTravelDistance(
      travelNeed.originCity,
      travelNeed.destinationCity
    );

    let distanceNote = '';
    if (distance && !distance.recommendFlight) {
      distanceNote = `\nNote: ${travelNeed.destinationCity} is about ${distance.distanceMiles} miles away (roughly ${Math.round(distance.estimatedDrivingMinutes / 60)} hours driving). You might consider driving instead of flying. But here are flight options if you prefer:\n`;
    }

    const result = await this.flightService.search({
      origin: originAirport,
      destination: destAirport,
      departureDate: travelNeed.departureDate,
      returnDate: travelNeed.returnDate,
      passengers: 1,
      cabinClass: prefs.preferredCabin,
      maxPrice: prefs.maxBudget,
      preferredAirlines: prefs.preferredAirlines.length > 0 ? prefs.preferredAirlines : undefined,
    });

    // Cache the search result
    const userSearches = this.searchCache.get(userId) ?? [];
    userSearches.push(result);
    this.searchCache.set(userId, userSearches);

    // Rank the results
    const ranked = rankFlights(result.offers, prefs);
    const comparison = generateHonestComparison(ranked);

    return `${distanceNote}${comparison}`;
  }

  /**
   * Process a message using LLM or rule-based logic.
   */
  private async processMessage(
    userId: string,
    message: string,
    conversation: Conversation
  ): Promise<string> {
    const config = getConfig();
    const messageLower = message.toLowerCase();

    // Group travel flow: active state takes priority
    const activeFlow = this.groupFlowState.get(userId);
    if (activeFlow && activeFlow.step !== 'complete') {
      return this.handleGroupFlowMessage(userId, messageLower, activeFlow);
    }

    // Group travel flow: detect new request
    if (this.isGroupTravelRequest(messageLower)) {
      return this.startGroupFlow(userId);
    }

    // Handle specific commands/intents with direct logic
    if (this.isCalendarScanRequest(messageLower)) {
      const { summary } = await this.scanCalendar(userId);
      return summary;
    }

    if (this.isFlightSearchRequest(messageLower)) {
      return this.handleFlightSearchMessage(userId, message);
    }

    if (this.isPreferenceUpdate(messageLower)) {
      return this.handlePreferenceMessage(userId, message);
    }

    if (this.isHelpRequest(messageLower)) {
      return this.getHelpMessage();
    }

    // For general conversation, use the LLM
    if (!config.USE_MOCK_LLM) {
      return this.llmChat(userId, conversation);
    }

    // Mock LLM fallback: simple rule-based responses
    return this.mockResponse(userId, message);
  }

  private async llmChat(userId: string, conversation: Conversation): Promise<string> {
    const client = this.getClient();
    const user = userStore.getUserById(userId);
    const prefs = preferenceStore.getPreferences(userId);
    const travelNeeds = calendarStore.getTravelNeedsForUser(userId);

    const contextMessage = `
Current user: ${user?.name ?? 'Unknown'} (${user?.email ?? 'unknown'})
Home city: ${user?.homeCity ?? 'Not set'} (Airport: ${user?.homeAirport ?? 'Not set'})
Preferences: ${JSON.stringify(prefs, null, 2)}
Detected travel needs: ${travelNeeds.length > 0 ? JSON.stringify(travelNeeds, null, 2) : 'None detected yet (calendar may need scanning)'}
`;

    const messages = conversation.messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // Prepend context as a system-like user message if first message
    if (messages.length === 1) {
      messages.unshift({
        role: 'user' as const,
        content: `[Context for this conversation]\n${contextMessage}\n\n[User's message follows]`,
      });
      messages.unshift({
        role: 'assistant' as const,
        content: 'Understood, I have the user\'s context. I\'ll provide honest, helpful travel assistance.',
      });
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages,
    });

    const text = response.content[0];
    return text?.type === 'text' ? text.text : 'I encountered an issue processing your request. Please try again.';
  }

  /**
   * Handle a direct flight search request parsed from the message.
   */
  private async handleFlightSearchMessage(userId: string, message: string): Promise<string> {
    // Try to find a travel need to search for
    const travelNeeds = calendarStore.getTravelNeedsForUser(userId);

    if (travelNeeds.length > 0) {
      // Search for the most urgent need
      const sortedNeeds = [...travelNeeds].sort((a, b) => {
        const urgencyOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
        return (urgencyOrder[a.urgency] ?? 4) - (urgencyOrder[b.urgency] ?? 4);
      });

      const topNeed = sortedNeeds[0]!;
      const result = await this.searchFlightsForNeed(userId, topNeed);
      return `Searching flights for "${topNeed.eventTitle}" in ${topNeed.destinationCity}...\n\n${result}`;
    }

    // No travel needs detected, try to parse from message
    return 'I don\'t have any travel needs detected from your calendar yet. You can:\n\n1. Say "scan my calendar" to check for upcoming travel\n2. Tell me directly: "Search flights from JFK to ORD on March 15"\n3. Give me a city pair: "I need to get to Chicago next Tuesday"';
  }

  /**
   * Handle preference update messages.
   */
  private handlePreferenceMessage(userId: string, message: string): string {
    const messageLower = message.toLowerCase();
    const updates: Record<string, unknown> = {};
    const confirmations: string[] = [];

    if (messageLower.includes('aisle')) {
      updates.seatPreference = 'aisle';
      confirmations.push('seat preference to aisle');
    } else if (messageLower.includes('window')) {
      updates.seatPreference = 'window';
      confirmations.push('seat preference to window');
    }

    if (messageLower.includes('morning') && !messageLower.includes('early')) {
      updates.timePreference = 'morning';
      confirmations.push('departure time to morning (8am-12pm)');
    } else if (messageLower.includes('early morning')) {
      updates.timePreference = 'early_morning';
      confirmations.push('departure time to early morning (5am-8am)');
    } else if (messageLower.includes('afternoon')) {
      updates.timePreference = 'afternoon';
      confirmations.push('departure time to afternoon (12pm-5pm)');
    } else if (messageLower.includes('evening')) {
      updates.timePreference = 'evening';
      confirmations.push('departure time to evening (5pm-9pm)');
    } else if (messageLower.includes('red eye') || messageLower.includes('red-eye')) {
      updates.timePreference = 'red_eye';
      confirmations.push('departure time to red-eye (after 9pm)');
    }

    if (messageLower.includes('cheapest') || messageLower.includes('budget')) {
      updates.budgetPriority = 'cheapest';
      confirmations.push('budget priority to cheapest');
    } else if (messageLower.includes('best experience') || messageLower.includes('premium')) {
      updates.budgetPriority = 'best_experience';
      confirmations.push('budget priority to best experience');
    }

    const airlinePatterns = [
      { pattern: /united/i, code: 'UA' },
      { pattern: /american/i, code: 'AA' },
      { pattern: /delta/i, code: 'DL' },
      { pattern: /southwest/i, code: 'WN' },
      { pattern: /jetblue/i, code: 'B6' },
      { pattern: /alaska/i, code: 'AS' },
    ];

    for (const { pattern, code } of airlinePatterns) {
      if (pattern.test(message)) {
        const current = preferenceStore.getPreferences(userId);
        if (messageLower.includes('avoid') || messageLower.includes('don\'t') || messageLower.includes('never')) {
          updates.avoidAirlines = [...new Set([...current.avoidAirlines, code])];
          confirmations.push(`added ${code} to avoided airlines`);
        } else {
          updates.preferredAirlines = [...new Set([...current.preferredAirlines, code])];
          confirmations.push(`added ${code} to preferred airlines`);
        }
      }
    }

    if (confirmations.length > 0) {
      preferenceStore.updatePreferences(userId, updates as Partial<typeof updates & { userId: string; updatedAt: string }>);
      return `Updated your preferences:\n${confirmations.map((c) => `- ${c}`).join('\n')}\n\nThese will be applied to all future flight searches.`;
    }

    return 'I\'m not sure what preference you want to update. You can tell me things like:\n- "I prefer aisle seats"\n- "I like morning flights"\n- "I want the cheapest option"\n- "I prefer United"\n- "Avoid Spirit"';
  }

  private getHelpMessage(): string {
    return `Welcome to BusinessTravelSearch! Here's what I can do:

**Calendar & Travel Detection**
- "Scan my calendar" - I'll check your upcoming events for travel needs
- "What trips do I have coming up?" - See detected travel

**Flight Search**
- "Search flights" - I'll search for your most urgent detected trip
- "Find flights from JFK to ORD on March 15" - Direct search
- "I need to get to Chicago next Tuesday" - Natural language search

**Preferences**
- "I prefer United" - Set preferred airline
- "I like morning flights" - Set time preference
- "I want aisle seats" - Set seat preference
- "Find me the cheapest option" - Set budget priority

**General**
- Ask me anything about travel planning
- I'll always give you honest, unbiased recommendations
- I link directly to airlines for booking - no hidden markups`;
  }

  /**
   * Fallback mock responses when LLM is not available.
   */
  private async mockResponse(userId: string, message: string): Promise<string> {
    const messageLower = message.toLowerCase();

    // Greetings
    if (this.isGreeting(messageLower)) {
      const user = userStore.getUserById(userId);
      const name = user?.name?.split(' ')[0] ?? 'there';
      return `Hello ${name}! I'm your BusinessTravelSearch assistant. I can scan your calendar for upcoming travel, search for flights, and help you find the best options based on your preferences.\n\nWhat would you like to do? You can say "scan my calendar" to get started, or ask me to search for specific flights.`;
    }

    // Default
    return `I understand you're asking about: "${message}"\n\nHere's what I can help with:\n- Say "scan my calendar" to check for upcoming travel needs\n- Say "search flights" to find flights for detected trips\n- Say "help" for a full list of commands\n\nIn production, I'd use Claude to understand your request more naturally. For now, try one of the commands above.`;
  }

  // ---- Group Travel Flow ----

  private isGroupTravelRequest(msg: string): boolean {
    return /conference season|team travel|travel options for.*conference|group travel|plan.*conferences/i.test(msg);
  }

  /**
   * Start the conference season group flow.
   * Scans calendar, filters for conference events, enters state machine.
   */
  private async startGroupFlow(userId: string): Promise<string> {
    // Scan calendar first
    const { travelNeeds } = await this.scanCalendar(userId);

    // Filter for conference-type events
    const conferenceKeywords = /conference|summit|connect|disrupt|re:invent|expo|convention|keynote|hackathon/i;
    const conferenceNeeds = travelNeeds.filter((n) => conferenceKeywords.test(n.eventTitle));

    if (conferenceNeeds.length === 0) {
      return 'I scanned your calendar but didn\'t find any upcoming conferences. Try "scan my calendar" to see all detected travel, or tell me about a specific conference you\'re planning for.';
    }

    // Build conference info list
    const conferences: ConferenceInfo[] = conferenceNeeds.map((n) => ({
      title: n.eventTitle,
      city: n.destinationCity,
      airport: n.destinationAirport ?? this.geocoding.resolveAirport(n.destinationCity) ?? 'Unknown',
      startDate: n.departureDate,
      endDate: n.returnDate ?? n.departureDate,
    }));

    // Detect back-to-back opportunities
    let backToBackNote = '';
    const sorted = [...conferences].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    for (let i = 0; i < sorted.length - 1; i++) {
      const gap = (new Date(sorted[i + 1]!.startDate).getTime() - new Date(sorted[i]!.endDate).getTime()) / (1000 * 60 * 60 * 24);
      if (gap <= 5 && gap >= 0) {
        backToBackNote = `\n**Back-to-back alert:** "${sorted[i]!.title}" and "${sorted[i + 1]!.title}" are only ${Math.round(gap)} days apart — we can optimize flights between them.`;
      }
    }

    // Store state
    this.groupFlowState.set(userId, {
      step: 'conferences_detected',
      conferences,
      backToBackNote,
    });

    // Format the conference list
    const confList = conferences
      .map((c, i) => {
        const start = new Date(c.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const end = new Date(c.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `${i + 1}. **${c.title}** — ${c.city} (${c.airport}), ${start}–${end}`;
      })
      .join('\n');

    return `I found **${conferences.length} conferences** on your calendar:\n\n${confList}${backToBackNote}\n\nWho's going to these? You can say "the whole team" or assign specific people per conference.`;
  }

  /**
   * Handle messages while the group flow state machine is active.
   */
  private async handleGroupFlowMessage(userId: string, msg: string, state: GroupFlowState): Promise<string> {
    switch (state.step) {
      case 'conferences_detected':
        return this.handleTeamAssignment(userId, msg, state);
      case 'awaiting_team':
        return this.handleTeamAssignment(userId, msg, state);
      case 'showing_results':
        return this.handleApproval(userId, msg, state);
      case 'awaiting_approval':
        return this.handleApproval(userId, msg, state);
      default:
        this.groupFlowState.delete(userId);
        return 'Something went wrong with the group flow. Let\'s start over — say "conference season" to try again.';
    }
  }

  /**
   * Handle team assignment step: "the whole team", "everyone", or specific names.
   */
  private async handleTeamAssignment(userId: string, msg: string, state: GroupFlowState): Promise<string> {
    const isWholeTeam = /whole team|everyone|entire team|all of us|the team/i.test(msg);

    if (!isWholeTeam) {
      // Prompt again
      state.step = 'awaiting_team';
      this.groupFlowState.set(userId, state);
      return 'Just say "the whole team" to send everyone, or I can assign specific people per conference. Who\'s going?';
    }

    // Seed the demo org if needed
    const { orgId, memberIds } = userStore.seedDemoOrganization(userId);
    const members = memberIds
      .map((id) => userStore.getUserById(id))
      .filter((u): u is User => u !== undefined);

    const user = userStore.getUserById(userId);
    const allMembers = [
      { userId, name: user?.name ?? 'You', homeAirport: user?.homeAirport ?? 'JFK', homeCity: user?.homeCity ?? 'New York' },
      ...members.map((m) => ({
        userId: m.id,
        name: m.name,
        homeAirport: m.homeAirport ?? 'JFK',
        homeCity: m.homeCity ?? 'Unknown',
      })),
    ];

    state.teamMembers = allMembers;
    state.orgId = orgId;

    // Show the team
    const teamList = allMembers
      .map((m) => `- **${m.name}** — ${m.homeCity} (${m.homeAirport})`)
      .join('\n');

    // Now search flights for each conference
    state.step = 'showing_results';
    this.groupFlowState.set(userId, state);

    const searching = `Great! Here's your team:\n\n${teamList}\n\nSearching flights for ${state.conferences.length} conferences from each team member's home city...`;

    // Do the actual flight searches
    const plans: GroupTravelPlan[] = [];
    for (const conf of state.conferences) {
      const assignments: MemberAssignment[] = allMembers.map((m) => ({
        userId: m.userId,
        homeAirport: m.homeAirport,
      }));

      // Build minimal travel needs for the coordinator
      const travelNeeds: TravelNeed[] = [{
        id: uuidv4(),
        userId,
        calendarEventId: 'conf-' + conf.title,
        eventTitle: conf.title,
        destinationCity: conf.city,
        destinationAirport: conf.airport,
        originCity: user?.homeCity ?? 'New York',
        originAirport: user?.homeAirport ?? 'JFK',
        departureDate: conf.startDate,
        returnDate: conf.endDate,
        urgency: 'medium',
        confidence: 0.95,
        reasoning: 'Conference attendance',
        requiresFlight: true,
        createdAt: new Date().toISOString(),
      }];

      const plan = await this.coordinator.planGroupTravel(orgId, travelNeeds, assignments, conf.title);
      plans.push(plan);
    }

    state.plans = plans;
    state.step = 'awaiting_approval';
    this.groupFlowState.set(userId, state);

    // Format price grid
    const grid = this.formatConferenceResults(plans, allMembers, state.backToBackNote);

    return `${searching}\n\n${grid}\n\nShall I book all of these? Say **"approve"** or **"book it"** to confirm, or ask me to adjust.`;
  }

  /**
   * Handle approval step.
   */
  private handleApproval(userId: string, msg: string, state: GroupFlowState): string {
    const isApproval = /yes|approve|book it|confirm|go ahead|let's do it|book them/i.test(msg);

    if (!isApproval) {
      return 'Would you like me to book these flights? Say **"approve"** to confirm, or tell me what you\'d like to change.';
    }

    state.step = 'complete';
    this.groupFlowState.set(userId, state);

    return this.generateBookingConfirmation(state);
  }

  /**
   * Format a price grid showing per-member costs across all conferences.
   */
  private formatConferenceResults(
    plans: GroupTravelPlan[],
    members: Array<{ userId: string; name: string; homeAirport: string }>,
    backToBackNote?: string,
  ): string {
    let output = '**Conference Season Flight Summary**\n\n';
    let grandTotal = 0;

    for (const plan of plans) {
      const dates = new Date(plan.departureDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      output += `**${plan.eventTitle}** — ${plan.destination} (${dates})\n`;

      for (const memberPlan of plan.members) {
        const member = members.find((m) => m.userId === memberPlan.userId);
        const name = member?.name ?? memberPlan.userName;

        if (!memberPlan.recommendedFlight) {
          const reason = memberPlan.notes[0] ?? 'No flight needed';
          output += `  ${name}: ${reason}\n`;
        } else {
          const price = memberPlan.recommendedFlight.totalPrice;
          const airline = memberPlan.recommendedFlight.segments[0]?.airlineName ?? 'Unknown';
          const origin = member?.homeAirport ?? '???';
          output += `  ${name}: $${price} (${airline}, ${origin} -> ${plan.destinationAirport})\n`;
        }
      }

      output += `  **Subtotal: $${plan.totalEstimatedCost}**\n\n`;
      grandTotal += plan.totalEstimatedCost;
    }

    if (backToBackNote) {
      output += backToBackNote + '\n\n';
    }

    output += `**Grand Total: $${grandTotal}** for ${members.length} team members across ${plans.length} conferences`;

    return output;
  }

  /**
   * Generate a mock booking confirmation with virtual card.
   */
  private generateBookingConfirmation(state: GroupFlowState): string {
    const confirmationId = `BTS-${Date.now().toString(36).toUpperCase()}`;
    const cardLast4 = Math.floor(1000 + Math.random() * 9000);
    const cardLimit = state.plans?.reduce((sum, p) => sum + p.totalEstimatedCost, 0) ?? 0;
    const cardLimitFormatted = Math.ceil(cardLimit * 1.1); // 10% buffer

    const totalFlights = state.plans?.reduce((sum, p) => sum + p.members.filter((m) => m.recommendedFlight).length, 0) ?? 0;

    let output = `**Booking Confirmed!**\n\n`;
    output += `Confirmation: **${confirmationId}**\n`;
    output += `Flights booked: ${totalFlights}\n`;
    output += `Total cost: **$${cardLimit}**\n\n`;

    output += `**Virtual Visa Card Issued**\n`;
    output += `Card ending: ****${cardLast4}\n`;
    output += `Spending limit: $${cardLimitFormatted}\n`;
    output += `Category: Business Travel — Conferences\n`;
    output += `Auto-tags: ${state.conferences.map((c) => c.title).join(', ')}\n\n`;

    output += `**Expense Auto-Categorization**\n`;
    for (const plan of state.plans ?? []) {
      output += `- ${plan.eventTitle}: $${plan.totalEstimatedCost} -> "Conference Travel"\n`;
    }

    output += `\nAll team members will receive their itineraries via email. Have a great conference season!`;

    return output;
  }

  // ---- Intent detection helpers ----

  private isCalendarScanRequest(msg: string): boolean {
    return /scan.*calendar|check.*calendar|upcoming.*travel|what.*trips|my.*events/i.test(msg);
  }

  private isFlightSearchRequest(msg: string): boolean {
    return /search.*flight|find.*flight|book.*flight|flights? (from|to)|need.*fly|get to/i.test(msg);
  }

  private isPreferenceUpdate(msg: string): boolean {
    return /prefer|favorite|like|avoid|don't fly|budget|cheapest|aisle|window|morning|evening|red.eye/i.test(msg);
  }

  private isHelpRequest(msg: string): boolean {
    return /^(help|what can you do|commands|how|getting started)\??$/i.test(msg.trim());
  }

  private isGreeting(msg: string): boolean {
    return /^(hi|hello|hey|good morning|good afternoon|good evening|howdy|greetings|yo|sup)\b/i.test(msg.trim());
  }
}
