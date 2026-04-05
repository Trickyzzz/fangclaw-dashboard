import type { CninfoAnnouncementItem } from "../data-sources/cninfo";
import type { SecFilingItem } from "../data-sources/secEdgar";
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
