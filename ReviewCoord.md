# conversearchable Review Coordination

## Scope
Full review of the conversearchable repo: purpose unclear, Playwright-based app with auth screens and marketing plan.
49 files. TypeScript + HTML.

## Agent Assignments
- **code-reviewer**: Owns "Review Findings" section. Code quality, security (auth screens!), bugs.
- **code-simplifier**: Owns "Simplification Findings" section. Dead code, unused deps, complexity.
- **code-architect**: Owns "Architecture Assessment" section. What IS this project? Product viability, overlap with recall-skill.

## Key Questions
1. What does this project actually do? (No README, no description on GitHub)
2. Does it overlap with recall-skill's session search?
3. Is this a product worth continuing, or should it be archived?
4. Is there any sensitive data (auth tokens, credentials) in the repo?
5. What's the tech stack and is it well-structured?

## File Ownership: ALL agents are READ-ONLY for this review. No edits.

---

## Review Findings (code-reviewer)
_pending_

## Simplification Findings (code-simplifier)

### Project Status: Early prototype, stalled after initial build sprint

The repo was cloned from GitHub (single commit history). `node_modules/` does not exist locally, meaning deps were never installed in this working copy. The marketing plan is marked "COMPLETE" but the strategy doc's MVP checklist is entirely unchecked. The `.playwright-mcp/` console log shows a failed WebSocket connection, suggesting the app was briefly run or tested via Playwright MCP but not developed further. **Verdict: prototype built in one session, never returned to.**

---

### 1. Dead Code and Unused Exports

**Unused at runtime (imported/exported but never called):**

- **`PreferenceLearner`** (`src/preferences/learner.ts`): Instantiated in `TravelAgent` (line 50: `private preferenceLearner = new PreferenceLearner()`) but `learnFromChoice()` is never called anywhere in the codebase. The `preferenceStore.recordChoice()` method that feeds it is also never called. The entire preference-learning subsystem is dead code.

- **`knownLocationStore`** (`src/locations/known.ts`): Exported from `src/locations/index.ts` but never imported by any other module. The 6 seeded conference venues are never looked up. Entirely dead code.

- **`GoogleCalendarService`** (`src/calendar/google.ts`): Exported from `src/calendar/index.ts` but never imported by any consumer. Only `MockCalendarService` is used. The Google Calendar integration is written but completely unwired.

- **3 of 4 prompt constants** (`src/agent/prompts.ts`): `CALENDAR_ANALYSIS_PROMPT`, `FLIGHT_COMPARISON_PROMPT`, and `GROUP_TRAVEL_PROMPT` are exported from `src/agent/index.ts` but never imported or used anywhere. Only `SYSTEM_PROMPT` is actually consumed (by `agent.ts` line 303).

- **`ApiResponseSchema`** (`src/types/index.ts`, line 236): The generic Zod schema factory function is defined but never called. Only the `ApiResponse<T>` TypeScript interface is used (in `routes.ts` line 47 as a `satisfies` target).

- **Most Zod schemas in `src/types/index.ts`**: Nearly all the `*Schema` objects are defined purely so `z.infer` can extract the types. None of them are used for actual runtime validation (no `.parse()` or `.safeParse()` calls on any of them). Only `EnvSchema` in `src/config/index.ts` does real validation. The type definitions could be plain TypeScript interfaces instead of Zod schemas, eliminating the runtime Zod dependency for the domain types.

- **`CITY_TO_AIRPORT`** (`src/locations/airports.ts`): Exported from `src/locations/index.ts` but only consumed internally by `findAirportForCity()` in the same file. The re-export is unnecessary.

- **`distanceMiles` and `estimateDrivingMinutes`** (`src/locations/airports.ts`): Exported from `src/locations/index.ts` but only consumed by `GeocodingService` in the same `locations/` module. The re-exports are unnecessary external surface area.

- **Several `calendarStore` methods**: `getCalendar()`, `getEvent()`, `getCalendarsForUser()` are defined but never called from outside the store.

- **Several `userStore` methods**: `getAllUsers()`, `getAllOrganizations()`, `getOrganizationById()` are defined but never called.

---

### 2. Duplicated Files

**Exact duplicates (byte-identical content):**

- `public/index.html` is identical to `conversearchable-demo.html` (the "Conversearchable" demo page with the 3-step DemoEngine). These are the same 1273-line file duplicated.
- `public/marketing-plan.html` is identical to `marketing-plan.html` (root).
- `public/strategy-briefing.html` is identical to `docs/strategy-briefing.html`.
- `public/agent-cartoon.html` is identical to `docs/agent-cartoon.html`.

Every file in the `public/` directory (except `public/index.html` which duplicates the root demo file) is a copy of a file that already exists in `docs/` or root. The `public/` directory appears to be a flat copy made for static serving, but the Express server (`src/web/server.ts`) serves static files from `src/web/public/`, not from the root `public/` directory. **The entire root `public/` directory is unused by the application.**

Additionally, `src/web/public/index.html` (the actual app UI served by Express) is a completely different file from `public/index.html` (the marketing demo). This naming is confusing.

---

### 3. Unused Dependencies

**`package.json` dependencies analysis:**

| Dependency | Status | Evidence |
|---|---|---|
| `@anthropic-ai/sdk` | Used (conditionally) | Imported in `agent.ts` and `analyzer.ts`, but only activated when `USE_MOCK_LLM=false` |
| `@duffel/api` | Used (conditionally) | Imported in `duffel.ts`, only activated when `USE_MOCK_FLIGHTS=false` |
| `bcryptjs` | Used | `src/users/auth.ts` for password hashing |
| `dotenv` | Used | `src/config/index.ts` |
| `express` | Used | `src/web/server.ts`, `src/web/routes.ts` |
| `googleapis` | **Effectively unused** | Imported only in `src/calendar/google.ts` which is dead code (never imported by any consumer) |
| `jsonwebtoken` | Used | `src/users/auth.ts` |
| `uuid` | Used | Multiple files |
| `ws` | Used | `src/web/websocket.ts` |
| `zod` | **Over-specified** | Only `src/config/index.ts` does real Zod validation. All domain types in `src/types/index.ts` use Zod schemas purely for type inference, never for runtime validation. Could be replaced with plain TypeScript types for the domain layer. |

**`googleapis` is effectively dead weight** -- it is a large dependency (the full Google APIs client) imported only by the unwired `GoogleCalendarService`.

---

### 4. Unnecessary Complexity

- **Dual transport (REST + WebSocket) with duplicated agent instances**: `routes.ts` creates its own `TravelAgent` and `GroupTravelCoordinator` instances. `websocket.ts` creates a separate `TravelAgent` instance. These are independent objects with independent in-memory state (conversations, search caches, group flow state). A user who authenticates via WebSocket and one who uses REST API would have completely separate conversation histories. This is likely a bug, not a feature.

- **`MockCalendarService` instantiated twice**: Once in `TravelAgent` (line 47) and once in `routes.ts` (line 12). They maintain separate in-memory state, so calendars connected via the REST route are invisible to the agent's calendar scan.

- **Overly elaborate group travel flow state machine** (`agent.ts` lines 446-699): The `GroupFlowState` machine with 5 steps and conference detection is complex (250+ lines) for what amounts to a demo flow that always follows the same path: detect conferences, assign "the whole team", show results, approve. The state machine has branches that are never meaningfully exercised.

- **Mock data mixed into production service classes**: `DuffelFlightService.mockSearch()`, `EventAnalyzer.mockAnalyze()`, `GeocodingService.mockGeocode()` embed hundreds of lines of mock logic inside the real service classes. These would be cleaner as separate mock implementations (the pattern `MockCalendarService` already follows).

- **`cabinMap` in `duffel.ts`** (line 54-59): Maps enum values to identical strings (`'economy' -> 'economy'`, etc.). This is a no-op transformation.

---

### 5. Unused Files

- **`auth-screen.png`** and **`auth-screen-airline.png`**: Screenshot files in the repo root. Not referenced by any HTML or code. Likely Playwright captures from a design session.
- **`.playwright-mcp/console-2026-02-27T17-24-50-576Z.log`**: Playwright MCP artifact. Single line showing a failed WebSocket connection. Should be gitignored.
- **`.DS_Store`**: macOS filesystem metadata. Should be gitignored.
- **`conversearchable-demo.html`**: Root-level demo file that is also duplicated in `public/index.html`. Only one copy is needed.

---

### 6. Summary Assessment

The codebase is well-structured for a prototype -- clean module boundaries, proper TypeScript, good separation of concerns. But roughly **30-40% of the code is dead weight**: the entire Google Calendar integration, the preference learning engine, the known locations store, 3 of 4 LLM prompts, and the `googleapis` npm dependency are all written but never wired in. The `public/` directory is entirely duplicated files. The Zod schemas are used purely as a type generation mechanism, not for the runtime validation that justifies Zod's inclusion.

If this project were to be continued, a cleanup pass should: (1) remove or properly wire the Google Calendar service, (2) delete the root `public/` directory, (3) consolidate the dual agent instances, (4) either use Zod for actual request validation or replace domain schemas with plain TypeScript types, and (5) extract mock implementations from production service classes.

## Architecture Assessment (code-architect)
_pending_
