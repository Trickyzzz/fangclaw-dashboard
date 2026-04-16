import { describe, expect, it } from "vitest";
import { buildPendingReviewSignals } from "./discoveryReviewSignals";

describe("buildPendingReviewSignals", () => {
  it("promotes ready candidates into pending-review discovery records", () => {
    const signals = buildPendingReviewSignals([
      {
        title: "订单/需求候选信号",
        severity: "near_trigger",
        confidence: 78,
        upgradeReadiness: 80,
        upgradeRecommendation: {
          level: "ready_for_review",
          label: "建议升级复核",
          reason: "候选已满足多数升级条件，建议转认知分析生成证据链后复核。",
        },
        upgradeChecklist: [],
        affectedSymbols: ["688256"],
        factorCodes: ["F10", "F03"],
        evidenceCount: 2,
        reasons: ["7x24 快讯命中", "行情确认"],
        missingEvidence: ["仍需公告确认"],
        suggestedAction: "转认知分析",
      },
    ]);

    expect(signals).toEqual([
      {
        status: "pending_review",
        signalName: "订单/需求候选信号",
        signalNameEn: "Pending Review Candidate",
        templateCode: "F10/F03",
        severity: "high",
        description: "7x24 快讯命中；行情确认",
        affectedSymbols: ["688256"],
        suggestedAction: "转认知分析",
        confidence: 78,
        upgradeReadiness: 80,
        reviewReason: "候选已满足多数升级条件，建议转认知分析生成证据链后复核。",
        evidenceGap: ["仍需公告确认"],
      },
    ]);
  });

  it("does not promote candidates that still need evidence", () => {
    const signals = buildPendingReviewSignals([
      {
        title: "产业链热度候选信号",
        severity: "watch",
        confidence: 48,
        upgradeReadiness: 40,
        upgradeRecommendation: {
          level: "needs_evidence",
          label: "需要补证据",
          reason: "缺少硬证据。",
        },
        upgradeChecklist: [],
        affectedSymbols: ["688256"],
        factorCodes: ["F10"],
        evidenceCount: 1,
        reasons: ["产业链标签命中"],
        missingEvidence: ["缺少公司级命中"],
        suggestedAction: "继续观察",
      },
    ]);

    expect(signals).toEqual([]);
  });
});
