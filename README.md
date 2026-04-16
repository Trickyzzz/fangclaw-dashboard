# FangClaw Dashboard

FangClaw / StockClaw is a web-based, explainable investment research dashboard.
It monitors a target company pool, collects external market materials, runs
analysis, and preserves evidence chains so users can inspect why a conclusion
was produced.

This repository is for decision-support and demo/research workflows. It is not
positioned as an automatic real-money trading executor.

## Stack

- Frontend: React 19, Vite, TypeScript, Tailwind CSS v4, Radix UI, wouter,
  TanStack Query, tRPC client.
- Backend: Node.js, Express, tRPC, TypeScript.
- Database: Drizzle with MySQL/TiDB migrations; SQLite demo mode through
  `server/sqliteStore.ts`.
- Tests: Vitest, mainly under `server/**/*.test.ts` and `server/**/*.spec.ts`.
- Package manager: pnpm. Use the checked-in `pnpm-lock.yaml`.

## Run Locally

```bash
pnpm install
pnpm run dev
```

Production-style local run:

```bash
pnpm run build
pnpm run prod:restart
```

Production mode usually serves `http://127.0.0.1:3100` when `PORT` is not set.

Useful checks:

```bash
pnpm run check
pnpm run test
pnpm run build
pnpm run check:demo
pnpm run security:scan-secrets
```

## Key Directories

- `client/src/`: React frontend.
- `server/_core/`: Express server entry, environment mapping, LLM routing,
  system routes, and serving helpers.
- `server/routers.ts`: main tRPC app router.
- `server/db.ts`: database access layer.
- `server/sqliteStore.ts`: local SQLite demo storage support.
- `server/data-sources/`: CNINFO, SEC EDGAR, WallstreetCN, and iFinD adapters.
- `server/ingestion/`: polling, normalization, relevance, and auto-analysis.
- `drizzle/`: MySQL/TiDB schema and migrations.
- `docs/`: handoff, runbook, architecture, demo flow, and historical plans.

## Read First

For implementation work, start here:

1. `AGENTS.md`
2. `docs/handoff.md`
3. `docs/runbook.md`
4. `docs/architecture.md`

Use `docs/DEMO_WALKTHROUGH.md` when preparing or checking a demo.

## Safety Notes

- Do not read, print, copy, or commit real secrets from `.env`.
- Do not modify `.env`, tokens, API keys, or runtime logs unless explicitly
  asked.
- The worktree may be dirty. Do not broadly revert, delete, or overwrite
  uncommitted work you did not create.
- Treat `server/_core/llm.ts`, `server/ingestion/autoAnalyze.ts`,
  `server/db.ts`, `server/sqliteStore.ts`, `server/routers.ts`, and `drizzle/`
  as high-risk areas.
- Before claiming implementation work is ready, run `pnpm run check` and
  `pnpm run build`; run targeted Vitest tests when behavior changes.
