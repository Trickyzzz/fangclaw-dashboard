# Demo Case Closure Development Plan

> **Goal:** Deliver a stable demo version of FangClaw that can walk a user through one complete investment-research case from message input to evidence-chain review in 2-3 minutes.

> **Primary story:** `预置案例 -> AI 分析 -> 标的影响 -> 证据链详情`

**Target Demo Outcome**

The user should be able to:

1. Open the dashboard successfully
2. Understand the research theme and tracked universe at a glance
3. Launch one preloaded case with a single click
4. See structured AI output in the central panel
5. Understand which companies were affected and why
6. Open an evidence-chain detail page
7. Leave with a clear sense that the product is explainable, traceable, and demo-ready

**Scope Principle**

This plan intentionally optimizes for a persuasive demo, not full platform completeness.

Prioritize:
- stable UI
- guided case flow
- strong storytelling
- complete evidence-chain drill-down

De-prioritize:
- full automation
- all data-source integrations
- business workflows like trials/subscriptions/pricing
- deep admin and auth completeness

---

## Current State Summary

**Already in place**
- Three-column dashboard shell
- Company pool / indicator / change-log / evidence views
- SEC + CNINFO cards on the dashboard
- Causal analysis pipeline
- Evidence detail page
- Auto-ingestion scaffolding

**Current demo blockers**
- The app can be sensitive to port collisions during local preview
- Auto-ingestion currently depends on `OPENAI_API_KEY`
- Demo path is still too feature-rich and not guided enough
- The strongest case-entry experience is not yet obvious on the main screen
- The result screen is functional but not yet optimized around a single flagship story

---

## Demo Definition

### Demo Must-Haves

- A stable landing experience on one predictable local URL
- A visible flagship case entry point
- One complete prebuilt case that runs end-to-end
- Structured AI output with confidence, entities, triggered indicators, company impacts
- Evidence ID that links to a readable detail page
- Right-side change log showing analysis and weight changes
- Left-side context with mission brief, anchors, stats, and live external data

### Demo Nice-to-Haves

- Two additional preloaded cases
- Swarm consensus strip / case summary card
- Scenario cards and devil's advocate section polish
- "demo mode" copy hints to guide a presenter

### Out of Scope For This Phase

- Production-grade scheduling
- Full push notification workflow
- Complete commercialization pages
- Full multi-user auth polish
- General-purpose research coverage beyond the AI/semiconductor theme

---

## Flagship Demo Case

### Recommended default case

`宇树科技上市 -> 产业链隐含受益分析`

**Why this case**
- Easy to explain
- Shows non-obvious correlation discovery
- Naturally highlights explainability
- Strong fit for the "Agent Swarm" narrative
- Good visual payoff in company impact cards and evidence-chain detail

### Secondary reserve cases

- `Token 调用量暴增 -> 光模块/算力链受益`
- `海外大厂资本开支 -> 出海光模块链受益`

---

## Delivery Phases

### Phase 1: Demo Flow Lock

**Objective:** make the main user journey obvious and stable

**Tasks**
- [ ] Ensure the app starts reliably for demo use on a predictable port
- [ ] Add a clear "一键体验案例" entry in the main analysis area
- [ ] Set one flagship case as the default recommended case
- [ ] Reduce non-essential distractions in the initial demo path
- [ ] Add empty-state and loading-state polish so the page never feels broken

**Files likely involved**
- `scripts/start-prod-detached.mjs`
- `client/src/pages/Home.tsx`
- `client/src/components/CausalAnalysis.tsx`
- `client/src/components/StatusBar.tsx`

**Exit criteria**
- A presenter can open the app and immediately find how to run the flagship case
- No "what should I click first?" confusion remains

---

### Phase 2: Case Injection and Analysis Storytelling

**Objective:** make one case feel intentional, guided, and impressive

**Tasks**
- [ ] Add a visible flagship case card with concise summary and CTA
- [ ] Support one-click message injection into the analysis input
- [ ] Show progress copy that reinforces the "6 agents collaborating" story
- [ ] Make the analysis result area read top-to-bottom as a narrative:
  - summary
  - confidence
  - entities
  - triggered indicators
  - company impacts
  - scenarios
  - counterargument
  - verification checklist
- [ ] Ensure key outputs are visually grouped and easy to scan

**Files likely involved**
- `client/src/components/CausalAnalysis.tsx`
- `client/src/lib/data.ts`
- `client/src/lib/api.ts`

**Exit criteria**
- Running the flagship case feels like a complete product story, not a raw debug screen

---

### Phase 3: Evidence Chain Proof Layer

**Objective:** prove the product is explainable and traceable

**Tasks**
- [ ] Ensure every flagship analysis clearly exposes an `Evidence ID`
- [ ] Make the evidence detail CTA obvious from the result section
- [ ] Improve the evidence detail page hierarchy:
  - source message
  - analysis summary
  - reasoning chain
  - company impacts
  - verification checklist
  - related logs
- [ ] Verify change-log entries and evidence-detail entries stay in sync
- [ ] Ensure the right-side log stream reinforces the analysis event

**Files likely involved**
- `client/src/pages/EvidenceDetail.tsx`
- `client/src/components/ChangeLog.tsx`
- `server/routers.ts`
- `server/ingestion/autoAnalyze.ts`

**Exit criteria**
- A presenter can click from result -> evidence detail without broken context
- The audience can understand why the conclusion was generated

---

### Phase 4: Demo Data and Reliability Layer

**Objective:** prevent the demo from looking empty or unstable

**Tasks**
- [ ] Make sure the left sidebar always has useful content
- [ ] Keep SEC/CNINFO cards visible and readable
- [ ] Add fallback demo data or safer empty states for thin environments
- [ ] If no LLM key exists, degrade gracefully instead of looking broken
- [ ] Prevent auto-ingestion errors from undermining the demo narrative

**Implementation note**

For demo mode, manual preloaded analysis is more important than background automation.
If needed, the app should prefer:
- case-driven analysis
- readable fallback states
- visible external data cards

over:
- silently failing automation

**Files likely involved**
- `client/src/components/StatsPanel.tsx`
- `server/ingestion/poller.ts`
- `server/_core/index.ts`
- `server/_core/llm.ts`

**Exit criteria**
- Even without full external credentials, the app still presents a coherent demo experience

---

### Phase 5: Polish for Presentation

**Objective:** optimize for live walkthroughs

**Tasks**
- [ ] Tighten copywriting across the core demo path
- [ ] Standardize Chinese wording for the flagship flow
- [ ] Improve visual emphasis on the 3 wow moments:
  - case entry
  - company impact
  - evidence chain
- [ ] Hide or demote lower-priority tabs if they distract from the story
- [ ] Add subtle "recommended walkthrough" cues if needed

**Exit criteria**
- A non-technical viewer can follow the story with minimal explanation

---

## Priority Order

### P0
- Stable startup and predictable preview URL
- One-click flagship case
- Complete analysis result display
- Clickable evidence chain detail
- Log updates visible during/after analysis

### P1
- Strong case cards and demo-first copy
- Better scenario / counterargument presentation
- Demo-safe fallback behavior when credentials are missing

### P2
- Multiple polished cases
- Additional swarm-consensus visualizations
- Further risk/discovery module tuning for showcase depth

---

## Acceptance Criteria

The demo is complete when all of the following are true:

- [ ] The app opens successfully for a presenter on a known local URL
- [ ] The flagship case can be launched within 10 seconds of landing on the page
- [ ] The user sees a complete structured result after triggering the case
- [ ] At least one company-impact block is clearly visible and understandable
- [ ] An evidence chain can be opened from the result or log stream
- [ ] The evidence detail page tells a complete analysis story
- [ ] No critical blank states, infinite spinners, or dead links remain in the main path
- [ ] The full walkthrough can be completed in under 3 minutes

---

## Recommended Execution Order

1. Stabilize startup and preview path
2. Build the flagship one-click case experience
3. Tighten the analysis result layout
4. Tighten evidence-chain detail and change-log linkage
5. Add demo-safe fallback behavior
6. Polish copy and visual emphasis for presentation

---

## Verification Checklist

Before calling the demo ready, verify:

- [ ] `corepack pnpm run build`
- [ ] production preview opens locally
- [ ] flagship case runs without UI breakage
- [ ] evidence detail page is reachable
- [ ] right-side logs reflect the analysis
- [ ] left-side context is populated enough for a presenter

---

## Recommended Next Task

Start with:

`Phase 1 + Phase 2`

because the biggest gap is not the analysis engine itself, but the lack of a sharply guided demo path.
