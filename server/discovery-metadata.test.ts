import { describe, expect, it } from "vitest";
import { buildDiscoveryScanMeta } from "./discoveryMetadata";

describe("buildDiscoveryScanMeta", () => {
  it("summarizes factor discovery scan coverage", () => {
    const meta = buildDiscoveryScanMeta({
      poolSnapshot: { totalCompanies: 12, highWeightCount: 4, avgWeight: 7.1 },
      indicatorSnapshot: { total: 18, triggered: 3, crossTriggered: 2 },
      activeTemplates: [{}, {}, {}, {}, {}],
      recentActivity: [{}, {}],
    });

    expect(meta).toEqual({
      companyCount: 12,
      highWeightCount: 4,
      avgWeight: 7.1,
      indicatorCount: 18,
      triggeredIndicatorCount: 3,
      crossTriggeredIndicatorCount: 2,
      templateCount: 5,
      recentEvidenceCount: 2,
    });
  });
});
