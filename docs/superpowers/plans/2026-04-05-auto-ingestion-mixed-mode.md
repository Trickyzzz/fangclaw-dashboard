# Auto Ingestion Mixed Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an in-app background poller that scans `SEC EDGAR` and `CNINFO`, deduplicates candidates, analyzes relevant items automatically, and only applies company weight changes when they pass explicit confidence and relevance gates.

**Architecture:** Introduce a small ingestion layer between external feeds and the existing causal-analysis engine. Normalize both source types into one candidate shape, dedupe and pre-filter before calling the LLM, then route each analyzed item to either `observe_only` evidence creation or the existing full-apply path. Expose a compact ingestion status snapshot through tRPC so the dashboard can show background job health.

**Tech Stack:** Express, tRPC, React, Vitest, existing LLM helper, SEC EDGAR, CNINFO

---

### Task 1: Add failing tests for the new ingestion flow

**Files:**
- Create: `d:\coding_workspace\fangclaw-dashboard\server\ingestion.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createInMemoryDedupeStore } from "./ingestion/dedupeStore";
import { shouldAnalyzeCandidate, shouldApplyImpacts } from "./ingestion/relevance";

describe("ingestion dedupe store", () => {
  it("marks duplicate source items within the same runtime", () => {
    const store = createInMemoryDedupeStore();
    expect(store.has("sec:abc")).toBe(false);
    store.add("sec:abc");
    expect(store.has("sec:abc")).toBe(true);
  });
});

describe("ingestion relevance gates", () => {
  it("accepts tracked company direct matches before LLM analysis", () => {
    expect(
      shouldAnalyzeCandidate({
        symbol: "NVDA",
        companyName: "NVIDIA CORP",
        title: "NVIDIA files 8-K",
        rawText: "NVIDIA files 8-K",
      })
    ).toBe(true);
  });

  it("keeps low-confidence results in observe-only mode", () => {
    expect(
      shouldApplyImpacts({
        confidence: 60,
        impacts: [{ symbol: "NVDA", weightDelta: 1 }],
      })
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm exec vitest run server/ingestion.test.ts`
Expected: FAIL because the ingestion modules do not exist yet

- [ ] **Step 3: Commit**

```bash
git add server/ingestion.test.ts
git commit -m "test: cover ingestion gating primitives"
```

### Task 2: Implement normalized candidate types, dedupe store, and gating helpers

**Files:**
- Create: `d:\coding_workspace\fangclaw-dashboard\server\ingestion\types.ts`
- Create: `d:\coding_workspace\fangclaw-dashboard\server\ingestion\dedupeStore.ts`
- Create: `d:\coding_workspace\fangclaw-dashboard\server\ingestion\relevance.ts`
- Test: `d:\coding_workspace\fangclaw-dashboard\server\ingestion.test.ts`

- [ ] **Step 1: Write minimal implementations**

```ts
// types.ts
export type IngestionCandidate = {
  source: "sec" | "cninfo";
  externalId: string;
  symbol: string;
  companyName: string;
  title: string;
  publishedAt: string;
  url: string;
  rawText: string;
};

export type MixedModeDecision = "observe_only" | "full_apply";

export type IngestionStatus = {
  running: boolean;
  lastRunAt: string | null;
  scannedCount: number;
  dedupedCount: number;
  observedCount: number;
  appliedCount: number;
  lastError: string | null;
};
```

```ts
// dedupeStore.ts
export function createInMemoryDedupeStore() {
  const seen = new Map<string, number>();
  return {
    has(key: string) {
      return seen.has(key);
    },
    add(key: string) {
      seen.set(key, Date.now());
    },
    snapshot() {
      return Array.from(seen.keys());
    },
  };
}
```

```ts
// relevance.ts
const HIGH_VALUE_KEYWORDS = ["业绩", "订单", "中标", "回购", "增持", "减持", "募资", "并购", "重组", "董事会", "8-K", "10-K", "10-Q", "6-K"];
const TRACKED_US_SYMBOLS = ["NVDA", "TSM", "ASML", "AMD", "AVGO", "MU", "QCOM", "INTC"];

export function shouldAnalyzeCandidate(candidate: {
  symbol: string;
  companyName: string;
  title: string;
  rawText: string;
}) {
  const haystack = `${candidate.companyName} ${candidate.title} ${candidate.rawText}`;
  return TRACKED_US_SYMBOLS.includes(candidate.symbol) || HIGH_VALUE_KEYWORDS.some(keyword => haystack.includes(keyword));
}

export function shouldApplyImpacts(input: {
  confidence: number;
  impacts: Array<{ symbol: string; weightDelta: number }>;
}) {
  return input.confidence >= 75 && input.impacts.some(impact => Math.abs(impact.weightDelta) >= 1);
}
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `corepack pnpm exec vitest run server/ingestion.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add server/ingestion/types.ts server/ingestion/dedupeStore.ts server/ingestion/relevance.ts server/ingestion.test.ts
git commit -m "feat: add ingestion primitives"
```

### Task 3: Normalize SEC and CNINFO feed items into a shared candidate shape

**Files:**
- Create: `d:\coding_workspace\fangclaw-dashboard\server\ingestion\normalizeExternalItem.ts`
- Modify: `d:\coding_workspace\fangclaw-dashboard\server\data-sources\secEdgar.ts`
- Modify: `d:\coding_workspace\fangclaw-dashboard\server\data-sources\cninfo.ts`
- Test: `d:\coding_workspace\fangclaw-dashboard\server\sec-data.test.ts`
- Test: `d:\coding_workspace\fangclaw-dashboard\server\cninfo-data.test.ts`

- [ ] **Step 1: Add normalization helpers**

```ts
import type { SecFilingItem } from "../data-sources/secEdgar";
import type { CninfoAnnouncementItem } from "../data-sources/cninfo";
import type { IngestionCandidate } from "./types";

export function normalizeSecItem(item: SecFilingItem): IngestionCandidate {
  return {
    source: "sec",
    externalId: item.accessionNumber,
    symbol: item.symbol,
    companyName: item.companyName,
    title: item.description,
    publishedAt: item.filedAt,
    url: item.url,
    rawText: `${item.symbol} ${item.companyName} ${item.description}`,
  };
}

export function normalizeCninfoItem(item: CninfoAnnouncementItem): IngestionCandidate {
  return {
    source: "cninfo",
    externalId: item.announcementId,
    symbol: item.symbol,
    companyName: item.companyName,
    title: item.title,
    publishedAt: item.publishedAt,
    url: item.pdfUrl,
    rawText: `${item.symbol} ${item.companyName} ${item.title}`,
  };
}
```

- [ ] **Step 2: Ensure source modules export stable item types**

Run: `corepack pnpm exec vitest run server/sec-data.test.ts server/cninfo-data.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add server/ingestion/normalizeExternalItem.ts server/data-sources/secEdgar.ts server/data-sources/cninfo.ts server/sec-data.test.ts server/cninfo-data.test.ts
git commit -m "feat: normalize external feed items"
```

### Task 4: Extract reusable causal-analysis execution with conditional apply mode

**Files:**
- Create: `d:\coding_workspace\fangclaw-dashboard\server\ingestion\autoAnalyze.ts`
- Modify: `d:\coding_workspace\fangclaw-dashboard\server\routers.ts`
- Test: `d:\coding_workspace\fangclaw-dashboard\server\ingestion.test.ts`

- [ ] **Step 1: Extract an internal analysis runner**

```ts
type ExecuteAnalysisInput = {
  message: string;
  sourceType: string;
  sourceUrl?: string | null;
  applyImpacts: boolean;
};

export async function executeCausalAnalysis(input: ExecuteAnalysisInput) {
  // Move existing causal.analyze internals into this function
  // Preserve current return shape
  // Only update weights / change logs / notifications when applyImpacts is true
}
```

- [ ] **Step 2: Keep router mutation as a thin wrapper**

```ts
analyze: publicProcedure
  .input(...)
  .mutation(async ({ input }) => {
    return executeCausalAnalysis({
      message: input.message,
      sourceType: input.sourceType ?? "manual",
      sourceUrl: input.sourceUrl ?? null,
      applyImpacts: true,
    });
  })
```

- [ ] **Step 3: Add a focused integration test for observe-only mode**

```ts
it("keeps low-confidence external items in observe-only mode", async () => {
  // stub invokeLLM to return confidence 60 + one impact
  // expect executeCausalAnalysis(... applyImpacts: false) to return analysis
  // expect no weight change log to be created
});
```

- [ ] **Step 4: Run targeted tests**

Run: `corepack pnpm exec vitest run server/ingestion.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/ingestion/autoAnalyze.ts server/routers.ts server/ingestion.test.ts
git commit -m "refactor: add reusable causal execution for ingestion"
```

### Task 5: Add the background poller and in-memory status snapshot

**Files:**
- Create: `d:\coding_workspace\fangclaw-dashboard\server\ingestion\poller.ts`
- Modify: `d:\coding_workspace\fangclaw-dashboard\server\_core\index.ts`
- Modify: `d:\coding_workspace\fangclaw-dashboard\server\routers.ts`
- Test: `d:\coding_workspace\fangclaw-dashboard\server\ingestion.test.ts`

- [ ] **Step 1: Implement poller status and cycle processing**

```ts
const status: IngestionStatus = {
  running: false,
  lastRunAt: null,
  scannedCount: 0,
  dedupedCount: 0,
  observedCount: 0,
  appliedCount: 0,
  lastError: null,
};

export function getIngestionStatus() {
  return status;
}

export async function runIngestionCycle() {
  // fetch SEC + CNINFO
  // normalize all items
  // dedupe by source:externalId
  // pre-filter with shouldAnalyzeCandidate
  // analyze eligible items
  // classify with shouldApplyImpacts
  // call executeCausalAnalysis with applyImpacts true/false
  // update status counters
}

export function startIngestionPoller() {
  // setInterval(runIngestionCycle, ...)
}
```

- [ ] **Step 2: Start poller from server startup**

```ts
await startIngestionPoller();
```

- [ ] **Step 3: Expose ingestion status via tRPC**

```ts
system: systemRouter.merge("ingestion.", router({
  status: publicProcedure.query(() => getIngestionStatus()),
}))
```

- [ ] **Step 4: Run targeted tests**

Run: `corepack pnpm exec vitest run server/ingestion.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/ingestion/poller.ts server/_core/index.ts server/routers.ts server/ingestion.test.ts
git commit -m "feat: add background ingestion poller"
```

### Task 6: Surface ingestion status in the dashboard

**Files:**
- Modify: `d:\coding_workspace\fangclaw-dashboard\client\src\lib\api.ts`
- Modify: `d:\coding_workspace\fangclaw-dashboard\client\src\components\StatusBar.tsx`
- Modify: `d:\coding_workspace\fangclaw-dashboard\client\src\components\StatsPanel.tsx`

- [ ] **Step 1: Add client hook for ingestion status**

```ts
export function useIngestionStatus() {
  const query = trpc.system.ingestion.status.useQuery(undefined, {
    refetchInterval: 15000,
  });
  return {
    ingestionStatus: query.data,
    isLoading: query.isLoading,
  };
}
```

- [ ] **Step 2: Add a compact status strip**

```tsx
// show last run time, scanned, observed, applied, last error
```

- [ ] **Step 3: Run production build**

Run: `corepack pnpm run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add client/src/lib/api.ts client/src/components/StatusBar.tsx client/src/components/StatsPanel.tsx
git commit -m "feat: show ingestion poller status"
```

### Task 7: Verify the end-to-end background flow

**Files:**
- Modify: `d:\coding_workspace\fangclaw-dashboard\scripts\check-sec-feed.mjs`
- Modify: `d:\coding_workspace\fangclaw-dashboard\scripts\check-cninfo.mjs`

- [ ] **Step 1: Run focused tests**

Run: `corepack pnpm exec vitest run server/sec-data.test.ts server/cninfo-data.test.ts server/ingestion.test.ts`
Expected: PASS

- [ ] **Step 2: Run production build**

Run: `corepack pnpm run build`
Expected: PASS

- [ ] **Step 3: Start production server**

Run: `node scripts/start-prod-detached.mjs`
Expected: detached server starts and logs startup

- [ ] **Step 4: Verify the UI still loads**

Run: `curl -I http://127.0.0.1:3005`
Expected: `HTTP/1.1 200 OK` (or whichever selected port is logged)

- [ ] **Step 5: Verify ingestion status endpoint**

Run: `node scripts/check-trpc.mjs`
Expected: `200` response from tRPC

- [ ] **Step 6: Commit**

```bash
git add scripts/check-sec-feed.mjs scripts/check-cninfo.mjs
git commit -m "chore: verify mixed-mode auto ingestion"
```
