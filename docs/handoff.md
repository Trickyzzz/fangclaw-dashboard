# FangClaw Handoff

Last updated: 2026-04-16

This file is for future AI coding sessions that need to resume work after lost
chat history, account switching, IDE restarts, or tool changes.

## Read First

1. `AGENTS.md`
2. `docs/runbook.md`
3. `docs/architecture.md`
4. `docs/DEMO_WALKTHROUGH.md`

Do not rely on chat history as the only source of truth.

## Stable Repo Facts

- This is a pnpm-managed Node/TypeScript project.
- The app is a web-based explainable investment research dashboard.
- Frontend entry is `client/src/main.tsx`; app routes are in `client/src/App.tsx`.
- Backend entry is `server/_core/index.ts`.
- Main tRPC router is `server/routers.ts`.
- Database access is in `server/db.ts`.
- MySQL/TiDB schema and migrations live under `drizzle/`.
- Local SQLite demo support exists in `server/sqliteStore.ts`.
- External data source modules live in `server/data-sources/`.
- Ingestion and auto-analysis code lives in `server/ingestion/`.
- LLM invocation and model routing are centralized in `server/_core/llm.ts`.
- Production build output goes to `dist/`.
- Local production mode usually serves `http://127.0.0.1:3100`.

## Current Worktree Summary

Snapshot source: `git status --short` and `git diff --stat` run on 2026-04-16,
before the Phase 2 documentation files were added.

- Total status entries: 70.
- Modified tracked files: 24.
- Untracked files/directories: 46.
- Tracked diff stat: 24 files changed, 3266 insertions, 273 deletions.
- Phase 2 then added five untracked documentation/config files:
  `AGENTS.md`, `.codex/config.toml`, `docs/handoff.md`, `docs/runbook.md`,
  and `docs/architecture.md`.

Modified tracked areas include:

- Runtime/config support: `.env.example`, `.gitignore`, `package.json`.
- Frontend app and dashboard: `client/src/App.tsx`,
  `client/src/pages/Home.tsx`, `client/src/pages/EvidenceDetail.tsx`.
- Frontend components: `CausalAnalysis`, `ChangeLog`, `CompanyPool`,
  `FactorDiscovery`, `StatsPanel`, `StatusBar`.
- Frontend API adapter: `client/src/lib/api.ts`.
- Server scripts: `scripts/run-server.mjs`, `scripts/start-prod-detached.mjs`.
- Server core: `server/_core/env.ts`, `server/_core/llm.ts`,
  `server/_core/systemRouter.ts`.
- Data and analysis backend: `server/db.ts`, `server/routers.ts`,
  `server/ingestion/autoAnalyze.ts`,
  `server/ingestion/normalizeExternalItem.ts`,
  `server/ingestion/poller.ts`, `server/ingestion/types.ts`.

Untracked areas include:

- Git hook support: `.githooks/`.
- New dashboard/page work: `client/src/components/WarRoomOverview.tsx`,
  `client/src/pages/CompanyDetail.tsx`.
- New frontend helpers: `client/src/lib/candidateAnalysis.ts`,
  `client/src/lib/dataFeedLayers.ts`, `client/src/lib/symbolDisplay.ts`.
- Demo and planning docs: `docs/DEMO_WALKTHROUGH.md`,
  `docs/superpowers/plans/2026-04-05-demo-case-closure-plan.md`,
  `docs/superpowers/plans/2026-04-16-data-feed-layers.md`.
- Operational scripts: `scripts/check-*.mjs`, `scripts/restart-prod.mjs`,
  `scripts/scan-secrets.mjs`, `scripts/tail-prod-log.mjs`,
  `scripts/install-git-hooks.mjs`, `scripts/list-models.mjs`,
  `scripts/extract_pdf_text.py`.
- New server tests and modules for data feeds, factor discovery, candidates,
  iFinD, WallstreetCN, relation profiles, symbol display, and SQLite store.

The worktree is actively in progress. Do not assume untracked files are
disposable. Do not revert broad file groups without explicit user approval.

## Current Uncommitted Work

Based on filenames and recent implementation context, the uncommitted work is
inferred to include the areas below. Treat this as a navigation aid, not as a
verified feature-completion list:

- Local production/development script hardening.
- Secret scanning and pre-commit hook support.
- SQLite demo mode and target-pool persistence support.
- iFinD real-time quote integration.
- WallstreetCN 7x24 market news integration.
- CNINFO and SEC feed usage in dashboard/data-source coverage.
- Factor discovery enhancements, including external context, scan metadata,
  scan explanation, candidate signals, and pending review signals.
- Cognitive analysis evidence-chain fixes.
- Target pool add/remove/edit and watchlist-related UX.
- War-room / situation-screen dashboard work.
- Demo walkthrough and readiness-check scripts.

These statements are a handoff summary, not a substitute for reading the actual
diff before editing related files.

## Assumptions

- The project should remain a decision-support and research demo unless the user
  explicitly changes the product scope.
- Real external data is preferred over fabricated demo data.
- LLM fallback behavior should be visible to the user rather than hidden.
- Expensive LLM scans should not be triggered casually.
- SQLite is currently important for local demo usability.
- MySQL/TiDB migration support still matters and should not be broken casually.

## Unknowns

- Whether every v3.2 commercial feature documented in the v3.2 commercial
  technical update under `docs/` is fully wired in the current SQLite demo path.
- Whether the current LLM gateway requires a custom `User-Agent`; verify
  `server/_core/llm.ts` and the active provider docs before changing it.
- Whether all untracked files should be committed together or split into smaller
  commits.
- Whether `.codex/config.toml` will be read by the user's current Codex version;
  keep durable instructions in `AGENTS.md` and `docs/`.
- Whether iFinD API rate limits or field availability differ by account/product
  entitlement.

## Next Safe Steps

1. Review `git diff --stat` and important diffs before changing code.
2. If continuing implementation, pick one narrow feature area at a time.
3. Add or update targeted tests for behavior changes.
4. Run `pnpm run check` and `pnpm run build` before claiming readiness.
5. Run `pnpm run security:scan-secrets` before committing.
