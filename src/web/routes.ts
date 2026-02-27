import { Router, type Request, type Response } from 'express';
import { registerUser, loginUser, verifyToken, getUserFromToken, userStore } from '../users/index.js';
import { TravelAgent } from '../agent/index.js';
import { GroupTravelCoordinator } from '../agent/coordinator.js';
import { preferenceStore } from '../preferences/index.js';
import { calendarStore, MockCalendarService } from '../calendar/index.js';
import type { ApiResponse } from '../types/index.js';

const router = Router();
const agent = new TravelAgent();
const coordinator = new GroupTravelCoordinator();
const mockCalendar = new MockCalendarService();

// ---- Middleware ----

function authenticate(req: Request, res: Response, next: () => void): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Authentication required', timestamp: new Date().toISOString() });
    return;
  }

  try {
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    (req as Request & { userId?: string }).userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token', timestamp: new Date().toISOString() });
  }
}

function getUserId(req: Request): string {
  return (req as Request & { userId?: string }).userId ?? '';
}

// ---- Auth Routes ----

router.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      res.status(400).json({
        success: false,
        error: 'email, password, and name are required',
        timestamp: new Date().toISOString(),
      } satisfies ApiResponse<never>);
      return;
    }

    const result = await registerUser(email, password, name);
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Registration failed';
    res.status(400).json({ success: false, error: msg, timestamp: new Date().toISOString() });
  }
});

router.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, error: 'email and password are required', timestamp: new Date().toISOString() });
      return;
    }

    const result = await loginUser(email, password);
    res.json({ success: true, data: result, timestamp: new Date().toISOString() });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Login failed';
    res.status(401).json({ success: false, error: msg, timestamp: new Date().toISOString() });
  }
});

router.get('/api/auth/me', authenticate, (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.slice(7) ?? '';
  const user = getUserFromToken(token);
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found', timestamp: new Date().toISOString() });
    return;
  }
  res.json({ success: true, data: user, timestamp: new Date().toISOString() });
});

// ---- Chat Routes ----

router.post('/api/chat', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ success: false, error: 'message is required', timestamp: new Date().toISOString() });
      return;
    }

    const response = await agent.chat(userId, message);
    res.json({ success: true, data: response, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('[Chat] Error:', error);
    const msg = error instanceof Error ? error.message : 'Chat processing failed';
    res.status(500).json({ success: false, error: msg, timestamp: new Date().toISOString() });
  }
});

// ---- Calendar Routes ----

router.post('/api/calendar/connect', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { calendarName } = req.body;

    const cal = mockCalendar.connectCalendar(userId, calendarName ?? 'Work Calendar');
    calendarStore.saveCalendar(cal);

    res.json({ success: true, data: cal, timestamp: new Date().toISOString() });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to connect calendar';
    res.status(500).json({ success: false, error: msg, timestamp: new Date().toISOString() });
  }
});

router.get('/api/calendar/events', authenticate, (req: Request, res: Response) => {
  const userId = getUserId(req);
  const events = calendarStore.getEventsForUser(userId);
  res.json({ success: true, data: events, timestamp: new Date().toISOString() });
});

router.post('/api/calendar/scan', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const result = await agent.scanCalendar(userId);
    res.json({ success: true, data: result, timestamp: new Date().toISOString() });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Calendar scan failed';
    res.status(500).json({ success: false, error: msg, timestamp: new Date().toISOString() });
  }
});

router.get('/api/calendar/travel-needs', authenticate, (req: Request, res: Response) => {
  const userId = getUserId(req);
  const needs = calendarStore.getTravelNeedsForUser(userId);
  res.json({ success: true, data: needs, timestamp: new Date().toISOString() });
});

// ---- Flight Search Routes ----

router.post('/api/flights/search-for-need', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { travelNeedId } = req.body;

    if (!travelNeedId) {
      res.status(400).json({ success: false, error: 'travelNeedId is required', timestamp: new Date().toISOString() });
      return;
    }

    const need = calendarStore.getTravelNeed(travelNeedId);
    if (!need) {
      res.status(404).json({ success: false, error: 'Travel need not found', timestamp: new Date().toISOString() });
      return;
    }

    const result = await agent.searchFlightsForNeed(userId, need);
    res.json({ success: true, data: { summary: result }, timestamp: new Date().toISOString() });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Flight search failed';
    res.status(500).json({ success: false, error: msg, timestamp: new Date().toISOString() });
  }
});

// ---- Preferences Routes ----

router.get('/api/preferences', authenticate, (req: Request, res: Response) => {
  const userId = getUserId(req);
  const prefs = preferenceStore.getPreferences(userId);
  res.json({ success: true, data: prefs, timestamp: new Date().toISOString() });
});

router.put('/api/preferences', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const updates = req.body;
    const updated = preferenceStore.updatePreferences(userId, updates);
    res.json({ success: true, data: updated, timestamp: new Date().toISOString() });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to update preferences';
    res.status(400).json({ success: false, error: msg, timestamp: new Date().toISOString() });
  }
});

// ---- User Profile Routes ----

router.put('/api/profile', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { homeCity, homeAirport, name } = req.body;
    const updates: Record<string, unknown> = {};
    if (homeCity) updates.homeCity = homeCity;
    if (homeAirport) updates.homeAirport = homeAirport;
    if (name) updates.name = name;

    const user = userStore.updateUser(userId, updates);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found', timestamp: new Date().toISOString() });
      return;
    }

    const { passwordHash: _, ...safeUser } = user;
    res.json({ success: true, data: safeUser, timestamp: new Date().toISOString() });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to update profile';
    res.status(400).json({ success: false, error: msg, timestamp: new Date().toISOString() });
  }
});

// ---- Group Travel Routes ----

router.get('/api/group-travel/detect', authenticate, (req: Request, res: Response) => {
  const userId = getUserId(req);
  const user = userStore.getUserById(userId);
  if (!user?.organizationId) {
    res.json({ success: true, data: { groups: [] }, timestamp: new Date().toISOString() });
    return;
  }

  const groups = coordinator.detectGroupTravel(user.organizationId);
  const groupData = Array.from(groups.entries()).map(([key, needs]) => ({
    key,
    destination: needs[0]?.destinationCity ?? 'Unknown',
    date: needs[0]?.departureDate ?? 'Unknown',
    travelers: needs.length,
    needs,
  }));

  res.json({ success: true, data: { groups: groupData }, timestamp: new Date().toISOString() });
});

// ---- Health Check ----

router.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      version: '0.1.0',
      uptime: process.uptime(),
    },
    timestamp: new Date().toISOString(),
  });
});

export { router };
