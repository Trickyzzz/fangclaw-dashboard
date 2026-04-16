export type CandidateAnalysisInput = {
  title: string;
  confidence: number;
  upgradeReadiness?: number;
  affectedSymbols: string[];
  factorCodes: string[];
  evidenceCount: number;
  reasons: string[];
  missingEvidence: string[];
  suggestedAction: string;
  upgradeChecklist?: {
    label: string;
    passed: boolean;
    detail: string;
  }[];
};

function formatList(items: string[]) {
  return items.length > 0 ? items.join("；") : "暂无";
}

export function buildCandidateAnalysisMessage(candidate: CandidateAnalysisInput) {
  const checklist = (candidate.upgradeChecklist ?? [])
    .map(item => `- ${item.label}：${item.passed ? "通过" : "未通过"}，${item.detail}`)
    .join("\n");

  return [
    `候选信号：${candidate.title}`,
    `影响标的：${formatList(candidate.affectedSymbols)}`,
    `关联因子：${candidate.factorCodes.length > 0 ? candidate.factorCodes.join(" / ") : "暂无"}`,
    `候选置信度：${candidate.confidence}%`,
    `升级准备度：${typeof candidate.upgradeReadiness === "number" ? `${candidate.upgradeReadiness}%` : "未计算"}`,
    `证据数量：${candidate.evidenceCount}`,
    "",
    "候选理由：",
    ...candidate.reasons.map(reason => `- ${reason}`),
    "",
    "当前证据缺口：",
    ...candidate.missingEvidence.map(item => `- ${item}`),
    "",
    "升级检查：",
    checklist || "- 暂无升级检查项",
    "",
    `候选建议：${candidate.suggestedAction}`,
    "",
    "请基于以上候选信号生成可解释投研分析：判断它是否应升级为正式因子发现，说明因果链、影响标的、反对论点、证据缺口和下一步验证动作。若证据不足，请明确保持观察而不是强行调仓。",
  ].join("\n");
}
