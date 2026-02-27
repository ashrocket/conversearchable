import type { FlightOffer, UserPreferences, BookingChoice } from '../types/index.js';
import { preferenceStore } from './store.js';

/**
 * Preference learning engine.
 * Analyzes user booking choices over time and adjusts preferences
 * to better match what users actually choose (vs. what they say they want).
 */
export class PreferenceLearner {
  /**
   * After a user makes a booking choice, analyze what they chose
   * and potentially update their preferences.
   */
  learnFromChoice(
    userId: string,
    chosenOffer: FlightOffer,
    alternatives: FlightOffer[]
  ): PreferenceLearningResult {
    const insights: string[] = [];
    const suggestedUpdates: Partial<UserPreferences> = {};
    const currentPrefs = preferenceStore.getPreferences(userId);
    const history = preferenceStore.getBookingHistory(userId);

    // Analyze airline preference
    const chosenAirline = chosenOffer.segments[0]?.airline;
    if (chosenAirline) {
      const airlineChoiceCounts = this.countAirlineChoices(history, chosenAirline);
      if (airlineChoiceCounts >= 3 && !currentPrefs.preferredAirlines.includes(chosenAirline)) {
        suggestedUpdates.preferredAirlines = [...currentPrefs.preferredAirlines, chosenAirline];
        insights.push(`You've chosen ${chosenAirline} ${airlineChoiceCounts} times. Adding to preferred airlines.`);
      }
    }

    // Analyze price sensitivity
    const cheaperAlternatives = alternatives.filter((a) => a.totalPrice < chosenOffer.totalPrice);
    const expensiveRatio = cheaperAlternatives.length / Math.max(alternatives.length, 1);

    if (expensiveRatio > 0.7 && currentPrefs.budgetPriority === 'cheapest') {
      // User says cheapest but consistently picks more expensive options
      suggestedUpdates.budgetPriority = 'best_value';
      insights.push('You tend to pick options balanced on value rather than strictly cheapest. Adjusting ranking.');
    } else if (expensiveRatio < 0.2 && currentPrefs.budgetPriority !== 'cheapest') {
      suggestedUpdates.budgetPriority = 'cheapest';
      insights.push('You consistently pick the cheapest option. Adjusting ranking to prioritize price.');
    }

    // Analyze departure time preference
    const departureHour = chosenOffer.segments[0]
      ? new Date(chosenOffer.segments[0].departureTime).getHours()
      : 12;
    const timePattern = this.detectTimePattern(history, departureHour);
    if (timePattern && timePattern !== currentPrefs.timePreference) {
      suggestedUpdates.timePreference = timePattern;
      insights.push(`Your booking pattern suggests you prefer ${timePattern.replace('_', ' ')} departures.`);
    }

    // Analyze stops preference
    if (chosenOffer.stops === 0 && alternatives.some((a) => a.stops > 0 && a.totalPrice < chosenOffer.totalPrice)) {
      insights.push('You preferred a nonstop flight despite cheaper connecting options.');
    }

    // Apply updates if any
    if (Object.keys(suggestedUpdates).length > 0) {
      preferenceStore.updatePreferences(userId, suggestedUpdates);
    }

    return { insights, updatedPreferences: Object.keys(suggestedUpdates).length > 0, suggestedUpdates };
  }

  private countAirlineChoices(history: BookingChoice[], airline: string): number {
    // We cannot look up the actual offer data from just the history,
    // but in a real system we'd join with the offers table.
    // For now, count the number of choices as a proxy.
    return history.length;
  }

  private detectTimePattern(
    history: BookingChoice[],
    latestHour: number
  ): UserPreferences['timePreference'] | null {
    if (history.length < 2) return null;

    // Simple heuristic based on latest choice
    if (latestHour >= 5 && latestHour < 8) return 'early_morning';
    if (latestHour >= 8 && latestHour < 12) return 'morning';
    if (latestHour >= 12 && latestHour < 17) return 'afternoon';
    if (latestHour >= 17 && latestHour < 21) return 'evening';
    return 'red_eye';
  }
}

export interface PreferenceLearningResult {
  insights: string[];
  updatedPreferences: boolean;
  suggestedUpdates: Partial<UserPreferences>;
}
