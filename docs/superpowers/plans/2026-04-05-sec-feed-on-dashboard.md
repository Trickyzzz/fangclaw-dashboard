# SEC Feed On Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a minimal official external data-ingestion path that fetches recent SEC EDGAR filings for tracked US companies and shows them on the production dashboard.

**Architecture:** Add a small server-side data-source module for SEC EDGAR, expose it through a new tRPC router branch, then map the results into a focused dashboard card in the existing left sidebar. Keep this first slice read-only and stateless so users can see live external data immediately without adding database persistence yet.

**Tech Stack:** Express, tRPC, React, Vitest, official SEC EDGAR JSON endpoints

---

### Task 1: Add a failing server test for the SEC filings feed

**Files:**
- Create: `d:\coding_workspace\fangclaw-dashboard\server\sec-data.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("dataSources.secRecentFilings", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns normalized SEC filings for tracked US symbols", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          0: { ticker: "NVDA", cik_str: 1045810, title: "NVIDIA CORP" },
          1: { ticker: "TSM", cik_str: 1046179, title: "TAIWAN SEMICONDUCTOR MANUFACTURING CO LTD" },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          filings: {
            recent: {
              accessionNumber: ["0001045810-25-000123"],
              filingDate: ["2026-04-01"],
              form: ["8-K"],
              primaryDocDescription: ["Current report"],
              primaryDocument: ["nvda-20260401x8k.htm"],
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          filings: {
            recent: {
              accessionNumber: ["0001046179-25-000456"],
              filingDate: ["2026-04-02"],
              form: ["6-K"],
              primaryDocDescription: ["Report of foreign issuer"],
              primaryDocument: ["tsm-20260402x6k.htm"],
            },
          },
        }),
      });

    vi.stubGlobal("fetch", fetchMock);

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.dataSources.secRecentFilings({ limit: 5 });

    expect(result.length).toBe(2);
    expect(result[0]).toMatchObject({
      symbol: "TSM",
      companyName: "TAIWAN SEMICONDUCTOR MANUFACTURING CO LTD",
      formType: "6-K",
    });
    expect(result[0].url).toContain("sec.gov/Archives");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm exec vitest run server/sec-data.test.ts`
Expected: FAIL because `dataSources.secRecentFilings` does not exist yet

- [ ] **Step 3: Commit**

```bash
git add server/sec-data.test.ts
git commit -m "test: cover sec filings feed"
```

### Task 2: Implement the SEC data-source and tRPC route

**Files:**
- Create: `d:\coding_workspace\fangclaw-dashboard\server\data-sources\secEdgar.ts`
- Modify: `d:\coding_workspace\fangclaw-dashboard\server\routers.ts`

- [ ] **Step 1: Write minimal implementation**

```ts
export type SecFilingItem = {
  symbol: string;
  companyName: string;
  cik: string;
  formType: string;
  filedAt: string;
  description: string;
  accessionNumber: string;
  url: string;
};

export async function getRecentSecFilings(limit = 6): Promise<SecFilingItem[]> {
  // fetch SEC ticker map
  // filter tracked US tickers
  // fetch submissions JSON per company
  // normalize recent filings
  // sort by filing date desc and return up to limit
}
```

- [ ] **Step 2: Add the tRPC route**

```ts
dataSources: router({
  secRecentFilings: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(20).optional() }).optional())
    .query(async ({ input }) => {
      return getRecentSecFilings(input?.limit ?? 6);
    }),
}),
```

- [ ] **Step 3: Run test to verify it passes**

Run: `corepack pnpm exec vitest run server/sec-data.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add server/data-sources/secEdgar.ts server/routers.ts server/sec-data.test.ts
git commit -m "feat: add sec filings data source"
```

### Task 3: Expose the new feed to the client and render it in the dashboard

**Files:**
- Modify: `d:\coding_workspace\fangclaw-dashboard\client\src\lib\api.ts`
- Modify: `d:\coding_workspace\fangclaw-dashboard\client\src\components\StatsPanel.tsx`

- [ ] **Step 1: Add a client hook and type**

```ts
export interface SecFilingFeedItem {
  symbol: string;
  companyName: string;
  formType: string;
  filedAt: string;
  description: string;
  url: string;
}

export function useSecRecentFilings(limit = 6) {
  const query = trpc.dataSources.secRecentFilings.useQuery({ limit });
  return {
    filings: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
```

- [ ] **Step 2: Render a new sidebar card**

```tsx
const { filings, isLoading: filingsLoading } = useSecRecentFilings(5);

// render a "最新监管披露" section above the heatmap
// show symbol, form type, filed date, short description, and external link
```

- [ ] **Step 3: Run a production build**

Run: `corepack pnpm run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add client/src/lib/api.ts client/src/components/StatsPanel.tsx
git commit -m "feat: show sec filings on dashboard"
```

### Task 4: Verify end-to-end in production mode

**Files:**
- No code changes required

- [ ] **Step 1: Run targeted tests**

Run: `corepack pnpm exec vitest run server/sec-data.test.ts`
Expected: PASS

- [ ] **Step 2: Run the production server**

Run: `corepack pnpm run start`
Expected: server listens locally and serves the dashboard

- [ ] **Step 3: Smoke-check the endpoint**

Run: `curl -I http://127.0.0.1:3000`
Expected: `HTTP/1.1 200 OK`

- [ ] **Step 4: Manually confirm the sidebar shows recent SEC filings**

Open the production dashboard and confirm the new "最新监管披露" section lists live items.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "chore: verify sec feed dashboard slice"
```
