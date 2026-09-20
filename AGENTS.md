# Repository Guidelines

## Agent Operating Rules

- Work as token-efficiently as practical.
- Do not use subagents without asking for permission first.
- Do not run `git stash`, `git commit`, `git pull`, or `git push`; `git status` is the only permitted Git command.
- Never inspect `.env` files or read system environment-variable values.

## Project Structure & Module Organization

This repository is currently documentation-first: `README.md` briefly identifies the UI, `PRODUCT.md` contains the product specification and architecture, and `hackathon.md` is the public build log. The planned implementation separates a React/Next.js frontend from a Convex backend and a Python agent service. As code is added, keep UI code in `src/` (static assets in `public/`), Convex functions and schema in `convex/`, and Python agent code in a clearly named service directory such as `agent/`.

## Build, Test, and Development Commands

No package manifest or runnable scripts exist yet. When scaffolding is added, document the exact commands in `package.json` and update this file. The expected workflow is:

- `npm install` — install frontend dependencies.
- `npm run dev` — start the local frontend and Convex development services.
- `npm run build` — create a production frontend build.
- `npm test` — run the complete test suite.

Do not claim a command works until it has been run successfully in the current checkout.

## Coding Style & Naming Conventions

Use the formatter and linter configured by the project; add them before introducing substantial code. Prefer 2-space indentation, TypeScript for frontend and Convex code, and type annotations at API boundaries. Use PascalCase for React components, `use...` for hooks, camelCase for functions and variables, and descriptive Convex function names such as `createRequest` or `listPublishedContent`.

## Testing Guidelines

No testing framework is configured yet. Add tests beside the relevant TypeScript modules as `*.test.ts` or `*.test.tsx`, and keep Python tests under `tests/`. Cover request persistence, agent state transitions, content reuse, retries, and user-visible loading/error states.

## Commit & Pull Request Guidelines

No repository-specific commit convention is documented yet. Use short, imperative subjects (for example, `Add request history view`) and keep commits focused. Pull requests should explain the behavior change, list verification commands, include screenshots for UI changes, link relevant requirements, and update `hackathon.md` after meaningful progress.

## Security & Configuration

Never commit `.env*` files, tokens, deployment keys, private records, or personal data. Keep secrets in the approved local/host configuration and document only variable names. Validate external webhooks, preserve idempotency for agent execution, and redact sensitive values from public logs.
