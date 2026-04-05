# Auto Ingestion Mixed Mode Design

## Goal

Build a first-stage background ingestion loop inside the existing app so recent `SEC EDGAR` and `CNINFO` announcements are polled automatically, analyzed automatically, and only allowed to update company weights when they pass explicit relevance and confidence gates.

## Scope

This stage adds:

- in-app periodic polling for `SEC` and `CNINFO`
- cross-source deduplication for recently seen announcements
- mixed-mode gating:
  - low-value or low-confidence items create read-only evidence records
  - high-value, high-confidence items are allowed to flow into the existing full analysis/update pipeline
- a lightweight status surface in the dashboard so the user can see whether background ingestion is running

This stage does **not** add:

- OS-level schedulers or Windows Task Scheduler integration
- persistent ingestion task tables
- guaranteed exactly-once delivery across app restarts
- full-blown job queue infrastructure

## Why This Design

The current repo already has:

- external data adapters for `SEC` and `CNINFO`
- a working causal analysis engine in `server/routers.ts`
- evidence-chain and change-log concepts already present in the domain model

What is missing is the orchestration layer between “new external announcement exists” and “system decides whether to apply it”. A lightweight in-process polling service is the smallest safe step that preserves the current architecture while proving the end-to-end behavior.

## Desired Behavior

### Background Loop

When the server starts in production or development, a background poller should start. On a fixed interval, it should:

1. fetch recent `SEC` filings
2. fetch recent `CNINFO` announcements
3. normalize them into a shared candidate shape
4. drop duplicates already seen during the current process lifetime
5. evaluate whether the candidate is worth analysis
6. run automated analysis only for accepted candidates
7. either:
   - record a read-only evidence item, or
   - execute the existing full mutation path and allow weight updates

### Mixed-Mode Gating

Each candidate should be classified into one of two paths:

- `observe_only`
  - create evidence
  - do not update company weights
  - do not create weight change logs
- `full_apply`
  - run the existing analysis/apply flow
  - allow company weight changes
  - create normal change logs and downstream notifications

The decision should be based on:

- keyword relevance
- whether the announcement maps to a tracked company
- model confidence after analysis

### User Visibility

The dashboard should show a compact ingestion status area containing:

- last poll time
- number of candidates scanned
- number deduplicated
- number observed only
- number fully applied
- last error, if any

## Architecture

### New Units

#### `server/ingestion/types.ts`

Defines shared types used by the ingestion flow:

- normalized source candidate
- gating decision
- ingestion status snapshot

#### `server/ingestion/normalizeExternalItem.ts`

Converts `SEC` and `CNINFO` feed items into a unified shape:

- `source`
- `externalId`
- `symbol`
- `companyName`
- `title`
- `publishedAt`
- `url`
- `rawText`

#### `server/ingestion/relevance.ts`

Implements deterministic pre-analysis filtering:

- tracked company symbol match
- high-value keywords
- announcement type relevance

This prevents obviously noisy announcements from hitting the LLM.

#### `server/ingestion/dedupeStore.ts`

In-memory dedupe registry for phase one.

Stores recently processed `source + externalId` keys and last-seen timestamps. This is intentionally process-local for now.

#### `server/ingestion/autoAnalyze.ts`

Coordinates the ingestion decision:

1. normalize candidate
2. run deterministic relevance gate
3. call LLM analysis only when eligible
4. decide `observe_only` vs `full_apply`
5. create evidence accordingly

#### `server/ingestion/poller.ts`

Owns the periodic loop and mutable status snapshot.

Responsibilities:

- timer setup/teardown
- source fan-out (`SEC`, `CNINFO`)
- per-cycle counters
- exposing latest status to the app

### Reuse of Existing Logic

The current `causal.analyze` mutation in `server/routers.ts` already contains the full apply path. We should not duplicate that entire block. Instead, extract the shared “analyze and maybe apply impacts” logic into a reusable internal function.

Recommended split:

- existing router mutation becomes a thin wrapper
- reusable internal function accepts:
  - source message
  - source metadata
  - `applyImpacts: boolean`

That internal function returns the same analysis payload either way, while only mutating weights/logs when `applyImpacts === true`.

## Gating Rules

### Pre-LLM Deterministic Gate

A candidate is eligible for automated analysis only if at least one is true:

- its `symbol` matches a tracked company directly
- its `companyName` matches a tracked company name
- its title contains one of the configured high-value keywords

Initial keyword set:

- `业绩`
- `订单`
- `中标`
- `回购`
- `增持`
- `减持`
- `募资`
- `并购`
- `重组`
- `董事会`
- `8-K`
- `10-K`
- `10-Q`
- `6-K`

### Post-LLM Mixed Mode Gate

After analysis:

- `full_apply` when:
  - confidence `>= 75`
  - at least one tracked company impact exists
  - at least one impact changes weight by `>= 1`
- otherwise `observe_only`

### Observe-Only Evidence Rules

Observe-only items still generate:

- evidence id
- source metadata
- analysis summary
- confidence
- reasoning
- scenarios if available
- verification questions

But they must not:

- change company weights
- create weight change logs
- trigger anomaly-based notifications from the weight path

## Error Handling

### Source Failures

If `SEC` fails but `CNINFO` succeeds:

- continue the cycle
- record the source error in poller status
- do not fail the whole ingestion loop

### Analysis Failures

If a single candidate fails analysis:

- log the failure
- count it in cycle status
- continue other candidates

### Empty Data

If a feed returns no items:

- treat as successful zero-result poll
- do not show it as an error

## Testing Strategy

### Unit Tests

- normalization from `SEC`
- normalization from `CNINFO`
- dedupe store behavior
- deterministic relevance gate
- mixed-mode decision logic

### Integration Tests

- poller processes a candidate into observe-only evidence
- poller processes a high-confidence candidate into full-apply analysis
- duplicate items are ignored on subsequent cycles

## Frontend Design

Add a small card or strip in the existing sidebar or status area that reads from a new `tRPC` route such as:

- `system.ingestionStatus`

Displayed fields:

- polling state
- last run time
- scanned count
- observed count
- applied count
- last source error

This should be intentionally compact and operational, not a large new panel.

## Files Expected To Change

- `server/routers.ts`
- `server/_core/index.ts`
- `server/data-sources/secEdgar.ts`
- `server/data-sources/cninfo.ts`
- `client/src/lib/api.ts`
- `client/src/components/StatsPanel.tsx`

Files expected to be added:

- `server/ingestion/types.ts`
- `server/ingestion/normalizeExternalItem.ts`
- `server/ingestion/relevance.ts`
- `server/ingestion/dedupeStore.ts`
- `server/ingestion/autoAnalyze.ts`
- `server/ingestion/poller.ts`
- tests for the ingestion flow

## Open Decision Already Resolved

User-selected mode: `3`

Interpretation:

- background automatic polling
- automatic analysis
- conditional weight updates only for strong candidates
- all weaker candidates still preserved as evidence

## Acceptance Criteria

The feature is complete when:

1. the server polls `SEC` and `CNINFO` on an interval without manual action
2. duplicate announcements are not reprocessed within the same app runtime
3. weak candidates produce observe-only evidence
4. strong candidates are allowed to update company weights through the existing logic
5. the dashboard shows latest ingestion status
6. production mode remains accessible and stable after the poller is enabled
