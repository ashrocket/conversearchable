import { v4 as uuidv4 } from 'uuid';
import type { CalendarEvent, ConnectedCalendar } from '../types/index.js';

/**
 * Mock calendar service that provides realistic sample events
 * for development and demo purposes.
 */
export class MockCalendarService {
  private mockCalendars: Map<string, ConnectedCalendar> = new Map();

  /**
   * Simulate connecting a calendar.
   */
  connectCalendar(userId: string, calendarName: string = 'Work Calendar'): ConnectedCalendar {
    const now = new Date().toISOString();
    const cal: ConnectedCalendar = {
      id: uuidv4(),
      userId,
      provider: 'google',
      calendarId: `mock-${uuidv4()}`,
      calendarName,
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      tokenExpiry: new Date(Date.now() + 3600 * 1000).toISOString(),
      isActive: true,
      lastSyncedAt: now,
    };
    this.mockCalendars.set(cal.id, cal);
    return cal;
  }

  /**
   * Get all calendars connected by a user.
   */
  getCalendarsForUser(userId: string): ConnectedCalendar[] {
    return Array.from(this.mockCalendars.values()).filter((c) => c.userId === userId);
  }

  /**
   * Generate realistic mock events including several that imply travel.
   */
  fetchEvents(userId: string, _daysAhead: number = 30): CalendarEvent[] {
    const calendars = this.getCalendarsForUser(userId);
    const calendarId = calendars[0]?.id ?? 'default';
    const now = new Date();

    const events: CalendarEvent[] = [
      // Travel-implying events
      {
        id: uuidv4(),
        calendarId,
        userId,
        title: 'Client Meeting - Chicago Office',
        description: 'Quarterly review with Acme Corp leadership team at their Chicago headquarters',
        location: '233 S Wacker Dr, Chicago, IL 60606',
        startTime: addDays(now, 5, 10, 0).toISOString(),
        endTime: addDays(now, 5, 16, 0).toISOString(),
        attendees: ['john@acmecorp.com', 'sarah@acmecorp.com'],
        isAllDay: false,
      },
      {
        id: uuidv4(),
        calendarId,
        userId,
        title: 'QBR with DataFlow Inc - Austin',
        description: 'Quarterly business review. Meeting at their new Austin campus.',
        location: 'DataFlow Inc, 500 W 2nd St, Austin, TX 78701',
        startTime: addDays(now, 12, 9, 0).toISOString(),
        endTime: addDays(now, 12, 17, 0).toISOString(),
        attendees: ['mike@dataflow.io'],
        isAllDay: false,
      },
      {
        id: uuidv4(),
        calendarId,
        userId,
        title: 'Annual Sales Conference - Las Vegas',
        description: 'Company-wide annual sales kickoff at The Venetian',
        location: 'The Venetian Resort, Las Vegas, NV',
        startTime: addDays(now, 20, 8, 0).toISOString(),
        endTime: addDays(now, 22, 18, 0).toISOString(),
        attendees: [],
        isAllDay: false,
      },
      {
        id: uuidv4(),
        calendarId,
        userId,
        title: 'Board Meeting - San Francisco',
        description: 'Monthly board meeting at SF headquarters',
        location: '1 Market St, San Francisco, CA 94105',
        startTime: addDays(now, 8, 14, 0).toISOString(),
        endTime: addDays(now, 8, 17, 0).toISOString(),
        attendees: ['ceo@company.com', 'cfo@company.com'],
        isAllDay: false,
      },
      {
        id: uuidv4(),
        calendarId,
        userId,
        title: 'Engineering Team Offsite - Denver',
        description: 'Two-day engineering team offsite and hackathon',
        location: 'WeWork, 1550 Wewatta St, Denver, CO',
        startTime: addDays(now, 15, 9, 0).toISOString(),
        endTime: addDays(now, 16, 17, 0).toISOString(),
        attendees: ['eng-team@company.com'],
        isAllDay: false,
      },

      // Non-travel events (local)
      {
        id: uuidv4(),
        calendarId,
        userId,
        title: 'Weekly Team Standup',
        description: 'Regular Monday standup',
        location: 'Conference Room A',
        startTime: addDays(now, 1, 9, 30).toISOString(),
        endTime: addDays(now, 1, 10, 0).toISOString(),
        attendees: ['team@company.com'],
        isAllDay: false,
      },
      {
        id: uuidv4(),
        calendarId,
        userId,
        title: 'Lunch with Product Team',
        description: 'Casual lunch to discuss roadmap',
        startTime: addDays(now, 3, 12, 0).toISOString(),
        endTime: addDays(now, 3, 13, 0).toISOString(),
        attendees: [],
        isAllDay: false,
      },
      {
        id: uuidv4(),
        calendarId,
        userId,
        title: '1:1 with Manager',
        description: 'Regular 1:1',
        startTime: addDays(now, 2, 14, 0).toISOString(),
        endTime: addDays(now, 2, 14, 30).toISOString(),
        attendees: ['manager@company.com'],
        isAllDay: false,
      },
      {
        id: uuidv4(),
        calendarId,
        userId,
        title: 'Dentist Appointment',
        description: 'Regular checkup',
        location: '456 Main St',
        startTime: addDays(now, 4, 15, 0).toISOString(),
        endTime: addDays(now, 4, 16, 0).toISOString(),
        attendees: [],
        isAllDay: false,
      },
      {
        id: uuidv4(),
        calendarId,
        userId,
        title: 'Sprint Planning',
        description: 'Sprint 14 planning session',
        location: 'Zoom',
        startTime: addDays(now, 6, 10, 0).toISOString(),
        endTime: addDays(now, 6, 11, 30).toISOString(),
        attendees: ['eng-team@company.com'],
        isAllDay: false,
      },

      // Conference season events (for group travel demo)
      {
        id: uuidv4(),
        calendarId,
        userId,
        title: 'SaaS Connect West 2026',
        description: 'Annual SaaS industry conference. Panels on PLG, pricing strategy, and partner ecosystems.',
        location: 'Moscone Center, 747 Howard St, San Francisco, CA 94103',
        startTime: addDays(now, 25, 8, 0).toISOString(),
        endTime: addDays(now, 27, 17, 0).toISOString(),
        attendees: ['events@saasconnect.io'],
        isAllDay: false,
      },
      {
        id: uuidv4(),
        calendarId,
        userId,
        title: 'TechCrunch Disrupt 2026',
        description: 'Startup showcase and networking. Our team is presenting at the enterprise track.',
        location: 'Las Vegas Convention Center, 3150 Paradise Rd, Las Vegas, NV 89109',
        startTime: addDays(now, 35, 9, 0).toISOString(),
        endTime: addDays(now, 37, 18, 0).toISOString(),
        attendees: ['speakers@techcrunch.com'],
        isAllDay: false,
      },
      {
        id: uuidv4(),
        calendarId,
        userId,
        title: 'Enterprise Connect Summit',
        description: 'Enterprise SaaS summit focused on collaboration and unified communications.',
        location: 'McCormick Place, 2301 S Lake Shore Dr, Chicago, IL 60616',
        startTime: addDays(now, 50, 8, 0).toISOString(),
        endTime: addDays(now, 52, 17, 0).toISOString(),
        attendees: ['info@enterpriseconnect.com'],
        isAllDay: false,
      },
      {
        id: uuidv4(),
        calendarId,
        userId,
        title: 'AWS re:Invent 2026',
        description: 'AWS annual conference. Full team attendance for cloud infrastructure track.',
        location: 'The Venetian Expo, 201 Sands Ave, Las Vegas, NV 89169',
        startTime: addDays(now, 55, 8, 0).toISOString(),
        endTime: addDays(now, 58, 18, 0).toISOString(),
        attendees: ['reinvent@amazon.com'],
        isAllDay: false,
      },
    ];

    return events;
  }
}

function addDays(base: Date, days: number, hours: number, minutes: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  d.setHours(hours, minutes, 0, 0);
  return d;
}
