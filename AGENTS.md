# AGENTS.md

This file is the repo-native starting point for future AI coding sessions.
Read it before changing code, then read `docs/handoff.md`, `docs/runbook.md`,
and `docs/architecture.md`.

## Product Context

FangClaw / StockClaw is a web-based, explainable investment research dashboard.
Its job is to monitor a target company pool, collect external market materials,
run analysis, and preserve evidence chains so users can inspect why a conclusion
was produced.

This repository is not positioned as an automatic real-money trading executor.
Features that mention weights, signals, actions, or scenarios should be treated
as decision-support and demo/research workflow unless a product owner explicitly
states otherwise.

## Tech Stack

- Frontend: React 19, Vite, TypeScript, Tailwind CSS v4, Radix UI, wouter,
  TanStack Query, tRPC client.
- Backend: Node.js, Express, tRPC, TypeScript.
- Database: Drizzle schema and migrations target MySQL/TiDB; local demo mode
  also supports SQLite through `server/sqliteStore.ts`.
- Tests: Vitest, currently configured mainly for `server/**/*.test.ts` and
  `server/**/*.spec.ts`.
- Package manager: pnpm. Use the checked-in `pnpm-lock.yaml`.

## Main Entry Points

- Frontend app entry: `client/src/main.tsx`.
- Frontend routes: `client/src/App.tsx`.
- Main dashboard page: `client/src/pages/Home.tsx`.
- Backend server entry: `server/_core/index.ts`.
- tRPC router: `server/routers.ts`.
- Data access layer: `server/db.ts`.
- SQLite demo store: `server/sqliteStore.ts`.
- LLM gateway and routing: `server/_core/llm.ts`.
- Environment mapping: `server/_core/env.ts`.
- External data sources: `server/data-sources/`.
- Ingestion pipeline: `server/ingestion/`.

## Common Commands

- Install dependencies: `pnpm install`.
- Development server: `pnpm run dev`.
- Type check: `pnpm run check`.
- Tests: `pnpm run test`.
- Production build: `pnpm run build`.
- Production start: `pnpm run start`.
- Restart local production server on the configured port: `pnpm run prod:restart`.
- Demo readiness check: `pnpm run check:demo`.
- Readiness check: `pnpm run check:readiness`.
- Combined verification: `pnpm run verify`.
- Secret scan: `pnpm run security:scan-secrets`.
- Install git hook for secret scan: `pnpm run hooks:install`.
- Database migration generation/migration: `pnpm run db:push`.

## Local Runtime Notes

- Production mode defaults to port `3100` through `scripts/run-server.mjs` when
  `PORT` is not set.
- Development mode runs `tsx watch server/_core/index.ts` through
  `scripts/run-server.mjs`.
- The backend starts the ingestion poller from `server/ingestion/poller.ts`.
- Runtime logs under `.codex-runtime/` are local artifacts and should not be
  treated as durable project documentation.

## Guardrails

- Do not read, print, copy, or commit real secrets from `.env`.
- Do not modify `.env`, tokens, API keys, or runtime logs unless explicitly
  asked.
- Do not casually change database schemas or historical migration files.
- Do not revert uncommitted work you did not create.
- Do not use `git reset --hard` or checkout files to discard changes unless the
  user explicitly asks and confirms the scope.
- Treat `server/_core/llm.ts`, `server/ingestion/autoAnalyze.ts`,
  `server/db.ts`, `server/sqliteStore.ts`, `server/routers.ts`, and
  `drizzle/` as high-risk areas.
- Prefer adding or updating tests for behavior changes.
- Prefer `rg` / `rg --files` for repository search.
- Use `pnpm run check` and `pnpm run build` before claiming implementation work
  is ready; run targeted Vitest tests when behavior changes.

## Data And Model Boundaries

- Current external data modules include CNINFO, SEC EDGAR, WallstreetCN, and
  iFinD.
- iFinD requires environment configuration and should fail safely when disabled
  or missing a refresh token.
- LLM model routing is centralized in `server/_core/llm.ts`.
- Expensive or high-stakes reasoning should be explicit; do not trigger costly
  scans just to inspect UI state unless requested.
- If an API, model, or credential behavior is uncertain, document the uncertainty
  instead of guessing.

## Documentation Map

- `docs/handoff.md`: current repo state, in-progress work, assumptions, and
  recovery context.
- `docs/runbook.md`: how to run, verify, debug, and safely operate the project.
- `docs/architecture.md`: system map and module responsibilities.
- `docs/DEMO_WALKTHROUGH.md`: demo presentation flow.
- `docs/superpowers/plans/`: historical implementation plans.

