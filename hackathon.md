# Hackathon log

- **Project:** Moitrii
- **Event:** Convex All Gas Hackathon
- **What it does:** Affordable personal AI agent platform where users select interests, submit requests, and receive persistent, periodically executed assistance.
- **Live app:** not deployed
- **Repo:** https://github.com/AmritSDutta/moitrii_frontend
- **Frontend:** not deployed
- **Convex deployment:** not deployed
- **Components:** none
- **Convex features:** schema, indexes, full-text search, queries, mutations, file storage
- **Auth:** Convex Auth
- **AI models:** none
- **Started:** 2026-09-20T15:15:16Z
- **Last updated:** 2026-09-20T21:23:29Z

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

### 2026-09-20 - working tree
Built Phase 3 Convex realtime data layer and connected all frontend screens without external scrapers. Added `convex/content.ts` with full-text search indexing for published guides, `convex/agents.ts` for persistent agent state and auto-initialization, `convex/requests.ts` for durable request queueing, and direct image upload to Convex File Storage (`_storage`) in Publisher Studio. Documented storage architecture tradeoff in README.md. Convex features: schema, indexes, full-text search, queries, mutations, file storage (`convex/schema.ts`, `convex/content.ts`, `convex/agents.ts`, `convex/requests.ts`, `src/app/**`).



