import { describe, expect, it } from "vitest";
import { buildCandidateAnalysisMessage } from "../client/src/lib/candidateAnalysis";

describe("buildCandidateAnalysisMessage", () => {
  it("formats candidate signal context for causal analysis", () => {
    const message = buildCandidateAnalysisMessage({
      title: "订单/需求候选信号",
      confidence: 72,
      upgradeReadiness: 60,
      affectedSymbols: ["688256"],
      factorCodes: ["F10", "F03"],
      evidenceCount: 2,
      reasons: [
        "7x24 快讯 命中：字节跳动发布2026年AI算力采购计划，重点采购国产AI芯片",
        "关系图命中：材料提到目标池公司的客户、供应商、竞品或海外锚点。",
      ],
      missingEvidence: ["需要目标池公司公告、订单金额或客户/供应商关系链验证，才能升级为高置信信号。"],
      suggestedAction: "可进入认知引擎手动深挖，确认是否升级为证据链。",
      upgradeChecklist: [
        { label: "实体命中", passed: false, detail: "未直接点名目标池公司，仅通过关系图或产业链关联" },
        { label: "因子模板", passed: true, detail: "已匹配 F10/F03" },
      ],
    });

    expect(message).toContain("候选信号：订单/需求候选信号");
    expect(message).toContain("影响标的：688256");
    expect(message).toContain("关联因子：F10 / F03");
    expect(message).toContain("升级准备度：60%");
    expect(message).toContain("实体命中：未通过");
    expect(message).toContain("请基于以上候选信号生成可解释投研分析");
  });
});
