import type { IfindRealtimeQuote } from "./data-sources/ifind";
import type { MarketNewsItem } from "./data-sources/wallstreetcn";
import type { SecFilingItem } from "./data-sources/secEdgar";
import { normalizeEquitySymbol } from "../client/src/lib/symbolDisplay";
import { ecosystemRelationTokensFor, relationTokensFor } from "./companyRelationProfiles";

type CandidateCompany = {
  symbol: string;
  name: string;
  sector?: string | null;
  chainPosition?: string | null;
  tags?: string[] | null;
};

type CninfoAnnouncementItem = {
  symbol: string;
  companyName: string;
  title: string;
  publishedAt: string;
  announcementId: string;
  pdfUrl: string;
  url: string;
};

type BuildCandidateSignalsInput = {
  companies: CandidateCompany[];
  marketNews: MarketNewsItem[];
  announcements: CninfoAnnouncementItem[];
  secFilings: SecFilingItem[];
  ifindQuotes: IfindRealtimeQuote[];
};

export type CandidateSignal = {
  title: string;
  severity: "watch" | "candidate" | "near_trigger";
  confidence: number;
  upgradeReadiness: number;
  upgradeRecommendation: {
    level: "ready_for_review" | "needs_evidence" | "watch_only";
    label: string;
    reason: string;
  };
  upgradeChecklist: {
    label: string;
    passed: boolean;
    detail: string;
  }[];
  affectedSymbols: string[];
  factorCodes: string[];
  evidenceCount: number;
  reasons: string[];
  missingEvidence: string[];
  suggestedAction: string;
};

const ORDER_KEYWORDS = ["订单", "采购", "合同", "中标", "招标", "供货", "需求", "出货", "交付"];
const POLICY_KEYWORDS = ["政策", "补贴", "国产替代", "自主可控", "制裁", "出口管制", "大基金"];
const INDUSTRY_HEAT_KEYWORDS = ["算力", "AI芯片", "半导体", "服务器", "机器人", "光刻机", "产业链", "板块活跃", "持续爆发"];

function compact(value: unknown, maxLength = 90) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function includesAny(text: string, keywords: string[]) {
  return keywords.some(keyword => text.includes(keyword));
}

function companyTokens(company: CandidateCompany) {
  return [
    company.symbol,
    company.name,
  ].filter(Boolean).map(String);
}

function sectorTokens(company: CandidateCompany) {
  return [
    company.sector ?? "",
    ...(company.tags ?? []),
  ].filter(Boolean).map(String);
}

function relationTokens(company: CandidateCompany) {
  return relationTokensFor(company.symbol);
}

function ecosystemTokens(company: CandidateCompany) {
  return ecosystemRelationTokensFor(company.symbol);
}

function matchCompanies(text: string, companies: CandidateCompany[]) {
  const upper = text.toUpperCase();
  return companies.filter(company =>
    companyTokens(company).some(token => upper.includes(token.toUpperCase()))
  );
}

function quoteSymbolMatches(quoteSymbol: string, companySymbol: string) {
  return normalizeEquitySymbol(quoteSymbol) === normalizeEquitySymbol(companySymbol);
}

function quoteRangePct(quote: IfindRealtimeQuote) {
  if (!quote.low || quote.low <= 0 || !quote.high) return 0;
  return ((quote.high - quote.low) / quote.low) * 100;
}

function factorCodesFor(text: string) {
  const codes = new Set<string>();
  if (includesAny(text, ORDER_KEYWORDS)) {
    codes.add("F10");
    codes.add("F03");
    return Array.from(codes);
  }
  if (includesAny(text, POLICY_KEYWORDS)) {
    codes.add("F03");
    codes.add("F07");
    return Array.from(codes);
  }
  if (includesAny(text, INDUSTRY_HEAT_KEYWORDS)) {
    codes.add("F10");
    codes.add("F02");
  }
  return Array.from(codes);
}

function titleFor(text: string, directCompanyHit: boolean) {
  if (includesAny(text, ORDER_KEYWORDS)) return "订单/需求候选信号";
  if (includesAny(text, POLICY_KEYWORDS)) return "政策催化候选信号";
  if (!directCompanyHit && includesAny(text, INDUSTRY_HEAT_KEYWORDS)) return "产业链热度候选信号";
  return "外部材料候选信号";
}

function sourceIsHardEvidence(sourceLabel: string) {
  return sourceLabel.includes("公告") || sourceLabel.includes("SEC");
}

function buildUpgradeChecklist(input: {
  directCompanyHit: boolean;
  factorCodes: string[];
  hasQuoteConfirmation: boolean;
  hardEvidence: boolean;
  evidenceCount: number;
}) {
  return [
    {
      label: "实体命中",
      passed: input.directCompanyHit,
      detail: input.directCompanyHit
        ? "已命中目标池公司或明确股票代码"
        : "未直接点名目标池公司，仅通过关系图或产业链关联",
    },
    {
      label: "因子模板",
      passed: input.factorCodes.length > 0,
      detail: input.factorCodes.length > 0
        ? `已匹配 ${input.factorCodes.join("/")}`
        : "尚未匹配明确因子模板",
    },
    {
      label: "行情确认",
      passed: input.hasQuoteConfirmation,
      detail: input.hasQuoteConfirmation
        ? "已有 iFinD 日内区间或价格异动确认"
        : "缺少价格、成交或日内区间确认",
    },
    {
      label: "硬证据",
      passed: input.hardEvidence,
      detail: input.hardEvidence
        ? "已来自公告、监管披露或同等级硬证据"
        : "缺少公告、订单金额、业绩指引或监管披露验证",
    },
    {
      label: "多源共振",
      passed: input.evidenceCount >= 2,
      detail: input.evidenceCount >= 2
        ? "已有至少两类证据互相确认"
        : "仍是单源材料，需要更多来源验证",
    },
  ];
}

function upgradeReadiness(checklist: { passed: boolean }[]) {
  return Math.round((checklist.filter(item => item.passed).length / checklist.length) * 100);
}

function upgradeRecommendation(readiness: number, checklist: { label: string; passed: boolean }[], relationHit: boolean) {
  const hardEvidencePassed = checklist.find(item => item.label === "硬证据")?.passed ?? false;
  const entityPassed = checklist.find(item => item.label === "实体命中")?.passed ?? false;
  if (readiness >= 80 || (readiness >= 60 && entityPassed && hardEvidencePassed)) {
    return {
      level: "ready_for_review" as const,
      label: "建议升级复核",
      reason: "候选已满足多数升级条件，建议转认知分析生成证据链后复核。",
    };
  }
  if (readiness >= 40 || relationHit) {
    return {
      level: "needs_evidence" as const,
      label: "需要补证据",
      reason: "候选已有方向线索，但缺少直接实体、硬证据、行情确认或多源共振。",
    };
  }
  return {
    level: "watch_only" as const,
    label: "仅观察",
    reason: "候选目前仍偏弱，建议继续等待更明确的外部材料。",
  };
}

function makeCandidateFromMaterial(
  text: string,
  sourceLabel: string,
  companies: CandidateCompany[],
  ifindQuotes: IfindRealtimeQuote[],
): CandidateSignal | null {
  const directMatches = matchCompanies(text, companies);
  const sectorMatches = directMatches.length > 0
    ? []
    : companies.filter(company => sectorTokens(company).some(token => text.toUpperCase().includes(token.toUpperCase())));
  const relationMatches = directMatches.length > 0 || sectorMatches.length > 0
    ? []
    : companies.filter(company => relationTokens(company).some(token => text.toUpperCase().includes(token.toUpperCase())));
  const matches = directMatches.length > 0 ? directMatches : sectorMatches.length > 0 ? sectorMatches : relationMatches;
  if (matches.length === 0 || !includesAny(text, [...ORDER_KEYWORDS, ...POLICY_KEYWORDS, ...INDUSTRY_HEAT_KEYWORDS])) {
    return null;
  }

  const matchedSymbols = Array.from(new Set(matches.map(company => company.symbol))).slice(0, 4);
  const quoteConfirmations = ifindQuotes.filter(quote =>
    matchedSymbols.some(symbol => quoteSymbolMatches(quote.symbol, symbol)) && quoteRangePct(quote) >= 2
  );
  const directCompanyHit = directMatches.length > 0;
  const relationHit = !directCompanyHit && matches.some(company =>
    ecosystemTokens(company).some(token => text.toUpperCase().includes(token.toUpperCase()))
  );
  const factorCodes = factorCodesFor(text);
  const evidenceCount = 1 + quoteConfirmations.length;
  const upgradeChecklist = buildUpgradeChecklist({
    directCompanyHit,
    factorCodes,
    hasQuoteConfirmation: quoteConfirmations.length > 0,
    hardEvidence: sourceIsHardEvidence(sourceLabel),
    evidenceCount,
  });
  const confidence = Math.min(
    88,
    38 + (directCompanyHit ? 22 : relationHit ? 14 : 8) + (factorCodes.length * 5) + (quoteConfirmations.length * 10)
  );
  const readiness = upgradeReadiness(upgradeChecklist);

  return {
    title: titleFor(text, directCompanyHit),
    severity: confidence >= 70 ? "near_trigger" : confidence >= 55 ? "candidate" : "watch",
    confidence,
    upgradeReadiness: readiness,
    upgradeRecommendation: upgradeRecommendation(readiness, upgradeChecklist, relationHit),
    upgradeChecklist,
    affectedSymbols: matchedSymbols,
    factorCodes,
    evidenceCount,
    reasons: [
      `${sourceLabel} 命中：${compact(text)}`,
      directCompanyHit
        ? "材料直接命中目标池公司或股票代码。"
        : relationHit
          ? "关系图命中：材料提到目标池公司的客户、供应商、竞品或海外锚点。"
          : "材料命中目标池相关产业链/标签，但未直接点名公司。",
      ...quoteConfirmations.map(quote => `行情确认：${quote.symbol} 日内高低区间约 ${quoteRangePct(quote).toFixed(1)}%。`),
    ],
    missingEvidence: directCompanyHit
      ? ["仍需公告、订单金额、客户名称或业绩指引作为硬证据。"]
      : relationHit
        ? ["需要目标池公司公告、订单金额或客户/供应商关系链验证，才能升级为高置信信号。"]
        : ["缺少公司级命中，需要目标池公司公告或明确客户/供应商关系验证。"],
    suggestedAction: directCompanyHit
      ? "可进入认知引擎手动深挖，确认是否升级为证据链。"
      : "继续观察是否出现目标池公司公告、行情异动或同主题多源共振。",
  };
}

export function buildCandidateSignals(input: BuildCandidateSignalsInput): CandidateSignal[] {
  const materials = [
    ...input.marketNews.map(item => ({
      sourceLabel: "7x24 快讯",
      text: `${item.title} ${item.summary} ${item.symbols.join(" ")}`,
    })),
    ...input.announcements.map(item => ({
      sourceLabel: "A股公告",
      text: `${item.symbol} ${item.companyName} ${item.title}`,
    })),
    ...input.secFilings.map(item => ({
      sourceLabel: "SEC 披露",
      text: `${item.symbol} ${item.companyName} ${item.formType} ${item.description}`,
    })),
  ];

  const candidates = materials
    .map(material => makeCandidateFromMaterial(material.text, material.sourceLabel, input.companies, input.ifindQuotes))
    .filter((item): item is CandidateSignal => Boolean(item))
    .sort((a, b) => b.confidence - a.confidence);

  return candidates.slice(0, 5);
}
