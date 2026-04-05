import { describe, expect, it } from "vitest";
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
      }),
    ).toBe(true);
  });

  it("keeps low-confidence results in observe-only mode", () => {
    expect(
      shouldApplyImpacts({
        confidence: 60,
        impacts: [{ symbol: "NVDA", weightDelta: 1 }],
      }),
    ).toBe(false);
  });
});
