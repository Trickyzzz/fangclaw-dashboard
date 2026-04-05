const HIGH_VALUE_KEYWORDS = [
  "半导体",
  "芯片",
  "算力",
  "业绩",
  "订单",
  "中标",
  "回购",
  "增持",
  "减持",
  "募资",
  "并购",
  "重组",
  "董事会",
  "8-K",
  "10-K",
  "10-Q",
  "6-K",
];

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
