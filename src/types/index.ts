import { z } from 'zod';

// ============================================================
// Core Domain Types for BusinessTravelSearch
// ============================================================

// ---- User & Organization ----

export const UserRoleSchema = z.enum(['admin', 'member', 'viewer']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  passwordHash: z.string(),
  organizationId: z.string().uuid().nullable(),
  role: UserRoleSchema.default('member'),
  homeAirport: z.string().length(3).optional(),
  homeCity: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type User = z.infer<typeof UserSchema>;

export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  domain: z.string().optional(),
  maxBudgetPerTrip: z.number().positive().optional(),
  preferredAirlines: z.array(z.string()).default([]),
  createdAt: z.string().datetime(),
});
export type Organization = z.infer<typeof OrganizationSchema>;

// ---- Calendar ----

export const CalendarProviderSchema = z.enum(['google', 'outlook', 'caldav']);
export type CalendarProvider = z.infer<typeof CalendarProviderSchema>;

export const ConnectedCalendarSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  provider: CalendarProviderSchema,
  calendarId: z.string(),
  calendarName: z.string(),
  accessToken: z.string(),
  refreshToken: z.string(),
  tokenExpiry: z.string().datetime(),
  isActive: z.boolean().default(true),
  lastSyncedAt: z.string().datetime().optional(),
});
export type ConnectedCalendar = z.infer<typeof ConnectedCalendarSchema>;

export const CalendarEventSchema = z.object({
  id: z.string(),
  calendarId: z.string(),
  userId: z.string().uuid(),
  title: z.string(),
  description: z.string().optional(),
  location: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  attendees: z.array(z.string().email()).default([]),
  isAllDay: z.boolean().default(false),
  recurrence: z.string().optional(),
  raw: z.record(z.unknown()).optional(),
});
export type CalendarEvent = z.infer<typeof CalendarEventSchema>;

// ---- Travel Detection ----

export const TravelUrgencySchema = z.enum(['low', 'medium', 'high', 'critical']);
export type TravelUrgency = z.infer<typeof TravelUrgencySchema>;

export const TravelNeedSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  calendarEventId: z.string(),
  eventTitle: z.string(),
  destinationCity: z.string(),
  destinationAirport: z.string().optional(),
  originCity: z.string(),
  originAirport: z.string().optional(),
  departureDate: z.string(),
  returnDate: z.string().optional(),
  urgency: TravelUrgencySchema,
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  requiresFlight: z.boolean(),
  estimatedDrivingMinutes: z.number().optional(),
  createdAt: z.string().datetime(),
});
export type TravelNeed = z.infer<typeof TravelNeedSchema>;

// ---- Locations ----

export const GeoCoordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export type GeoCoordinates = z.infer<typeof GeoCoordinatesSchema>;

export const KnownLocationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  city: z.string(),
  state: z.string().optional(),
  country: z.string().default('US'),
  nearestAirport: z.string().length(3),
  coordinates: GeoCoordinatesSchema.optional(),
  aliases: z.array(z.string()).default([]),
  organizationId: z.string().uuid().optional(),
});
export type KnownLocation = z.infer<typeof KnownLocationSchema>;

// ---- Flights ----

export const FlightSegmentSchema = z.object({
  airline: z.string(),
  airlineName: z.string(),
  flightNumber: z.string(),
  origin: z.string().length(3),
  originName: z.string(),
  destination: z.string().length(3),
  destinationName: z.string(),
  departureTime: z.string().datetime(),
  arrivalTime: z.string().datetime(),
  durationMinutes: z.number(),
  aircraft: z.string().optional(),
  cabin: z.string().optional(),
});
export type FlightSegment = z.infer<typeof FlightSegmentSchema>;

export const FlightOfferSchema = z.object({
  id: z.string(),
  source: z.string(),
  segments: z.array(FlightSegmentSchema).min(1),
  totalPrice: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  stops: z.number().min(0),
  totalDurationMinutes: z.number(),
  bookingUrl: z.string().url().optional(),
  deepLink: z.string().url().optional(),
  airlineDirectPrice: z.number().positive().optional(),
  expiresAt: z.string().datetime().optional(),
});
export type FlightOffer = z.infer<typeof FlightOfferSchema>;

export const FlightSearchRequestSchema = z.object({
  origin: z.string().length(3),
  destination: z.string().length(3),
  departureDate: z.string(),
  returnDate: z.string().optional(),
  passengers: z.number().int().positive().default(1),
  cabinClass: z.enum(['economy', 'premium_economy', 'business', 'first']).default('economy'),
  maxStops: z.number().int().min(0).optional(),
  maxPrice: z.number().positive().optional(),
  preferredAirlines: z.array(z.string()).optional(),
});
export type FlightSearchRequest = z.infer<typeof FlightSearchRequestSchema>;

export const FlightSearchResultSchema = z.object({
  searchId: z.string().uuid(),
  request: FlightSearchRequestSchema,
  offers: z.array(FlightOfferSchema),
  searchedAt: z.string().datetime(),
  source: z.string(),
});
export type FlightSearchResult = z.infer<typeof FlightSearchResultSchema>;

// ---- User Preferences ----

export const SeatPreferenceSchema = z.enum(['aisle', 'window', 'middle', 'no_preference']);
export type SeatPreference = z.infer<typeof SeatPreferenceSchema>;

export const TimePreferenceSchema = z.enum(['early_morning', 'morning', 'afternoon', 'evening', 'red_eye', 'no_preference']);
export type TimePreference = z.infer<typeof TimePreferenceSchema>;

export const BudgetPrioritySchema = z.enum(['cheapest', 'best_value', 'best_experience', 'no_preference']);
export type BudgetPriority = z.infer<typeof BudgetPrioritySchema>;

export const UserPreferencesSchema = z.object({
  userId: z.string().uuid(),
  preferredAirlines: z.array(z.string()).default([]),
  loyaltyPrograms: z.record(z.string(), z.string()).default({}),
  seatPreference: SeatPreferenceSchema.default('no_preference'),
  timePreference: TimePreferenceSchema.default('no_preference'),
  budgetPriority: BudgetPrioritySchema.default('best_value'),
  maxLayoverMinutes: z.number().int().positive().default(180),
  preferredCabin: z.enum(['economy', 'premium_economy', 'business', 'first']).default('economy'),
  avoidAirlines: z.array(z.string()).default([]),
  preferredAirports: z.record(z.string(), z.string()).default({}),
  maxBudget: z.number().positive().optional(),
  updatedAt: z.string().datetime(),
});
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

export const BookingChoiceSchema = z.object({
  userId: z.string().uuid(),
  searchId: z.string().uuid(),
  chosenOfferId: z.string(),
  offeredAlternatives: z.array(z.string()),
  chosenAt: z.string().datetime(),
  factors: z.record(z.string(), z.unknown()).optional(),
});
export type BookingChoice = z.infer<typeof BookingChoiceSchema>;

// ---- Agent / Chat ----

export const ChatMessageRoleSchema = z.enum(['user', 'assistant', 'system']);
export type ChatMessageRole = z.infer<typeof ChatMessageRoleSchema>;

export const ChatMessageSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  role: ChatMessageRoleSchema,
  content: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.string().datetime(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ConversationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string().optional(),
  messages: z.array(ChatMessageSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Conversation = z.infer<typeof ConversationSchema>;

// ---- API Responses ----

export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    timestamp: z.string().datetime(),
  });

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
