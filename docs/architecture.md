# FangClaw Architecture

This document maps the repository structure and major runtime flows.

## System Overview

```text
Browser
  -> React app in client/src
  -> tRPC client in client/src/lib/trpc.ts and client/src/lib/api.ts
  -> Express server in server/_core/index.ts
  -> tRPC router in server/routers.ts
  -> DB, LLM gateway, data sources, ingestion pipeline
```

The app is a full-stack TypeScript web application. Vite builds the frontend to
`dist/public`; esbuild bundles the backend server to `dist/index.js`.

## Frontend Structure

- `client/src/main.tsx`: creates the React root, QueryClient, and tRPC client.
- `client/src/App.tsx`: defines app routes with wouter.
- `client/src/pages/Home.tsx`: main dashboard page.
- `client/src/pages/EvidenceDetail.tsx`: evidence chain detail page.
- `client/src/pages/CompanyDetail.tsx`: company detail page if present in the
  current worktree.
- `client/src/components/`: dashboard panels and UI modules.
- `client/src/components/ui/`: shared Radix-style UI primitives.
- `client/src/lib/api.ts`: frontend-facing tRPC hooks and adapter types.
- `client/src/lib/trpc.ts`: tRPC client typing.

Important dashboard components include:

- `CompanyPool`: target company pool.
- `CausalAnalysis`: cognitive analysis input/result flow.
- `FactorDiscovery`: factor discovery and candidate signal UI.
- `StatsPanel`: data source and market data sidebar.
- `ChangeLog`: evidence and weight/action log stream.
- `WarRoomOverview`: situation-screen overview if present in the current
  worktree.

## Backend Structure

- `server/_core/index.ts`: Express server entry, tRPC middleware, OAuth routes,
  Vite/static serving, ingestion poller startup.
- `server/_core/vite.ts`: development Vite integration and production static
  serving.
- `server/_core/context.ts`: tRPC context.
- `server/_core/env.ts`: environment variable mapping.
- `server/_core/llm.ts`: LLM-compatible chat completion client and model
  routing.
- `server/_core/systemRouter.ts`: system/readiness/ingestion status endpoints.
- `server/routers.ts`: main app router.
- `server/db.ts`: database access functions.
- `server/sqliteStore.ts`: local SQLite schema, seed, and demo storage support.
- `server/data-sources/`: external data adapters.
- `server/ingestion/`: polling, normalization, dedupe, relevance, and
  auto-analysis.

## API Shape

The main app router is exported from `server/routers.ts`.

Known router areas include:

- `system`: readiness and ingestion status.
- `dataSources`: SEC, CNINFO, WallstreetCN, and iFinD data queries.
- `companies`: target pool list/detail/stats and pool management.
- `changeLogs`: recent action/evidence log stream.
- `evidence`: evidence chain retrieval and related views.
- `factorTemplates`: factor template listing.
- `risk`: crowding and risk-related analysis.
- `indicators`: indicator list and heatmap.
- `causal`: cognitive analysis and factor discovery.
- Commercial routes may include subscriptions, reports, trials, and sharing.

Always inspect `server/routers.ts` before assuming exact endpoint names or input
schemas.

## Database Model

The Drizzle schema lives in `drizzle/schema.ts` and migrations live in
`drizzle/`.

SQLite demo mode is initialized in `server/sqliteStore.ts` and currently defines
local tables such as:

- `companies`
- `indicators`
- `changeLogs`
- `evidenceChains`
- `keyVariables`
- `factorTemplates`
- `watchlists`

The MySQL/TiDB and SQLite paths are related but not identical. When changing
persistence behavior, verify both the intended local demo path and the intended
production database path.

## Core Product Flows

### Cognitive Analysis

```text
User message or demo input
  -> causal.analyze
  -> server/ingestion/autoAnalyze.ts
  -> LLM or fallback analysis
  -> evidence chain
  -> optional company impact / weight log
  -> UI result and evidence detail page
```

### Factor Discovery

```text
Target pool + indicators + external data context
  -> causal.discover
  -> candidate signal pre-screening
  -> optional LLM deep scan
  -> discovered signals / pending review signals / scan explanation
  -> FactorDiscovery UI
```

### External Data Ingestion

```text
Scheduled poller
  -> SEC / CNINFO / WallstreetCN fetch
  -> normalize external items
  -> dedupe
  -> relevance filter
  -> observe-only or full analysis decision
  -> evidence/change log updates
```

iFinD is currently used for real-time quote style data rather than the same
polling path as text/news feeds.

## Model Routing

Model routing is centralized in `server/_core/llm.ts`.

The intended model split is:

- Mini model: low-cost summaries, light extraction, routine analysis.
- Pro model: complex reasoning, factor discovery, structured high-stakes
  analysis, and multi-source synthesis.

Actual provider behavior depends on `.env` values, account permissions, quota,
and any required provider-specific headers.

## Build And Serving

Development:

```text
pnpm run dev
  -> node scripts/run-server.mjs development
  -> tsx watch server/_core/index.ts
  -> Express + Vite middleware
```

Production:

```text
pnpm run build
  -> vite build
  -> esbuild server/_core/index.ts to dist/index.js

pnpm run start
  -> node scripts/run-server.mjs production
  -> node dist/index.js
  -> Express serves dist/public
```

## Architecture Risks

- `server/routers.ts` is a large integration point; small edits can affect many
  UI flows.
- `server/db.ts` bridges MySQL/TiDB and SQLite behavior; avoid changing one path
  without considering the other.
- `server/_core/llm.ts` affects model cost, quality, authentication, and
  fallback behavior.
- `server/ingestion/autoAnalyze.ts` affects evidence generation and target-pool
  changes.
- Data source modules depend on third-party response shapes and rate limits.
- Product docs may describe intended/future behavior; verify implementation
  before claiming a feature is complete.

