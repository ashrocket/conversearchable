import type { UserPreferences, BookingChoice } from '../types/index.js';

/**
 * In-memory store for user preferences and booking history.
 * Tracks what users choose over time to improve recommendations.
 */
class PreferenceStore {
  private preferences: Map<string, UserPreferences> = new Map();
  private bookingHistory: Map<string, BookingChoice[]> = new Map();

  /**
   * Get or create default preferences for a user.
   */
  getPreferences(userId: string): UserPreferences {
    const existing = this.preferences.get(userId);
    if (existing) return existing;

    const defaults: UserPreferences = {
      userId,
      preferredAirlines: [],
      loyaltyPrograms: {},
      seatPreference: 'no_preference',
      timePreference: 'no_preference',
      budgetPriority: 'best_value',
      maxLayoverMinutes: 180,
      preferredCabin: 'economy',
      avoidAirlines: [],
      preferredAirports: {},
      updatedAt: new Date().toISOString(),
    };

    this.preferences.set(userId, defaults);
    return defaults;
  }

  /**
   * Update user preferences.
   */
  updatePreferences(userId: string, updates: Partial<UserPreferences>): UserPreferences {
    const current = this.getPreferences(userId);
    const updated: UserPreferences = {
      ...current,
      ...updates,
      userId, // Never allow changing the userId
      updatedAt: new Date().toISOString(),
    };
    this.preferences.set(userId, updated);
    return updated;
  }

  /**
   * Record a booking choice for preference learning.
   */
  recordChoice(choice: BookingChoice): void {
    const existing = this.bookingHistory.get(choice.userId) ?? [];
    existing.push(choice);
    this.bookingHistory.set(choice.userId, existing);
  }

  /**
   * Get booking history for a user.
   */
  getBookingHistory(userId: string): BookingChoice[] {
    return this.bookingHistory.get(userId) ?? [];
  }
}

export const preferenceStore = new PreferenceStore();
