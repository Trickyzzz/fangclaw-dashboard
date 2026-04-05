import { getRecentCninfoAnnouncements } from "../data-sources/cninfo";
import { getRecentSecFilings } from "../data-sources/secEdgar";
import { executeCausalAnalysis } from "./autoAnalyze";
import { createInMemoryDedupeStore } from "./dedupeStore";
import { normalizeCninfoItem, normalizeSecItem } from "./normalizeExternalItem";
import { shouldAnalyzeCandidate } from "./relevance";
import type { IngestionCandidate, IngestionStatus } from "./types";

const dedupeStore = createInMemoryDedupeStore();
const status: IngestionStatus = {
  running: false,
  lastRunAt: null,
  scannedCount: 0,
  dedupedCount: 0,
  observedCount: 0,
  appliedCount: 0,
  lastError: null,
};

let timer: NodeJS.Timeout | null = null;

function toSourceType(candidate: IngestionCandidate) {
  return candidate.source === "sec" ? "sec_auto" : "cninfo_auto";
}

function buildMessage(candidate: IngestionCandidate) {
  return `[${candidate.source.toUpperCase()} ${candidate.publishedAt}] ${candidate.symbol} ${candidate.companyName}：${candidate.title}`;
}

export function getIngestionStatus() {
  return { ...status };
}

export async function runIngestionCycle() {
  if (status.running) {
    return getIngestionStatus();
  }

  status.running = true;
  status.lastError = null;

  let scannedCount = 0;
  let dedupedCount = 0;
  let observedCount = 0;
  let appliedCount = 0;

  try {
    const [secItems, cninfoItems] = await Promise.all([
      getRecentSecFilings(6),
      getRecentCninfoAnnouncements(6),
    ]);

    const candidates = [
      ...secItems.map(normalizeSecItem),
      ...cninfoItems.map(normalizeCninfoItem),
    ];

    scannedCount = candidates.length;

    for (const candidate of candidates) {
      const dedupeKey = `${candidate.source}:${candidate.externalId}`;
      if (dedupeStore.has(dedupeKey)) {
        dedupedCount += 1;
        continue;
      }

      dedupeStore.add(dedupeKey);

      if (!shouldAnalyzeCandidate(candidate)) {
        continue;
      }

      const result = await executeCausalAnalysis({
        message: buildMessage(candidate),
        sourceType: toSourceType(candidate),
        sourceUrl: candidate.url,
        decisionMode: "auto",
      });

      if (result.decision === "full_apply") {
        appliedCount += 1;
      } else {
        observedCount += 1;
      }
    }

    status.scannedCount = scannedCount;
    status.dedupedCount = dedupedCount;
    status.observedCount = observedCount;
    status.appliedCount = appliedCount;
    status.lastRunAt = new Date().toISOString();
  } catch (error) {
    status.lastError = error instanceof Error ? error.message : String(error);
    status.lastRunAt = new Date().toISOString();
    console.error("[Ingestion] Cycle failed:", error);
  } finally {
    status.running = false;
  }

  return getIngestionStatus();
}

export function startIngestionPoller(intervalMs = 5 * 60 * 1000) {
  if (timer) {
    return;
  }

  void runIngestionCycle();
  timer = setInterval(() => {
    void runIngestionCycle();
  }, intervalMs);
  timer.unref?.();
}
