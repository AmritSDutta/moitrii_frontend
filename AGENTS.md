# Repository Guidelines

## Agent Operating Rules

- Work as token-efficiently as practical.
- Do not use subagents without asking for permission first.
- Do not run `git stash`, `git commit`, `git pull`, or `git push`; `git status` is the only permitted Git command.
- Never inspect `.env` files or read system environment-variable values.

## Project Structure & Module Organization

This repository implements a React/Next.js frontend (`src/`) backed by a Convex Cloud realtime backend (`convex/`). Static assets live in `public/`, and documentation is maintained in `docs/` (docs7 site), `README.md` (full project spec), `GEMINI.md` (UI/UX goals), `phasewise_plan.md` (engineering roadmap), and `hackathon.md` (build log). The Python agent service directory (`agent/`) is planned but not yet scaffolded. Keep UI code in `src/` (static assets in `public/`), Convex functions and schema in `convex/`, and agent code in `agent/` once added.

## Build, Test, and Development Commands

Run `npm install` once to install frontend dependencies listed in `package.json`. The verified workflow is:

- `npm install` — install frontend dependencies.
- `npm run dev` — start the Next.js frontend dev server at `http://localhost:3000`.
- `npx convex dev` — start the local Convex backend with hot reload (run in a second terminal).
- `npm run build` — create a production frontend build.
- `npm run lint` — run the Next.js linter.

No test framework is configured yet; add tests beside the relevant TypeScript modules as `*.test.ts` or `*.test.tsx` following the Testing Guidelines below. Only add test scripts to `package.json` after they have been run successfully in the current checkout.

## Coding Style & Naming Conventions

Use the formatter and linter configured by the project; add them before introducing substantial code. Prefer 2-space indentation, TypeScript for frontend and Convex code, and type annotations at API boundaries. Use PascalCase for React components, `use...` for hooks, camelCase for functions and variables, and descriptive Convex function names such as `createRequest` or `listPublishedContent`.

## Testing Guidelines

No testing framework is configured yet. Add tests beside the relevant TypeScript modules as `*.test.ts` or `*.test.tsx`, and keep Python tests under `tests/`. Cover request persistence, agent state transitions, content reuse, retries, and user-visible loading/error states.

## Commit & Pull Request Guidelines

No repository-specific commit convention is documented yet. Use short, imperative subjects (for example, `Add request history view`) and keep commits focused. Pull requests should explain the behavior change, list verification commands, include screenshots for UI changes, link relevant requirements, and update `hackathon.md` after meaningful progress.

## Security & Configuration

Never commit `.env*` files, tokens, deployment keys, private records, or personal data. Keep secrets in the approved local/host configuration and document only variable names. Validate external webhooks, preserve idempotency for agent execution, and redact sensitive values from public logs.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
