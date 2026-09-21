# Hackathon log

- **Project:** Moitrii
- **Event:** Convex All Gas Hackathon
- **What it does:** Affordable personal AI agent platform where users select interests, submit requests, and receive persistent, periodically executed assistance.
- **Live app:** not deployed
- **Repo:** https://github.com/AmritSDutta/moitrii_frontend
- **Frontend:** not deployed
- **Convex deployment:** not deployed
- **Components:** @convex-dev/workflow
- **Convex features:** schema, indexes, full-text search, queries, mutations, actions, crons, file storage, http, workflows, components
- **Auth:** Convex Auth
- **AI models:** gpt-4o-mini, tts-1
- **Started:** 2026-09-20T15:15:16Z
- **Last updated:** 2026-09-22T04:37:33Z

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

### 2026-09-21 - 6c45e74
Replaced the external Python agent dispatch with a native Convex AI pipeline: the hourly wake action runs a reuse check over the content full-text index, synthesizes a localized guide with OpenAI (`gpt-4o-mini`, editorial fallback without a key), fetches a companion video, narrates it via TTS (`tts-1`) into file storage, publishes through `content.internalPublishGuide`, and emails the user via AgentMail + Brevo. Each agent now owns a dedicated virtual inbox, and any pipeline failure reverts requests to PENDING for the next wake. Documentation refreshed alongside (04154bc). Convex features: actions, internal queries/mutations, full-text search, file storage, crons, http (`convex/ai/**`, `convex/agentRunner.ts`, `convex/emails/brevo.ts`, `convex/agents.ts`).

### 2026-09-21 - 785d9bf
Migrated the frontend from Next.js to a pure **React 18 + Vite SPA** with `react-router-dom` v6 across all 6 core screens (`HomePage`, `DashboardPage`, `RequestsPage`, `OnboardingPage`, `ContentReaderPage`, `PublisherPage`, `NotFoundPage`). Configured client-side Convex auth via `ConvexAuthProvider`, server-validated authentication flow via `useValidatedAuth`, Google OAuth explicit account chooser (`prompt: "select_account"`), and streamlined `Navbar.tsx` session teardown. Modernized autonomous agent wake cron in `convex/crons.ts` to use `crons.hourly(...)` with `minuteUTC` omitted for automatic off-peak distribution across the hour, and made all 24 hours available for user wake scheduling. Added dedicated `docs/convex-best-practices.mdx` documentation page covering top-of-hour evasion, clock-agnostic queries, atomic mutations, index optimization, and PII protection, registered it in `docs/docs.json`, and refreshed documentation across `README.md` and `docs/**`. Verified 51 / 51 passing tests across 12 Vitest suites, passed docs7 automated validation (9 pages, 0 errors), and confirmed 0 TypeScript errors during production build (`npm run build`). Convex features: schema, indexes, full-text search, queries, mutations, actions, crons, file storage, http (`convex/crons.ts`, `convex/agents.ts`, `src/pages/DashboardPage.tsx`, `docs/**`, `README.md`).

### 2026-09-22 - working tree
Completed end-to-end integration of `@convex-dev/workflow`, fault-tolerance hardening, and zero-LLM newsletter engine:
1. **Durable Step Journaling & Failure Recovery (`@convex-dev/workflow`):** Mounted the workflow component in `convex/convex.config.ts`, refactored `convex/agentRunner.ts` to define `userWakeWorkflow` via `WorkflowManager`, decomposing execution into journaled step mutations (`markAgentWorking`, `checkContentReuse`, `internalPublishGuide`, `completeAgentTask`) and step actions (`researchAndSynthesizeStep`, `narrationStep`, `notifyCompletionStep`) with granular exponential backoff retries. Wrapped the workflow handler in an error boundary that journals a rollback via `revertAgentWorking` upon step failure or retry exhaustion, ensuring agents return to `SLEEPING` and requests to `PENDING` so the next wake cycle retries them.
2. **Mutation Null-Safety:** Hardened `markAgentWorking`, `revertAgentWorking`, and `completeAgentTask` to verify document existence via `ctx.db.get(id)` before patching, preventing crashes if TTL cleanup deletes expired records mid-dispatch.
3. **Clock-Agnostic Query Filtering:** Replaced wall clock calls (`Date.now()`) inside `listUserRequests` with pure parameter-based cutoff filtering (`nowMs: v.optional(v.number())`), preserving query cache determinism and reactivity.
4. **Firecrawl Tool Grounding & Honest Offline Citations:** Aligned `convex/ai/firecrawl.ts` with top-level `limit: 3` and verified that fallback citations use honest offline references (`Moitrii Editorial Guidelines (Offline Reference)`, `https://moitrii.ai`).
5. **UI & Constant Unification:** Extracted `MAX_PENDING_REQUESTS = 5` into `src/lib/constants.ts`, passed stable timestamps to `listUserRequests` in `DashboardPage` and `RequestsPage`, and unified pending queue filtering across both pages to evaluate `r.status === "PENDING"`.
6. **Email Newsletter, Sunday Cron & Unsubscribe Flow:** Enhanced `subscribers` schema with lifecycle `status` (`ACTIVE` / `UNSUBSCRIBED`), `unsubscribedAt`, and `by_status` index. Built zero-LLM weekly digest query (`getTopWeeklyDigestArticles`) selecting top 10 articles by `reusedCount` (descending) with stored takeaways, scheduled autonomous Sunday broadcast via `crons.weekly` (`hourUTC: 12`, off-peak minute), and built one-click unsubscribe flow (`unsubscribeDigest` mutation, `/unsubscribe` route, `UnsubscribePage` UI, and customized Brevo email footer links). Integrated dynamic file storage logo (`STATIC_STORAGE_IDS.logo`) into Brevo welcome and weekly digest email templates via `ctx.storage.getUrl`, replacing inline text symbols with the brand emblem. HTML-escaped all interpolated fields and resolved link origins via `APP_ORIGIN` env fallback.
7. **Testing & Build Verification:** 63 / 63 tests passing across all 12 Vitest suites (`npm test`), and 0 TypeScript compilation errors in production SPA build (`npm run build`). Convex features: workflows, components, schema, compound indexes, queries, mutations, actions, crons, file storage (`convex/schema.ts`, `convex/subscribers.ts`, `convex/emails/brevo.ts`, `convex/crons.ts`, `src/pages/UnsubscribePage.tsx`, `src/App.tsx`, `docs/**`, `README.md`).
