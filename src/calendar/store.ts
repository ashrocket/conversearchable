import type { ConnectedCalendar, CalendarEvent, TravelNeed } from '../types/index.js';

/**
 * In-memory store for calendar data, events, and detected travel needs.
 */
class CalendarStore {
  private calendars: Map<string, ConnectedCalendar> = new Map();
  private events: Map<string, CalendarEvent> = new Map();
  private travelNeeds: Map<string, TravelNeed> = new Map();

  // ---- Calendars ----

  saveCalendar(cal: ConnectedCalendar): void {
    this.calendars.set(cal.id, cal);
  }

  getCalendar(id: string): ConnectedCalendar | undefined {
    return this.calendars.get(id);
  }

  getCalendarsForUser(userId: string): ConnectedCalendar[] {
    return Array.from(this.calendars.values()).filter((c) => c.userId === userId);
  }

  // ---- Events ----

  saveEvents(events: CalendarEvent[]): void {
    for (const event of events) {
      this.events.set(event.id, event);
    }
  }

  getEventsForUser(userId: string): CalendarEvent[] {
    return Array.from(this.events.values())
      .filter((e) => e.userId === userId)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }

  getEvent(id: string): CalendarEvent | undefined {
    return this.events.get(id);
  }

  // ---- Travel Needs ----

  saveTravelNeeds(needs: TravelNeed[]): void {
    for (const need of needs) {
      this.travelNeeds.set(need.id, need);
    }
  }

  getTravelNeedsForUser(userId: string): TravelNeed[] {
    return Array.from(this.travelNeeds.values())
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime());
  }

  getTravelNeed(id: string): TravelNeed | undefined {
    return this.travelNeeds.get(id);
  }
}

export const calendarStore = new CalendarStore();
