# BusinessTravelSearch — Marketing Campaign Plan

> Communication pipe between Claude agents. This document is a living plan.

## Status: COMPLETE

## Context

BusinessTravelSearch is an open-source, LLM-powered travel agent that:
- Connects to your calendar (Outlook/Gmail)
- Detects events that imply travel
- Proactively finds flights with honest, unbiased ranking
- Hands off to the airline's own site for booking (no hidden markups)

The MVP is built and running. Now we need a marketing campaign to launch it.

## Core Thesis

Every airline website could be improved by a conversational search agent. We're proving it with open source.

## Campaign Angles to Develop

1. **"Your calendar already knows"** — Calendar-aware proactive booking
2. **"Stop searching. Start traveling."** — Anti-search-engine positioning
3. **Open source transparency** — "See exactly how we find your flights"
4. **The Marissa Mayer callback** — "The future of travel search Google should have built"
5. **Group travel pain** — "Book a team trip in one message, not twelve browser tabs"
6. **"Upgrade any airline website"** — Browser extension angle, the democratization play

## TODO for Agent

- [x] Define target personas (who are we talking to?)
- [x] Pick the lead campaign angle and build the narrative
- [x] Write landing page copy
- [x] Outline the open-source launch strategy (HN, Reddit, Twitter/X, dev communities)
- [x] Design the demo flow — what does a visitor see in 30 seconds?
- [x] Draft press/media outreach angle
- [x] Plan content calendar (launch week + first month)

---

## 1. Target Personas

### Primary: The Road Warrior Developer / IC

**Name archetype:** "Jordan" — Senior engineer or technical IC at a Series B+ startup or mid-size tech company.

- Flies 2-4x/month for client meetings, team onsites, conferences
- Already lives in the terminal and Slack. Finds Kayak/Google Flights tolerable but repetitive
- Has strong opinions about tooling. Will try an open-source project if the README is good
- Frustrated that booking travel still feels like 2012 — open 5 tabs, compare, forget loyalty number, repeat
- Decision-maker for their own travel (no corporate travel desk)
- **Where they hang out:** Hacker News, Twitter/X tech circles, r/programming, dev Discord servers, company Slack #random channels
- **What hooks them:** "I built an AI agent that watches my Google Calendar and books flights before I even think about it. It's open source."
- **Conversion path:** GitHub star -> clone/install -> connect calendar -> first proactive flight suggestion -> daily active user

### Secondary: The Startup Ops / Chief of Staff

**Name archetype:** "Priya" — Ops lead or CoS at a 20-80 person startup that doesn't have (or want) a corporate travel platform like Navan or TripActions.

- Spends 3-5 hours/week coordinating team travel for board meetings, offsites, customer visits
- Currently uses a shared Google Sheet or Slack thread to gather everyone's preferences, then books manually
- Has tried Navan/TripActions but found them overpriced and rigid for a fast-moving team
- Budget-conscious but values time more than saving $40 on a fare
- **Where they hang out:** Twitter/X ops community, First Round's internal tools lists, startup Slack groups, LinkedIn
- **What hooks them:** "I used to spend half a day booking flights for our 8-person offsite. Now I type one message and everyone gets personalized options in 2 minutes."
- **Conversion path:** Sees team-travel demo -> installs for org -> connects team calendars -> coordinates first group trip -> becomes internal champion

### Tertiary: The Independent Consultant / Freelancer

**Name archetype:** "Marcus" — Solo consultant who flies to client sites weekly. Travel is a cost center and a time sink.

- Flies the same 3-5 routes repeatedly. Knows the optimal flights but still has to search and book every time
- Extremely price-sensitive (paying out of pocket, billing back to clients)
- Wants the cheapest direct flight that doesn't require a 5am wake-up, every single time
- **Where they hang out:** IndieHackers, freelancer Slack communities, Twitter/X solopreneur circles
- **What hooks them:** "It learned that I always fly DFW-ORD on Monday mornings, and now it just tells me when to book."
- **Conversion path:** Hears about it on a podcast or HN thread -> tries the Quick Demo -> realizes it solves their exact weekly pain -> connects real calendar

### Anti-Personas (Who We Are NOT Targeting at Launch)

- **Enterprise travel managers** — They need SAP Concur integrations, approval chains, and PO numbers. We'll get there but not now.
- **Leisure travelers** — Our value prop is calendar-driven proactive booking. Leisure trips aren't on your work calendar.
- **Travel hackers / points optimizers** — They enjoy the search process. We're for people who want to skip it.
- **Airlines / TMCs** — We're not selling B2B2B at launch. We're going direct.

---

## 2. Lead Campaign Angle and Narrative

### The Winner: "Your calendar already knows."

After evaluating all six angles against our primary persona (technical ICs who fly for work), **"Your calendar already knows"** is the lead angle. Here's why:

- It communicates the core product insight in four words
- It's instantly relatable — every business traveler has had the moment of "oh crap, I have a meeting in Denver on Tuesday and I haven't booked a flight"
- It differentiates from every other travel search product, which all start at the same place: a search box where YOU type a destination and date
- It implies intelligence without saying "AI" (which is fatigued as a marketing term in 2026)
- It works across all three personas: the dev who has a client standup in Chicago, the ops lead coordinating a team offsite, the consultant with recurring site visits

### The Narrative Arc

**Setup (the problem):**
You have 14 meetings on your calendar this week. Three of them are in cities you don't live in. You know you need to book flights, but you haven't yet because the process is tedious: open Google Flights, type the city, pick dates, compare prices, check your loyalty program, check bag policies, remember your seat preference. Multiply that by three trips. Multiply that by every week.

This is the state of business travel in 2026. We have AI that can write novels and generate photorealistic video, but booking a flight still requires you to manually type "SFO to ORD" into a search box like it's 2009.

**Conflict (why it's broken):**
Travel search engines are incentivized to show you MORE options, not better ones. They make money when you click, when you compare, when you agonize. The search process is the product — and it's designed to keep you searching.

Corporate travel platforms (Navan, TripActions) tried to fix this for enterprises but created a different problem: rigid policies, clunky approval workflows, and a one-size-fits-all approach that treats every traveler the same.

Neither model starts from the obvious question: **where do you already need to be?**

**Resolution (our approach):**
BusinessTravelSearch reads your calendar. When it sees "Q2 Planning — Austin Office" on Thursday, it already knows you need a flight from wherever you are to AUS, arriving Wednesday night or Thursday morning, returning Friday. It knows you prefer aisle seats, fly United when possible, and hate layovers.

It finds your options, ranks them honestly (cheapest, fastest, best for your preferences — with clear trade-offs explained), and sends you a link to book directly on the airline's website at the airline's price. No markup. No commission-biased ranking. No dark patterns.

You spend 10 seconds confirming instead of 10 minutes searching.

**The open-source kicker:**
And you can see exactly how it works. Every ranking algorithm, every preference model, every calendar analysis heuristic — it's all on GitHub. Because if you're trusting a tool with your calendar and your travel, you should be able to read the code.

### Supporting Angles (used as secondary messaging)

| Angle | Where to use it |
|-------|----------------|
| "Stop searching. Start traveling." | Tagline/subhead on landing page, social posts |
| Open source transparency | GitHub README, HN post, developer-focused content |
| The Marissa Mayer callback | Press/media angle, thought-leadership blog posts |
| Group travel pain | Feature-specific content, ops-persona targeting |
| "Upgrade any airline website" | Browser extension launch (Phase 2 campaign), Product Hunt |

### One-Liners for Different Contexts

- **GitHub repo description:** "Open-source AI travel agent. Reads your calendar, finds your flights, ranks them honestly."
- **Twitter/X bio:** "Your calendar already knows where you need to be. Now your travel agent does too."
- **HN Show post title:** "Show HN: I built an AI agent that watches my calendar and books flights before I think about it"
- **Conference talk pitch:** "Why the best travel search starts with your calendar, not a search box"
- **Cold email subject:** "Your team's calendars say they need 23 flights next month"

---

## 3. Landing Page Copy

### Above the Fold

**Headline:**
Your calendar already knows where you need to be.

**Subheadline:**
BusinessTravelSearch is an open-source AI travel agent that reads your calendar, finds your flights, and ranks them honestly — no hidden markups, no commission-biased results. Just the best option for you, explained clearly.

**CTA Buttons:**
- [Try the Demo] (primary — launches the Quick Demo flow, no signup required)
- [View on GitHub] (secondary — opens the repo)

**Social proof line (below CTAs):**
Open source. Self-hostable. Backed by the same ranking transparency you'd expect from a project you can read the code of.

### How It Works (3-Step Visual Section)

**Step 1: Connect your calendar**
Link your Google or Outlook calendar with one click. BusinessTravelSearch scans for events that imply travel — client meetings in other cities, team offsites, conferences, site visits. It understands context, not just keywords.

**Step 2: Get proactive flight options**
When it detects you need to be somewhere, it finds flights automatically. Options are ranked by YOUR priorities — price, schedule, airline preference, seat availability — with honest trade-off explanations. "This one's $80 cheaper but has a 2-hour layover in Dallas."

**Step 3: Book on the airline's site**
Click through to the airline's own website at the airline's own price. No middleman markup. No bait-and-switch. We make it easy to find the right flight. The airline handles the booking.

### The Problem Section

**Section headline:** Business travel booking is stuck in 2009.

You have a meeting in Chicago on Tuesday. You know this because it's on your calendar. Your calendar app knows it. Your email knows it. Your Slack knows it.

But none of them will book you a flight.

So you open Google Flights. You type "SFO to ORD." You pick dates. You compare 47 results. You check your United status. You wonder if the basic economy fare includes a carry-on. You open three tabs. You forget which one had the better departure time.

Twenty minutes later, you've booked a flight you're not even sure was the best option.

Now multiply that by 3 trips a week. 12 trips a month. For your whole team.

**This is what we're fixing.**

### The Honesty Section

**Section headline:** We show you the best flight, not the most profitable one.

Travel search engines make money when you click on results. That creates an incentive to show you options that generate the highest commission — not the options that are actually best for you.

BusinessTravelSearch has no booking commission. We don't mark up fares. We don't have "sponsored" results. When we rank a $340 United direct flight above a $290 Spirit connection, it's because your preferences say you value nonstop flights and you have United status — not because United pays us more.

Every ranking decision is transparent. Every trade-off is explained in plain language. And the algorithm is open source, so you can verify it yourself.

### The Team Travel Section

**Section headline:** Book a team trip in one message, not twelve browser tabs.

"The engineering team needs to be in Austin for the offsite."

That's it. That's the input. BusinessTravelSearch reads each team member's calendar, knows their home airports, applies their individual preferences (Jordan prefers aisle seats on American, Priya wants the earliest arrival, Marcus needs the cheapest option), and presents a coordinated plan.

One message in. Personalized options for everyone out. Each person books on their own airline site with one click.

### Technical Credibility Section

**Section headline:** Open source. Self-hostable. Built by developers, for developers.

- **TypeScript/Node.js** — Clean, typed codebase you can actually contribute to
- **Claude API** — LLM-powered event analysis and preference learning
- **Duffel API** — Modern flight search with real-time pricing
- **OAuth2** — Secure calendar access (Google + Microsoft 365)
- **Self-hostable** — Run it on your own infrastructure. Your calendar data stays yours.
- **Extensible** — Add new calendar sources, flight APIs, or booking channels

```
git clone https://github.com/[org]/businesstravelsearch
npm install
npm run dev
# Running at localhost:3000 — try the Quick Demo
```

### Final CTA Section

**Headline:** Stop searching. Start traveling.

**Body:**
Your calendar already has the answers. BusinessTravelSearch just reads them.

**CTA Buttons:**
- [Try the Demo] (primary)
- [Star on GitHub] (secondary)
- [Read the Docs] (tertiary text link)

### Footer Microcopy

"BusinessTravelSearch is open-source software. We believe travel search should be transparent, honest, and built for the traveler — not the booking engine. If you agree, star us on GitHub or contribute a PR."

---

## 4. Open-Source Launch Strategy

### Pre-Launch Checklist (T-minus 7 days)

Before posting anywhere, these need to be ready:

- [ ] **GitHub repo is polished**: README with screenshot/GIF of the chat UI, clear install instructions, architecture diagram, contributing guide, MIT license
- [ ] **Quick Demo works without API keys**: Mock mode must be flawless so anyone can `git clone && npm install && npm run dev` and see the product in under 60 seconds
- [ ] **Landing page is live**: Even a simple one-pager at a real domain (businesstravelsearch.com or similar)
- [ ] **Demo video recorded**: 90-second screencast showing calendar-to-flight flow. No narration needed — captions + screen recording
- [ ] **"Good first issue" labels**: Seed 5-8 issues tagged for new contributors (e.g., "add Southwest Airlines deep-link support," "improve layover detection heuristic," "add dark mode to chat UI")
- [ ] **Blog post written**: The "why I built this" founder story (see Press section below)

### Launch Day: Hacker News (Primary Channel)

**Why HN first:** Our primary persona lives here. Open-source + travel + honest-ranking + calendar-intelligence hits multiple HN interest vectors. The "Show HN" format rewards projects you can try immediately.

**Post title:**
"Show HN: Open-source AI travel agent that reads your calendar and books flights honestly"

**Post body (Show HN format):**

> Hey HN — I built an open-source travel agent that connects to your Google/Outlook calendar, detects events that imply travel, and proactively finds flights ranked by your actual preferences (not commission).
>
> The insight: your calendar already contains 90% of the information a travel search engine asks you to manually type. City, dates, time constraints — it's all there in the event metadata. So why are we still typing "SFO to ORD, March 12-14" into a search box?
>
> How it works:
> 1. Connect your calendar (OAuth2, your data stays local if self-hosted)
> 2. It scans for travel-implying events using LLM-powered analysis
> 3. Finds flights via Duffel API, ranks by your preferences with transparent trade-offs
> 4. Deep-links you to the airline's own site to book at their price (no markup)
>
> The ranking is fully transparent — it explains WHY it ranked option A over option B in plain English ("$80 cheaper but adds a 2hr layover in DFW"). No sponsored results, no commission bias. The algorithm is in the repo if you want to audit it.
>
> Stack: TypeScript, Node.js, Claude API, Duffel API, Express, WebSocket
>
> Try the demo: [link to hosted Quick Demo or localhost instructions]
> GitHub: [link]
>
> Built this because I fly 3x/month for client work and was tired of the manual search-compare-book loop. Would love feedback on the ranking transparency approach — is this the right level of detail, or too much?

**Timing:** Post Tuesday or Wednesday between 8-9am ET. Avoid Mondays (crowded) and Fridays (low traffic).

**Engagement plan:** Stay online for 4-6 hours after posting. Answer every comment thoughtfully. HN rewards founders who engage deeply in the comment thread. Technical questions about the architecture, the ranking algorithm, and the Duffel API integration will be the most common — have detailed answers ready.

### Launch Day: Twitter/X (Parallel Channel)

**Thread format (7-8 tweets):**

1. "I've been flying 3x/month for client work. Every time: open Google Flights, type the same route, compare the same 40 results, forget which tab had the good one. I finally built the tool I wanted. It reads my calendar and finds my flights before I even think about it. It's open source."

2. "The core insight: your calendar already knows where you need to be. It has the city, the dates, the time constraints. Every travel search engine ignores this and makes you type it all in manually. Why?"

3. "BusinessTravelSearch connects to Google/Outlook via OAuth2, scans events for travel signals using an LLM, and finds flights through real airline APIs. It ranks options by YOUR priorities — not by who pays the highest commission."

4. "The ranking is radically transparent. Instead of a mystery sort order, it tells you: 'This flight is $80 cheaper but has a 2-hour layover. This one matches your United status and preferred departure time.' You decide with full context."

5. "When you're ready to book, it links you directly to the airline's website at the airline's price. No markup. No hidden fees. No bait-and-switch. We're not a booking engine — we're a search agent that works for YOU."

6. "For teams: 'Book the engineering offsite in Austin' becomes one message. Each person gets personalized options based on their home airport, airline preferences, and schedule. No more shared Google Sheets or Slack threads to coordinate 12 people."

7. "The whole thing is open source. TypeScript, Node.js, Claude API, Duffel API. You can self-host it, read every line of the ranking algorithm, and contribute. Because if a tool reads your calendar, you should be able to read its code. [GitHub link]"

8. "Try the live demo (no signup): [link]. Or clone it and run locally in 60 seconds. I'd love feedback — especially on the honest ranking approach. Is this the level of transparency you'd want from a travel tool? [GitHub link]"

**Engagement:** Quote-tweet with specific technical details when people ask questions. Share the HN thread link once it's up. Pin the thread.

### Launch Day +1: Reddit

**Subreddits (in priority order):**

1. **r/SideProject** — "I built an open-source AI travel agent that reads your calendar" — this sub loves polished MVPs with clear demos
2. **r/selfhosted** — Angle: "Self-hosted alternative to Navan/TripActions for small teams" — emphasize privacy, self-hosting, no data leaving your server
3. **r/typescript** or **r/node** — Technical deep-dive: "How I built a calendar-aware flight search agent in TypeScript" — focus on architecture, the event analysis pipeline, the ranking system
4. **r/digitalnomad** — "AI tool that watches your calendar and proactively books flights" — this community flies constantly and hates repetitive booking
5. **r/businesstravel** — "Open-source tool: honest flight ranking with no commission bias" — lead with the transparency angle

**Reddit rules:** Different subreddits want different framings. r/selfhosted wants Docker compose files and privacy focus. r/typescript wants code architecture. r/digitalnomad wants the lifestyle angle. Write a custom post for each, not a copy-paste.

### Launch Week: Dev Community Posts

- **Dev.to article:** "Building an Honest Flight Ranking Algorithm: Why We Open-Sourced Our Travel Agent" — technical deep-dive on the ranking system, with code snippets
- **Hashnode / personal blog:** "Your Calendar Already Knows: How I Built a Proactive Travel Agent" — the founder narrative version
- **Discord servers:** Post in Duffel's developer community (if they have one), TypeScript community servers, AI/LLM builder communities

### Ongoing: GitHub Growth Tactics

- **Weekly releases** with meaningful changelogs (not just version bumps)
- **Respond to every issue within 24 hours** — even if just to acknowledge
- **Merge first-time contributor PRs quickly** — nothing builds community like fast feedback
- **Publish a public roadmap** as a GitHub Project board so contributors can see what's coming
- **"Architecture Decision Records"** in the repo — explain WHY design choices were made, not just what they are. This signals engineering maturity and attracts serious contributors.
- **GitHub Sponsors / Open Collective** — set up early so people who want to support can do so

### Metrics to Track

| Metric | Launch day target | Week 1 target | Month 1 target |
|--------|------------------|---------------|-----------------|
| GitHub stars | 200 | 1,000 | 3,000 |
| Forks | 20 | 100 | 300 |
| Demo completions | 500 | 2,000 | 5,000 |
| HN upvotes | 100+ (front page) | — | — |
| Twitter impressions | 50K | 200K | 500K |
| Contributors (non-founder) | 2 | 10 | 30 |
| Email signups (hosted version waitlist) | 100 | 500 | 2,000 |

---

## 5. Demo Flow — What a Visitor Sees in 30 Seconds

### Design Principle

The demo must deliver an "aha moment" before the visitor has to create an account, enter an API key, or connect a real calendar. The Quick Demo button on the landing page and in the app at localhost:3000 is the single most important conversion tool we have.

### The 30-Second Flow

**Second 0-3: Arrival**
Visitor lands on the page (from HN, Twitter, GitHub README). They see the headline "Your calendar already knows where you need to be" and two buttons: [Try the Demo] and [View on GitHub]. They click "Try the Demo."

**Second 3-8: The Chat Opens**
A clean chat interface appears. No login wall. No onboarding wizard. The agent sends the first message:

> "I just scanned your calendar for this week. I found 3 events that look like they need travel. Let me show you the first one."

(In demo mode, this uses a pre-built mock calendar with realistic events — no real calendar connection needed.)

**Second 8-15: Calendar Intelligence on Display**
The agent shows the detected event:

> **Detected: "Q2 Planning - Austin Office"**
> Thursday March 5, 9:00 AM - 5:00 PM
>
> This looks like an in-person meeting at your Austin office. Based on your San Francisco home base, you'd need to fly SFO -> AUS, arriving Wednesday evening or Thursday morning early, departing Friday.
>
> Want me to find flights?

The visitor sees the magic: the system read a calendar event and correctly inferred the destination city, travel dates, and schedule constraints. This is the "aha moment."

**Second 15-25: Honest Flight Results**
The visitor types "yes" (or clicks a suggested reply button). The agent returns results:

> **3 options for SFO -> AUS, Wed Mar 4 - Fri Mar 6:**
>
> **Best overall:** United UA 1547 — Nonstop, depart 6:15pm, arrive 11:42pm. $387 round trip.
> *Matches your United MileagePlus status. Arrives same night so no hotel needed.*
>
> **Cheapest:** Southwest WN 2283 — Nonstop, depart 2:10pm, arrive 7:38pm. $294 round trip.
> *$93 less, but you'd miss your 3pm standup. Free bags though.*
>
> **Earliest arrival:** American AA 814 — 1 stop (DFW), depart 7:00am Thu, arrive 12:45pm. $341 round trip.
> *Gets you there by lunch Thursday, but 5am wake-up and a layover.*
>
> [Book on United.com] [Book on Southwest.com] [Book on AA.com]

The visitor sees honest trade-off explanations in natural language — not just a sorted table of prices. Each option has a clear "why it's here" rationale.

**Second 25-30: The Hook**
The agent follows up:

> "I also found 2 more travel events this week: a client meeting in Chicago on Monday and a conference in Denver next Friday. Want me to find those flights too?"
>
> "Or, connect your real calendar and I'll do this automatically every week."
>
> [Connect Google Calendar] [Connect Outlook] [Keep exploring the demo]

### Key Design Decisions for the Demo

1. **No signup required.** The demo runs entirely in mock mode. Zero friction to the aha moment.

2. **The agent talks first.** Don't make the visitor figure out what to type. The agent leads with "I scanned your calendar and found travel events" — this demonstrates the core value prop without the user doing anything.

3. **Show 3 options, not 30.** Travel search engines overwhelm with options. We show the top 3 with clear rationale for each. This IS the product differentiation — the curation and explanation.

4. **Trade-off language is visible immediately.** The phrases like "$93 less, but you'd miss your 3pm standup" are the most memorable part of the demo. They prove the ranking isn't a black box.

5. **Real airline names and realistic prices.** The mock data should use real airline names, real route pairs, and plausible prices. If the demo feels fake, the whole pitch collapses.

6. **One-click path to real calendar.** The transition from demo to real usage should be a single OAuth click, not a registration form.

### Demo Variants for Different Contexts

| Context | Demo variant |
|---------|-------------|
| Landing page / Quick Demo button | Full chat flow with mock calendar (described above) |
| GitHub README | GIF showing the 30-second flow — no click needed, just watch |
| Twitter/X | 60-second screen recording with captions |
| Conference talk / pitch | Live demo with a real calendar (pre-loaded with test events) |
| HN comment thread | Link directly to hosted Quick Demo with `?demo=true` parameter |

---

## 6. Press / Media Outreach Angle

### The Story We're Pitching

**Headline pitch:** "The travel search tool Google should have built is now open source"

This is not a product launch press release. This is a narrative about why travel search has been broken for 15 years and what it looks like when you rebuild it from the calendar up, with no booking commission incentive distorting the results.

### The Marissa Mayer Hook

In 2012, Marissa Mayer described her vision for what travel search should be: you shouldn't have to tell a search engine where you're going and when — it should already know from your calendar, your email, your context. Google had all the pieces (Gmail, Google Calendar, Google Flights, Google Maps) but never connected them. Fourteen years later, that vision is still unrealized inside Google.

We built it as an open-source project in 30 source files.

This is the hook that gets a tech journalist's attention. It's not "another AI startup" — it's a specific, well-known industry figure's unrealized vision, built by indie developers with LLMs, and given away as open source. That's a story.

### Target Publications and Journalists

**Tier 1 — Tech press (aim for 1-2 placements):**

| Publication | Angle | Target writers |
|-------------|-------|----------------|
| The Verge | "Open-source AI agent reads your calendar, books flights with no hidden markups" | AI/consumer tech beat |
| TechCrunch | "The Marissa Mayer travel search vision, built as open source" | Startups / AI beat |
| Ars Technica | Technical deep-dive on honest ranking algorithms and calendar NLP | Software/AI coverage |
| The Information | "Why travel search is still broken and what open source can do about it" | Enterprise/travel tech |

**Tier 2 — Developer press (aim for 2-3 placements):**

| Publication | Angle |
|-------------|-------|
| The New Stack | "Building a Calendar-Aware AI Agent in TypeScript: Architecture Deep Dive" |
| InfoQ | "Honest Ranking Algorithms: An Open-Source Approach to Travel Search" |
| Hacker Noon | "I Built the Travel Agent Google Should Have Built" |
| Dev.to (staff-picked) | "Why I Open-Sourced My Business Travel Agent" |

**Tier 3 — Travel industry press (aim for 1 placement):**

| Publication | Angle |
|-------------|-------|
| Skift | "Open-source travel search agent challenges OTA commission model" |
| PhocusWire | "Calendar-first travel booking: the next evolution of business travel?" |
| Business Travel News | "Self-hosted travel tool offers Navan alternative for startups" |

### The Pitch Email (Template)

**Subject:** Open-source AI agent books flights by reading your calendar — the Marissa Mayer vision realized

**Body:**

Hi [name],

In 2012, Marissa Mayer described what travel search should be: your phone should know from your calendar that you have a meeting in Chicago on Tuesday and proactively find your flight. Google had every piece needed to build this — Gmail, Calendar, Flights, Maps — and never did.

I just shipped it as an open-source project.

BusinessTravelSearch is an AI travel agent (TypeScript/Node.js, Claude API) that connects to your Google or Outlook calendar, detects events that imply travel, and proactively finds flights ranked by your actual preferences. The ranking is fully transparent — the agent explains trade-offs in plain English ("$80 cheaper but adds a layover") — and there's no booking commission distorting results. You book on the airline's own site at the airline's price.

The whole thing is open source (MIT license), self-hostable, and has a working demo you can try in 30 seconds without creating an account.

A few things that might be interesting for a piece:

- **The Mayer callback:** Why the most obvious product Google could have built still doesn't exist 14 years later
- **The honesty angle:** What happens when you remove commission incentives from flight ranking
- **The open-source play:** Why calendar + travel data is sensitive enough that the code should be auditable
- **30 source files:** This wasn't a 50-person team. Modern LLMs + good APIs made it possible for a tiny team to build what used to require an enterprise

Happy to do a demo call, share the GitHub repo, or send you a pre-configured instance to play with.

Best,
[name]

### Embargo Strategy

We're NOT doing an embargo. Open-source launches work best with simultaneous public access. The HN post, Twitter thread, and media outreach should all go live on the same day. Journalists can have an advance look at the repo (shared privately) 2-3 days before launch, but the story goes live when the public repo goes live.

### What We're NOT Pitching

- We're not pitching this as a "startup." We're pitching it as an open-source project with a clear point of view about honest travel search.
- We're not claiming to "disrupt" the travel industry. We're showing what's possible when you start from the calendar instead of the search box.
- We're not asking for coverage of funding, team, or business model. The story is the product and the principle.

---

## 7. Content Calendar — Launch Week + First Month

### Pre-Launch (T-7 to T-1)

| Day | Action | Owner | Status |
|-----|--------|-------|--------|
| T-7 | Finalize GitHub README with screenshots, install instructions, architecture diagram | Dev | [ ] |
| T-7 | Record 90-second demo video (screen capture of Quick Demo flow) | Dev | [ ] |
| T-6 | Write "Why I Built This" blog post (personal blog / Hashnode) | Founder | [ ] |
| T-6 | Write Dev.to technical deep-dive on the ranking algorithm | Dev | [ ] |
| T-5 | Send advance pitch emails to Tier 1 journalists (with private repo access) | Founder | [ ] |
| T-5 | Set up landing page at production domain with demo embed | Dev | [ ] |
| T-4 | Seed 5-8 "good first issue" GitHub issues | Dev | [ ] |
| T-3 | Prepare all social copy (HN post, Twitter thread, Reddit posts) — write but don't publish | Founder | [ ] |
| T-2 | Test the full demo flow end-to-end. Have 3 people outside the team try it cold | QA | [ ] |
| T-1 | Final repo polish: license file, code of conduct, contributing guide, changelog | Dev | [ ] |
| T-1 | Schedule tweets (but don't auto-post — want to be live for engagement) | Founder | [ ] |

### Launch Week

**Day 0 (Tuesday) — LAUNCH DAY**

| Time (ET) | Action |
|-----------|--------|
| 8:00 AM | Make GitHub repo public |
| 8:15 AM | Post "Show HN" to Hacker News |
| 8:30 AM | Post Twitter/X thread (tweet 1, then replies every 3-5 min) |
| 8:30 AM | Send pitch emails to Tier 2 and Tier 3 journalists |
| 9:00 AM | Publish blog post ("Why I Built This") with links to repo and demo |
| 9:00 AM - 2:00 PM | Actively monitor and respond to every HN comment |
| 12:00 PM | Check HN ranking. If front page, tweet screenshot. If not, ask 3-5 friends to upvote (organic — never use vote rings) |
| 2:00 PM | Post to r/SideProject |
| 3:00 PM | Post to r/selfhosted |
| 6:00 PM | Evening check: respond to all new HN comments, tweets, GitHub issues |
| 9:00 PM | Post day-1 metrics internally. Adjust Day 1 plan if needed. |

**Day 1 (Wednesday) — SUSTAIN**

| Action |
|--------|
| Morning: Respond to overnight HN comments and Twitter replies |
| Post to r/typescript and r/node with technical angle |
| Publish Dev.to article ("Building an Honest Flight Ranking Algorithm") |
| Share Dev.to article on Twitter with pull quote about ranking transparency |
| Follow up with any journalists who opened the pitch email |
| Merge any quick-win PRs from new contributors (fast feedback = community growth) |
| If HN post is still active: post a thoughtful "follow-up" comment with technical details or architecture decisions that invite discussion |

**Day 2 (Thursday) — EXPAND**

| Action |
|--------|
| Post to r/digitalnomad and r/businesstravel |
| Cross-post blog to Hashnode for additional distribution |
| Tweet individual feature highlights: calendar detection, honest ranking, team travel |
| Post in relevant Discord servers (TypeScript, AI builders, Duffel community) |
| Respond to every GitHub issue and star (use GitHub's "watch" notifications) |

**Day 3 (Friday) — REFLECT**

| Action |
|--------|
| Publish a "Launch Week Numbers" tweet thread: stars, forks, demo completions, contributor PRs |
| Write and publish the first changelog/release notes (v0.1.1 with any quick fixes from launch feedback) |
| Send "thank you" DMs to anyone who shared, starred, or contributed |
| Start drafting the Week 2 content based on what resonated most |

**Day 4-5 (Weekend) — REST + PREP**

| Action |
|--------|
| Monitor incoming issues and PRs (respond but don't burn out) |
| Review analytics: which content drove the most demo completions? |
| Prep Week 2 content |

### Week 2

| Day | Content | Channel |
|-----|---------|---------|
| Mon | "How the Calendar Event Analyzer Works" — technical deep-dive with code snippets | Blog + Dev.to |
| Tue | Tweet thread: "5 things I learned launching an open-source travel tool" (lessons from launch week) | Twitter/X |
| Wed | Post to IndieHackers: "I built an open-source alternative to Navan for small teams" | IndieHackers |
| Thu | "The Honest Ranking Manifesto" — why travel search results should explain themselves | Blog, cross-post to HN as a standalone article (not Show HN) |
| Fri | Week 2 release (v0.2.0) with contributor-submitted features. Highlight contributors in release notes | GitHub + Twitter |

### Week 3

| Day | Content | Channel |
|-----|---------|---------|
| Mon | "Building with the Duffel API: A Developer's Review" — technical content that also promotes us to Duffel's audience | Blog + Dev.to |
| Tue | Video: 3-minute walkthrough of self-hosting setup (Docker compose, env config, calendar OAuth) | YouTube + Twitter |
| Wed | "Group Travel Coordination with AI Agents" — deep-dive on the multi-agent architecture | Blog |
| Thu | Twitter/X Spaces or short podcast appearance (pitch to relevant tech podcasts in Week 1) | Audio |
| Fri | Feature spotlight: preference learning. "After 5 bookings, it knows you better than Google Flights" | Twitter thread |

### Week 4

| Day | Content | Channel |
|-----|---------|---------|
| Mon | "One Month of Open-Source Travel Search" — retrospective with real metrics, user stories, lessons | Blog (long-form) |
| Tue | Launch on Product Hunt (timing: after organic community is established, not on Day 0) | Product Hunt |
| Wed | Product Hunt follow-up engagement. Post the "Upgrade any airline website" browser extension teaser | Twitter/X |
| Thu | "What's Next: The BusinessTravelSearch Roadmap" — public roadmap post inviting community input | Blog + GitHub Discussions |
| Fri | Month 1 metrics review. Plan Month 2 content based on what worked | Internal |

### Content Principles

1. **Every piece of content should be independently valuable.** Don't just promote the product — teach something, share a technical insight, or tell a story. The HN/dev community will ignore pure marketing.

2. **Show the code.** Every technical blog post should include real code snippets from the repo with links to the specific files. This builds trust and drives GitHub traffic.

3. **Respond to everything.** In the first month, respond to every tweet, every HN comment, every GitHub issue, every Reddit reply. The founder's presence in the conversation is the marketing.

4. **Let the community write the narrative.** If someone tweets "I tried BusinessTravelSearch and it found me a $200 cheaper flight by suggesting I fly out Wednesday night instead of Thursday morning," that's 10x more valuable than anything we write. Amplify user stories relentlessly.

5. **Don't say "AI" more than necessary.** Lead with what it does (reads your calendar, finds flights, explains trade-offs), not how it does it (LLM-powered, AI agent). The technology is the means, not the message.
