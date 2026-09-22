# Repository Guidelines

## Agent Operating Rules

- Work as token-efficiently as practical.
- Do not use subagents without asking for permission first.
- Do not run `git stash`, `git commit`, `git pull`, or `git push`; `git status` is the only permitted Git command.
- Never inspect `.env` files or read system environment-variable values.

## Project Structure & Module Organization

This repository implements a pure React 18 / Vite Single Page Application (`src/`) backed by a Convex Cloud realtime backend (`convex/`). Static assets live in `public/`, and documentation is maintained in `docs/` (docs7 site), `README.md` (full project spec), `GEMINI.md` (UI/UX goals), and `hackathon.md` (build log). Keep UI code in `src/` (views in `src/pages/`, components in `src/components/`, static assets in `public/`), Convex functions and schema in `convex/`.

## Build, Test, and Development Commands

Run `npm install` once to install dependencies listed in `package.json`. The verified workflow is:

- `npm install` — install dependencies.
- `npm run dev` — start the Vite frontend dev server at `http://localhost:3000`.
- `npx convex dev` — start the local Convex backend with hot reload (run in a second terminal).
- `npm run build` — typecheck and create a production SPA build in `dist/`.
- `npm run preview` — locally preview the production build.
- `npm test` — run the Vitest suite (UI + Convex projects).
- `npm run test:watch` — run Vitest in watch mode.

If `npm install` prunes dev dependencies (a global `omit=dev` npm config), re-run it with `npm install --include=dev`.

## Coding Style & Naming Conventions

Use the formatter and linter configured by the project; add them before introducing substantial code. Prefer 2-space indentation, TypeScript for frontend and Convex code, and type annotations at API boundaries. Use PascalCase for React components, `use...` for hooks, camelCase for functions and variables, and descriptive Convex function names such as `createRequest` or `listPublishedContent`.

## Testing Guidelines

Two tiers run under one Vitest config (`vitest.config.ts`):

- **UI tests** (`src/**/*.test.{ts,tsx}`, `jsdom` project) — mock `convex/react` (`useQuery`, `useMutation`) and `@convex-dev/auth/react` (`useConvexAuth`, `useAuthActions`) so components render without a backend. Shared setup (jest-dom matchers, RTL cleanup) lives in `src/test/setup.tsx`.
- **Convex tests** (`convex/**/*.test.ts`, `edge-runtime` project) — use `convex-test` with the `import.meta.glob` module map, per `convex/_generated/ai/guidelines.md`. Seed identity with `t.withIdentity({ subject: userId })`; `getAuthUserId` just reads `identity.subject.split("|")[0]`.

Import `test`/`expect`/`vi` explicitly from `vitest` (no `globals`), and never add a `compilerOptions.types` allowlist to any tsconfig. Cover request persistence, agent state transitions, content reuse, retries, and user-visible loading/error states.

## Commit & Pull Request Guidelines

No repository-specific commit convention is documented yet. Use short, imperative subjects (for example, `Add request history view`) and keep commits focused. Pull requests should explain the behavior change, list verification commands, include screenshots for UI changes, link relevant requirements, and update `hackathon.md` after meaningful progress.

## Security & Configuration

Never commit `.env*` files, tokens, deployment keys, private records, or personal data. Keep secrets in the approved local/host configuration and document only variable names. Validate external webhooks, preserve idempotency for agent execution, and redact sensitive values from public logs.

This project is source-available under the **PolyForm Strict License 1.0.0** (`LICENSE`) — not open source. Do not add MIT/Apache license headers, relicense files, or copy code out of this repository.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
