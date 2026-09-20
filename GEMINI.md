# Moitrii Frontend — Project Instructions & UI Goals

## 1. Project Overview & Vision
Moitrii is an affordable personal AI agent platform designed for women ("Modern Indian women's lifestyle + calm technology").
Every user has a dedicated personal AI agent that persists state, sleeps, wakes periodically based on subscription frequency, researches, generates or reuses content, and delivers lifestyle insights.

- **Stack:** React / Next.js, Tailwind CSS, Convex Cloud (Backend, Realtime Database, Queries & Mutations).
- **Core Principle:** All users get the same full agent capabilities; subscription tiers only determine wake/execution frequency.

---

## 2. Operating & Agent Rules (Strictly Enforced)

1. **Token Efficiency:** Keep all responses, code generations, and modifications highly token-efficient. Prefer concise, targeted edits over massive boilerplate.
2. **Git Restrictions:**
   - ONLY `git status` is permitted.
   - NEVER execute `git commit`, `git push`, `git pull`, `git stash`, `git reset`, or any mutating git command.
   - Commits and pushes are strictly reserved for the human developer.
3. **Subagent Restrictions:**
   - DO NOT invoke or spawn subagents (`invoke_subagent`, `manage_subagents`) without explicit user permission.
4. **Security & Confidentiality:**
   - NEVER read, view, or inspect `.env*` files (`.env`, `.env.local`, etc.).
   - NEVER print, inspect, or dump system environment variables.
5. **Simplicity:**
   - Keep UI components and Convex functions straightforward and minimal. Avoid speculative over-engineering.

---

## 3. UI Theme & Design System

- **Aesthetic:** Warm, editorial lifestyle agentic companion magazine site + calm technology. Not a generic dark/cold SaaS dashboard.
- **Color Palette:**
  - Background: Warm off-white / soft cream (`#FDFBF7` / `#FAF7F2`)
  - Primary Text: Deep charcoal / near-black (`#1A1A1A` / `#2D2D2D`)
  - Accent Colors: Sage green (`#7C9082`), Terracotta (`#C86D51`), Dusty Rose (`#C48B8B`), Warm Beige (`#E6DEC8`)
  - Avoid harsh saturated colors and dominant hot pink.
- **Typography & Atmosphere:** Editorial serif/clean sans-serif pairings, ample whitespace, warm lifestyle imagery, calm transitions. AI is treated as a helpful, subtle companion.

---

## 4. UI Specific Goals & Core Screens

### A. Public Landing Page (`/` or `/explore`)
- Editorial lifestyle header & navigation (Health, Food, Beauty, Wellness, Kids, Home, Travel, Anime, Gen-Z).
- Hero section with warm lifestyle editorial banner & value proposition.
- **What's Hot** curated cards carousel / grid.
- **Popular Categories** quick exploration pills/cards.
- **Latest Stories & Shared Knowledge Library** (browsable published articles with reuse badges).
- **Trending Videos** section (curated YouTube embeds / video cards).
- "About Moitrii" mission footer.

### B. Onboarding & Interest Selection (`/onboarding` or `/interests`)
- Topic selection grid with interactive cards/toggles:
  - *Core:* Health, Cooking, Beauty / Makeup, Yoga / Fitness, Wellness, Kids & Education, Home, Travel, Lifestyle.
  - *Parent & Youth Culture:* Gen-Z trends, Anime, Comics.
- Persists selections to user profile via Convex mutation.

### C. Agent Dashboard (`/dashboard` or `/agent`)
- **Agent Status Indicator:** Visual state badge (`SLEEPING`, `ACTIVE`, `WORKING`, `WAITING`, `ERROR`) with calm pulsing indicators.
- **Wake Schedule Card:** Next scheduled wake-up time countdown and last active summary.
- **Quick Request Box:** Natural language prompt input ("What would you like your agent to work on?").
- **Active Subscriptions / Interests Bar:** Quick tags for followed topics.
- **Agent Work Feed:**
  - *Completed Deliverables:* Ready to read with status links.
  - *Queued / Processing Requests:* Indicating status for the next wake-up cycle.

### D. Request Center & History (`/requests`)
- Input interface for submitting requests at any time (even while agent sleeps).
- Realtime table/card list of user requests with lifecycle badges:
  - `PENDING` -> `PROCESSING` -> `COMPLETED` / `FAILED`
- Detailed view showing submission timestamp, processing window, content reuse vs. generated status, and delivery state.

### E. Content & Article Reader View (`/content/[id]`)
- Full editorial layout for generated or reused content.
- Embedded media: Generated header images, embedded YouTube discovery players, structured bullet points, source citations.
- Related content recommendations from the shared knowledge ecosystem.
- Shareable public link support.

### F. Publisher Studio (`/publisher`)
- Authoring and drafting tools for verified publishers.
- Rich content preview (markdown, image/video embeds).
- Single-click publish to the Moitrii Shared Knowledge Ecosystem.

---

## 5. Convex Integration & State Contracts

The frontend interacts with Convex for real-time reactivity:
- **Queries:**
  - `api.users.getCurrentUser` / `api.users.getInterests`
  - `api.agents.getAgentState` (state, schedule, lastWake, nextWake)
  - `api.requests.listUserRequests` (status, history)
  - `api.content.getPublishedContent` / `api.content.getContentById`
- **Mutations:**
  - `api.users.updateInterests`
  - `api.requests.createRequest`
  - `api.publisher.publishContent`
