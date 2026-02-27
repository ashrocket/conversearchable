import { google, type calendar_v3 } from 'googleapis';
import { v4 as uuidv4 } from 'uuid';
import { getConfig } from '../config/index.js';
import type { ConnectedCalendar, CalendarEvent } from '../types/index.js';

/**
 * Google Calendar integration via OAuth2.
 * Handles the OAuth flow and event fetching.
 */
export class GoogleCalendarService {
  private oauth2Client;

  constructor() {
    const config = getConfig();
    this.oauth2Client = new google.auth.OAuth2(
      config.GOOGLE_CLIENT_ID,
      config.GOOGLE_CLIENT_SECRET,
      config.GOOGLE_REDIRECT_URI
    );
  }

  /**
   * Generate the OAuth2 authorization URL for the user to visit.
   */
  getAuthUrl(userId: string): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events.readonly',
      ],
      state: userId,
      prompt: 'consent',
    });
  }

  /**
   * Exchange the authorization code for tokens.
   */
  async handleCallback(
    code: string,
    userId: string
  ): Promise<ConnectedCalendar> {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);

    // Get the user's primary calendar info
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    const calendarList = await calendar.calendarList.list();
    const primary = calendarList.data.items?.find((c) => c.primary) ?? calendarList.data.items?.[0];

    const now = new Date().toISOString();
    const connected: ConnectedCalendar = {
      id: uuidv4(),
      userId,
      provider: 'google',
      calendarId: primary?.id ?? 'primary',
      calendarName: primary?.summary ?? 'Google Calendar',
      accessToken: tokens.access_token ?? '',
      refreshToken: tokens.refresh_token ?? '',
      tokenExpiry: tokens.expiry_date
        ? new Date(tokens.expiry_date).toISOString()
        : now,
      isActive: true,
      lastSyncedAt: now,
    };

    return connected;
  }

  /**
   * Fetch upcoming events from a connected Google Calendar.
   */
  async fetchEvents(
    connectedCalendar: ConnectedCalendar,
    daysAhead: number = 30
  ): Promise<CalendarEvent[]> {
    this.oauth2Client.setCredentials({
      access_token: connectedCalendar.accessToken,
      refresh_token: connectedCalendar.refreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    const now = new Date();
    const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    const response = await calendar.events.list({
      calendarId: connectedCalendar.calendarId,
      timeMin: now.toISOString(),
      timeMax: future.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 100,
    });

    return (response.data.items ?? []).map((event) =>
      this.mapGoogleEvent(event, connectedCalendar)
    );
  }

  private mapGoogleEvent(
    event: calendar_v3.Schema$Event,
    cal: ConnectedCalendar
  ): CalendarEvent {
    return {
      id: event.id ?? uuidv4(),
      calendarId: cal.id,
      userId: cal.userId,
      title: event.summary ?? '(No title)',
      description: event.description ?? undefined,
      location: event.location ?? undefined,
      startTime: event.start?.dateTime ?? event.start?.date ?? new Date().toISOString(),
      endTime: event.end?.dateTime ?? event.end?.date ?? new Date().toISOString(),
      attendees: (event.attendees ?? [])
        .map((a) => a.email)
        .filter((e): e is string => !!e),
      isAllDay: !event.start?.dateTime,
      recurrence: event.recurrence?.join(';'),
      raw: event as unknown as Record<string, unknown>,
    };
  }
}
