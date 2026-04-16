export type DiscoveryDataSourceMeta = {
  marketNewsCount: number;
  announcementCount: number;
  quoteCount: number;
  secFilingCount: number;
  sourceErrorCount: number;
  hasFreshExternalData: boolean;
};

export type DiscoveryScanExplanation = {
  status: "has_signal" | "no_high_confidence_signal";
  headline: string;
  reviewedMaterials: {
    label: string;
    count: number;
    interpretation: string;
  }[];
  whyNoSignal: string[];
  closestTriggers: string[];
  nextSteps: string[];
};

type BuildDiscoveryScanExplanationInput = {
  signalCount: number;
  poolHealthAssessment: string;
  trendSummary: string;
  dataSources: DiscoveryDataSourceMeta;
};

export function buildDiscoveryScanExplanation(input: BuildDiscoveryScanExplanationInput): DiscoveryScanExplanation {
  const reviewedMaterials = [
    { label: "7x24 快讯", count: input.dataSources.marketNewsCount, interpretation: "用于捕捉实时催化和情绪变化" },
    { label: "A股公告", count: input.dataSources.announcementCount, interpretation: "用于验证公司层面的硬证据" },
    { label: "iFinD 行情", count: input.dataSources.quoteCount, interpretation: "用于观察价格、日内区间和交易异动" },
    { label: "SEC 披露", count: input.dataSources.secFilingCount, interpretation: "用于观察海外龙头和产业链锚点变化" },
  ];

  if (input.signalCount > 0) {
    return {
      status: "has_signal",
      headline: `本次扫描形成 ${input.signalCount} 个可展开的因子信号。`,
      reviewedMaterials,
      whyNoSignal: [],
      closestTriggers: [],
      nextSteps: ["打开信号详情，核对反对论点、受影响标的和证据链后再做决策。"],
    };
  }

  const whyNoSignal = [
    "外部材料和目标池状态之间没有形成足够明确的同向共振。",
    "当前材料更偏市场描述或常规披露，尚不足以支撑可执行的新增因子结论。",
    input.trendSummary && input.trendSummary !== "暂无趋势总结"
      ? `LLM 趋势判断：${input.trendSummary}`
      : "LLM 未返回明确趋势增量，因此系统没有强行生成信号。",
  ];

  if (input.poolHealthAssessment && input.poolHealthAssessment !== "暂无目标池健康度评估") {
    whyNoSignal.push(`目标池健康度：${input.poolHealthAssessment}`);
  }

  if (!input.dataSources.hasFreshExternalData || input.dataSources.sourceErrorCount > 0) {
    whyNoSignal.push("本次外部数据源不足或存在异常，结论置信度会被主动压低。");
  }

  const closestTriggers = [
    input.dataSources.marketNewsCount > 0
      ? "7x24 快讯可作为候选触发器，但需要公司级证据或行情异动继续确认。"
      : "缺少实时快讯材料，短线催化判断不足。",
    input.dataSources.announcementCount > 0
      ? "A股公告可作为硬证据入口，但本次没有被 LLM 判定为足以改变目标池判断。"
      : "缺少公司公告，难以形成硬证据链。",
    input.dataSources.quoteCount > 0
      ? "iFinD 行情已纳入扫描，但当前价格区间未被判定为独立异常信号。"
      : "缺少实时行情，无法验证价格和交易层面的异动。",
  ];

  const nextSteps = [
    "等待新的公司公告、订单、业绩预告或政策细则后再次扫描。",
    "如果你认为某条快讯很重要，可以复制到认知引擎手动分析，强制生成证据链。",
    "持续观察目标池中高权重公司，优先关注公告、行情和快讯同时出现的共振。",
  ];

  if (!input.dataSources.hasFreshExternalData || input.dataSources.sourceErrorCount > 0) {
    nextSteps.unshift("先修复异常数据源或补充手动材料，再进行深度扫描。");
  }

  return {
    status: "no_high_confidence_signal",
    headline: "本次扫描未形成高置信新增信号，但已完成外部材料和目标池的交叉核对。",
    reviewedMaterials,
    whyNoSignal,
    closestTriggers,
    nextSteps,
  };
}
