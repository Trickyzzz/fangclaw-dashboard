# Data Feed Layers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the sidebar data feeds from separate source cards into a clearly layered evidence-grade data source panel.

**Architecture:** Add a small pure helper that describes each source's layer, source name, live/fallback state, and count. Render that helper in `StatsPanel` as a compact "数据源雷达" summary above the detailed CNINFO, SEC, and WallstreetCN lists. Keep existing APIs unchanged.

**Tech Stack:** React, TypeScript, tRPC hooks, Vitest.

---

### Task 1: Add Data Feed Layer Model

**Files:**
- Create: `client/src/lib/dataFeedLayers.ts`
- Create: `client/src/lib/dataFeedLayers.test.ts`

- [ ] Write a failing test that expects CNINFO and SEC to be `官方披露`, WallstreetCN to be `实时快讯`, and fallback states to be visible.
- [ ] Implement `buildDataFeedLayerStatus`.
- [ ] Run `corepack pnpm test -- client/src/lib/dataFeedLayers.test.ts`.

### Task 2: Render Data Feed Radar In Sidebar

**Files:**
- Modify: `client/src/components/StatsPanel.tsx`

- [ ] Import `buildDataFeedLayerStatus`.
- [ ] Add a compact "数据源雷达 / Data Feeds" block before the detailed feed lists.
- [ ] Show `官方披露`, `实时快讯`, and `系统状态` badges with source counts and live/fallback indicators.
- [ ] Keep existing CNINFO, SEC, and WallstreetCN detailed lists.

### Task 3: Verify Production Demo

**Commands:**
- `corepack pnpm run check`
- `corepack pnpm run build`
- `corepack pnpm run check:demo`

- [ ] Restart production service on port `3100`.
- [ ] Confirm the latest bundle is served.
