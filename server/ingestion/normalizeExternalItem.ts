import type { CninfoAnnouncementItem } from "../data-sources/cninfo";
import type { SecFilingItem } from "../data-sources/secEdgar";
import type { MarketNewsItem } from "../data-sources/wallstreetcn";
import type { IngestionCandidate } from "./types";

export function normalizeSecItem(item: SecFilingItem): IngestionCandidate {
  return {
    source: "sec",
    externalId: item.accessionNumber,
    symbol: item.symbol,
    companyName: item.companyName,
    title: item.description,
    publishedAt: item.filedAt,
    url: item.url,
    rawText: `${item.symbol} ${item.companyName} ${item.formType} ${item.description}`,
  };
}

export function normalizeCninfoItem(item: CninfoAnnouncementItem): IngestionCandidate {
  return {
    source: "cninfo",
    externalId: item.announcementId,
    symbol: item.symbol,
    companyName: item.companyName,
    title: item.title,
    publishedAt: item.publishedAt,
    url: item.pdfUrl,
    rawText: `${item.symbol} ${item.companyName} ${item.title}`,
  };
}

export function normalizeWallstreetcnItem(item: MarketNewsItem): IngestionCandidate {
  const primarySymbol = item.symbols[0] ?? "MARKET";
  return {
    source: "wallstreetcn",
    externalId: item.id,
    symbol: primarySymbol,
    companyName: item.symbols.length > 0 ? item.symbols.join("/") : "市场快讯",
    title: item.title,
    publishedAt: item.publishedAt,
    url: item.url,
    rawText: `${item.title} ${item.summary} ${item.symbols.join(" ")}`.trim(),
  };
}
