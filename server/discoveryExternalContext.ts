import type { IfindRealtimeQuote } from "./data-sources/ifind";
import type { MarketNewsItem } from "./data-sources/wallstreetcn";
import type { SecFilingItem } from "./data-sources/secEdgar";

type CninfoAnnouncementItem = {
  symbol: string;
  companyName: string;
  title: string;
  publishedAt: string;
  announcementId: string;
  pdfUrl: string;
  url: string;
};

type DiscoveryExternalContextInput = {
  marketNews: MarketNewsItem[];
  announcements: CninfoAnnouncementItem[];
  secFilings: SecFilingItem[];
  ifindQuotes: IfindRealtimeQuote[];
  sourceErrors?: string[];
};

function compactText(value: unknown, maxLength = 120) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

export function toIfindCode(symbol: string) {
  const normalized = symbol.trim().toUpperCase();
  if (!/^\d{6}$/.test(normalized)) return null;
  return `${normalized}.${normalized.startsWith("6") ? "SH" : "SZ"}`;
}

export function buildDiscoveryExternalContext(input: DiscoveryExternalContextInput) {
  const marketNews = input.marketNews.slice(0, 5);
  const announcements = input.announcements.slice(0, 5);
  const secFilings = input.secFilings.slice(0, 5);
  const ifindQuotes = input.ifindQuotes.slice(0, 8);
  const sourceErrors = (input.sourceErrors ?? []).filter(Boolean).slice(0, 5);

  const sections = [
    "外部数据源快照（供因子发现使用，优先关注与目标池、算力/半导体链相关的新增材料）：",
    marketNews.length > 0
      ? [
          `7x24 财经快讯（${marketNews.length}条）：`,
          ...marketNews.map((item, index) =>
            `${index + 1}. [${item.sourceLabel}] ${compactText(item.title, 100)}${item.symbols.length > 0 ? ` | 命中 ${item.symbols.join("/")}` : ""}`
          ),
        ].join("\n")
      : "7x24 财经快讯：暂无可用新材料",
    announcements.length > 0
      ? [
          `A股公告 / CNINFO（${announcements.length}条）：`,
          ...announcements.map((item, index) =>
            `${index + 1}. ${item.symbol} ${item.companyName}：${compactText(item.title, 100)}（${item.publishedAt}）`
          ),
        ].join("\n")
      : "A股公告 / CNINFO：暂无可用新材料",
    ifindQuotes.length > 0
      ? [
          `iFinD 实时行情（${ifindQuotes.length}条）：`,
          ...ifindQuotes.map((item, index) =>
            `${index + 1}. ${item.symbol} 开${item.open ?? "-"} 高${item.high ?? "-"} 低${item.low ?? "-"} 现${item.latest ?? "-"}`
          ),
        ].join("\n")
      : "iFinD 实时行情：暂无可用新材料",
    secFilings.length > 0
      ? [
          `海外监管披露 / SEC（${secFilings.length}条）：`,
          ...secFilings.map((item, index) =>
            `${index + 1}. ${item.symbol} ${item.companyName} ${item.formType}：${compactText(item.description, 100)}（${item.filedAt}）`
          ),
        ].join("\n")
      : "海外监管披露 / SEC：暂无可用新材料",
    sourceErrors.length > 0
      ? [
          `数据源异常（${sourceErrors.length}项）：`,
          ...sourceErrors.map((error, index) => `${index + 1}. ${compactText(error, 140)}`),
        ].join("\n")
      : "数据源异常：无",
  ];

  return {
    promptSection: sections.join("\n\n"),
    scanMeta: {
      marketNewsCount: marketNews.length,
      announcementCount: announcements.length,
      secFilingCount: secFilings.length,
      quoteCount: ifindQuotes.length,
      sourceErrorCount: sourceErrors.length,
      hasFreshExternalData:
        marketNews.length + announcements.length + secFilings.length + ifindQuotes.length > 0,
    },
  };
}
