# BusinessTravelSearch - Strategy Document

## Vision

An LLM-powered travel agent that knows your calendar, knows where you need to be, and proactively books the best travel — the "Marissa Mayer vision" of automatic business travel booking, finally realized with modern AI.

## Core Insight

Business travelers repeatedly do the same manual work: look at calendar, see meeting in another city, search flights, compare options, book. This system collapses that entire workflow by connecting to users' calendars, understanding their travel patterns and preferences, and either auto-booking or presenting pre-optimized options.

## Product: BusinessTravelSearch

### What It Does

1. **Calendar Intelligence** — Connects to multiple Outlook and/or Gmail calendars. Detects events that imply travel (meetings in other cities, client site visits, conferences, off-site events). Understands recurring patterns.

2. **Multi-User / Organization Support** — Multiple users within the same organization (or at the same email domain) can connect. The system sees overlapping travel needs and can suggest shared bookings, coordinate group travel, and avoid conflicts.

3. **Location Awareness** — Knows users' home base, office locations, client sites, and frequently visited cities. Learns important locations from calendar history and explicit preferences.

4. **Proactive Booking Agent** — When it detects you need to be somewhere:
   - Finds optimal flights using aggregator APIs (Duffel, Amadeus, Kiwi)
   - Applies your preferences (airline loyalty, seat preference, budget constraints, time-of-day preference)
   - Presents honest, non-deceptive options ranked by YOUR priorities (not commission)
   - Hands off to airline for actual booking (hybrid model) OR auto-books within pre-approved parameters

5. **Multi-Agent Group Travel** — For team travel, multiple agents can coordinate:
   - "The Austin team needs to be in NYC for the board meeting" triggers parallel booking for all team members
   - Each person's agent respects their individual preferences
   - A coordinator agent finds options that work for the group

### Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Target audience | Direct-to-consumer (business travelers) | Real users from day one |
| Booking integration | Hybrid: aggregator search + airline handoff | Fast to market, honest/transparent, avoids heavy partnerships |
| Open source strategy | Core agent logic is open, calendar integration + booking handoff is commercial | Developer adoption + commercial viability |

### Channels (Priority Order)

1. **Web chat widget** — Embeddable, shareable, demo-friendly
2. **Browser extension** — "Upgrade any airline site" narrative
3. **SMS** — "Text us your trip" accessibility play
4. **Voice** — Phone call booking for maximum wow-factor
5. **TextbasedUI** — Terminal/CLI for power users and developers

### Calendar Integration Architecture

```
User's Calendars (OAuth2)
    |
    v
+-------------------+
| Calendar Sync     |  -- Outlook Graph API (Microsoft 365)
| Service           |  -- Google Calendar API
+-------------------+  -- CalDAV (generic)
    |
    v
+-------------------+
| Event Analyzer    |  -- NLP to detect travel-implying events
| (LLM-powered)     |  -- Location extraction and geocoding
+-------------------+  -- Duration/urgency analysis
    |
    v
+-------------------+
| Travel Planner    |  -- Match events to flight options
| Agent             |  -- Apply user preferences
+-------------------+  -- Group travel coordination
    |
    v
+-------------------+
| Booking Handoff   |  -- Aggregator API search (Duffel/Amadeus)
| Service           |  -- Deep link to airline for booking
+-------------------+  -- Confirmation tracking
```

### Multi-User Model

- **Organization** — A company domain (e.g., @acme.com) can be an org
- **User** — Individual with connected calendar(s) and preferences
- **Agent** — Each user has a personal agent that knows their preferences
- **Coordinator** — An org-level agent that can see overlap and coordinate group travel
- **Admin** — Can set org-wide policies (max budget, preferred airlines, approval workflows)

### User Preferences (Learned Over Time)

- Preferred airlines and loyalty programs
- Seat preferences (aisle/window, front/back)
- Time-of-day preferences (red-eye vs. morning)
- Budget sensitivity (cheapest vs. best experience)
- Layover tolerance
- Airport preferences (when multiple serve a city)
- Hotel chain preferences (future expansion)
- Car rental preferences (future expansion)

### Honest, Non-Deceptive Principles

This is a core product value, not a feature:

1. **No hidden markups** — Show the actual airline price
2. **No biased ranking** — Options ranked by user's priorities, not commissions
3. **Transparent trade-offs** — "This flight is $80 cheaper but has a 3-hour layover"
4. **Show the airline's own price** — Always link to the airline directly
5. **No dark patterns** — No fake urgency, no hidden fees, no manipulative UX

### Tech Stack (Recommended)

- **Runtime**: Node.js / TypeScript (or Python with FastAPI)
- **LLM**: Claude API (Anthropic) for agent reasoning
- **Calendar**: Microsoft Graph API + Google Calendar API via OAuth2
- **Flight Search**: Duffel API (cleanest modern flight API) as primary, Amadeus as fallback
- **Database**: PostgreSQL for users/preferences, Redis for session state
- **Queue**: BullMQ or similar for async calendar scanning jobs
- **Auth**: OAuth2 for calendar connections, JWT for user sessions
- **Deployment**: Docker containers, deployable to any cloud

### Marketing Campaign Angles

1. **"Your calendar already knows where you need to be. Now your travel agent does too."**
2. **"Stop searching. Start traveling."** — The anti-search-engine positioning
3. **Open source transparency** — "See exactly how we find your flights. No black boxes."
4. **Marissa Mayer callback** — "The future of travel search that Google should have built"
5. **Group travel pain point** — "Book a team trip in one message, not twelve browser tabs"

### Demo Scenarios

1. **Solo business traveler** — Calendar shows client meeting in Chicago next Tuesday. Agent finds flights, presents top 3 options with honest comparison, user confirms, handed off to United.com to complete booking.

2. **Team travel** — Engineering offsite in Austin. Admin triggers group booking. Each team member's agent finds their optimal flight based on individual preferences. Coordinator shows the combined itinerary.

3. **Recurring travel** — Monthly board meeting in SF. System learns the pattern, proactively suggests booking 2 weeks in advance when prices are historically lowest.

4. **Calendar conflict detection** — Detects you have a meeting in NYC at 9am but your last NYC flight gets canceled. Alerts you and immediately finds alternatives.

### MVP Scope (What to Build First)

Phase 1 - Core Demo:
- [ ] Single-user calendar connection (Google Calendar OAuth2)
- [ ] Event analysis: detect travel-implying events
- [ ] Flight search via Duffel API
- [ ] User preference learning (basic)
- [ ] Web chat interface for interaction
- [ ] Deep link to airline for booking completion

Phase 2 - Multi-User:
- [ ] Outlook/Microsoft 365 calendar support
- [ ] Organization model with multiple users
- [ ] Group travel coordination
- [ ] Admin dashboard

Phase 3 - Full Channel Support:
- [ ] Browser extension (Chrome)
- [ ] SMS channel (Twilio)
- [ ] Voice channel (Twilio/Vonage)
- [ ] Safari extension

Phase 4 - Marketing Launch:
- [ ] Landing page and marketing site
- [ ] Demo video / interactive demo
- [ ] Open source repo with documentation
- [ ] Press/media outreach materials
