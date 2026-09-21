# Hackathon log

- **Project:** Moitrii
- **Event:** Convex All Gas Hackathon
- **What it does:** Affordable personal AI agent platform where users select interests, submit requests, and receive persistent, periodically executed assistance.
- **Live app:** not deployed
- **Repo:** https://github.com/AmritSDutta/moitrii_frontend
- **Frontend:** not deployed
- **Convex deployment:** not deployed
- **Components:** none
- **Convex features:** schema, indexes, full-text search, queries, mutations, actions, crons, file storage, http
- **Auth:** Convex Auth
- **AI models:** none
- **Started:** 2026-09-20T15:15:16Z
- **Last updated:** 2026-09-20T23:59:00Z

## Log

### 2026-09-20 - ddf009c
Initialized project guidelines and setup documentation (`AGENTS.md`, `hackathon.md`).

### 2026-09-20 - 8ebf5f9
Documented UI-specific goals, screen specifications, and design system tokens (warm editorial palette, subtle AI companion) in GEMINI.md and updated README.md with core screen layouts and Convex realtime architecture contracts (`GEMINI.md`, `README.md`).

### 2026-09-20 - 7e134b4
Shipped Phase 1 Next.js/React frontend with 6 core screens: Public Landing with full editorial hero and reader-favorite articles, Topic Onboarding, Agent Dashboard with sleeping indicator & countdown, Request Center, Editorial Content Reader with YouTube companion player, and Publisher Studio. Configured luminous pastel rainbow ambient backdrop and brand navigation (`src/app/**`, `src/components/**`, `src/lib/**`).

### 2026-09-20 - fbbe951
Configured Git exclusions for agent workspaces in .gitignore and initialized Convex backend structure (`.gitignore`, `convex/tsconfig.json`, `convex/README.md`).

### 2026-09-20 - f78a93b
Integrated `@convex-dev/auth` for full user authentication flow with server-side middleware and glassmorphic `AuthModal`. Connected Convex File Storage CDN (`convex/files.ts`, `src/lib/useBrandAssets.ts`) to serve dynamic brand assets (`moitrii_logo.jpg` and `moitrii.jpg`) across Navbar, Hero, AuthModal, Footer, and browser tab header icon (favicon). Refined navigation logo sizing and centering. Verified zero-error production build (`npm run build`).

### 2026-09-20 - 4c88bbb
Fixed Next.js middleware static asset exclusion matcher (`src/middleware.ts`) to prevent 404 interceptions on CSS and JavaScript chunks. Added hard inline dimension and centering constraints to brand emblem images in `Navbar`, `Footer`, and `AuthModal` to prevent layout shift or image enlargement during stylesheet drops. Added custom editorial `not-found.tsx` route.

### 2026-09-20 - 4bcffa3
Configured Convex Auth exclusively for Google OAuth and streamlined modal to 1-click sign-in (`convex/auth.ts`, `src/components/AuthModal.tsx`). Implemented `AuthGuard` to protect member navigation routes (`/dashboard`, `/requests`, `/onboarding`, `/publisher`) while keeping `/` public. Wired live user profile name and Google avatar into Navbar and Dashboard greeting. Added Google avatar domain to Next.js image config (`next.config.mjs`). Convex features: queries (`convex/users.ts`, `convex/auth.ts`).

### 2026-09-20 - cc822f7
Built Phase 3 Convex realtime data layer and connected all frontend screens without external scrapers. Added `convex/content.ts` with full-text search indexing for published guides, `convex/agents.ts` for persistent agent state and auto-initialization, `convex/requests.ts` for durable request queueing, and direct image upload to Convex File Storage (`_storage`) in Publisher Studio. Documented storage architecture tradeoff in README.md. Convex features: schema, indexes, full-text search, queries, mutations, file storage (`convex/schema.ts`, `convex/content.ts`, `convex/agents.ts`, `convex/requests.ts`, `src/app/**`).

### 2026-09-20 - 7089cc1
Added docs7 documentation site (`docs/`) with `docs.json` config and 7 MDX pages covering project overview, setup, architecture, data model, design system, UI screens, and Convex API reference. Updated `AGENTS.md` to reflect the current project structure and verified dev commands. Updated `README.md` architecture diagram to include all Convex functions (`getWhatsHot`, `initializeAgent`, `getBrandAssets`, auth/http modules) and added docs7 reference (`docs/**`, `AGENTS.md`, `README.md`).

### 2026-09-20 - 86eb00c
Added a two-tier Vitest suite: mocked UI tests for AuthGuard states, request submission, and interest toggling, plus `convex-test` coverage for request persistence and per-user isolation, interest insert/patch, and content slug/publish auth. 16 tests pass. Convex features: queries, mutations (`vitest.config.ts`, `src/test/setup.tsx`, `src/**/*.test.tsx`, `convex/requests.test.ts`, `convex/users.test.ts`, `convex/content.test.ts`). Fixed route dev errors with cross-env pinning, and documented troubleshooting in README and docs7 FAQ (`README.md`, `docs/faq.mdx`, `docs/docs.json`, `package.json`).

### 2026-09-20 - d0d0cbe
Added dedicated `subscribers` table and `convex/subscribers.ts` with `subscribeDigest` mutation for anonymous and authenticated visitors to subscribe to the weekly intentional lifestyle digest with regex validation and deduplication. Updated `Footer.tsx` with email validation, error/success feedback states, and updated copy. Built autonomous background AI agent execution system: configured default 11:00 PM IST schedule upon first user initialization (`convex/agents.ts`), added `updateWakeSchedule` mutation enforcing calm-tech night window validation (permitting only 9:00 PM – 9:00 AM IST and rejecting daytime hours 09:01–20:59), added `convex/crons.ts` and `convex/agentRunner.ts` internal actions/mutations to dispatch scheduled wake webhooks to the external Python AI agent backend (`POST /api/agent/complete` in `convex/http.ts`), built interactive Schedule Editor modal with presets and custom picker in Dashboard (`src/app/dashboard/page.tsx`). Added user `preferredLanguage` support (`en` default, `bn`, `hi`) in schema, viewer query, `updatePreferredLanguage` mutation, and dashboard selector, forwarded to agent wake payloads. Added optional `audioUrl` on content items with in-article audio narration player directly below article title (disabled indicator when not present) and publisher studio audio input. Added explicit author type badges (`AI Agent Companion` vs `Human Author`) and prominent AI synthetic content disclaimer banner. Expanded Vitest test suite (`convex/users.test.ts`, `convex/content.test.ts`, `convex/agents.test.ts`) to 28 passing tests with 0 type errors. Convex features: schema, indexes, queries, mutations, actions, crons, http (`convex/schema.ts`, `convex/subscribers.ts`, `convex/subscribers.test.ts`, `convex/agents.ts`, `convex/agents.test.ts`, `convex/agentRunner.ts`, `convex/crons.ts`, `convex/http.ts`, `convex/users.ts`, `convex/users.test.ts`, `convex/content.ts`, `convex/content.test.ts`, `src/components/Footer.tsx`, `src/app/dashboard/page.tsx`, `src/app/content/[id]/page.tsx`, `src/app/publisher/page.tsx`, `docs/**`).

### 2026-09-20 - 077b7c7
Hardened the autonomous agent loop after a code review. The completion webhook `/api/agent/complete` now fails closed (503 when `AGENT_SERVICE_SECRET` is unset, 401 on mismatch) and validates every payload field before writing; dispatches that cannot reach the Python service revert agents to SLEEPING and requests to PENDING instead of stranding them in PROCESSING; the hourly cron now dispatches only agents whose IST wake time actually elapsed, so the calm-tech night window is enforced server-side. Landing/list queries return bounded card projections via a new `by_reused_count` index, unknown article slugs render the 404 page instead of mock content, and dashboard/request views show live data with loading states. Added webhook-validation and wake-gating tests (35 passing). Convex features: http actions, crons, indexes, queries, mutations (`convex/http.ts`, `convex/agentRunner.ts`, `convex/crons.ts`, `convex/content.ts`, `convex/schema.ts`, `convex/http.test.ts`, `convex/agentRunner.test.ts`, `src/app/**`).

### 2026-09-21 - working tree
Shipped Phase 4 & Phase 5: Modular Convex AI Agent Engine, Brevo Subscriber Delivery, AgentMail Segregation, User Active Dispute Safety, and Strict PII Anonymization. Extended `users` table with `isActive: v.optional(v.boolean())` for account dispute and moderation safety (gating request submission, agent wake cycles, and interest/language updates). Enforced strict PII segregation across the entire database: human names and personal emails exist strictly in the `users` table, while `agents` table holds companion persona names (`"Moitrii Companion"`) and synthetic inboxes (`agent-...@agentmail.to`), and all other tables reference only opaque `userId: v.id("users")`. Built `convex/emails/brevo.ts` with transactional welcome confirmations and weekly curated lifestyle digest broadcasts via Brevo REST API, clearly separating platform marketing (Brevo) from 1:1 agent research updates (AgentMail). Built modular AI engine (`convex/ai/`) and expanded Vitest suite to 48 passing tests with 0 type errors and clean Next.js production build (`convex/schema.ts`, `convex/users.ts`, `convex/requests.ts`, `convex/agents.ts`, `convex/agentRunner.ts`, `convex/subscribers.ts`, `convex/emails/**`, `convex/ai/**`, `hackathon.md`). Convex features: schema, indexes, full-text search, queries, mutations, actions, crons, file storage, http.








