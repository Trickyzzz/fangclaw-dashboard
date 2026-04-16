export type IngestionCandidate = {
  source: "sec" | "cninfo" | "wallstreetcn";
  externalId: string;
  symbol: string;
  companyName: string;
  title: string;
  publishedAt: string;
  url: string;
  rawText: string;
};

export type MixedModeDecision = "observe_only" | "full_apply";

export type IngestionStatus = {
  running: boolean;
  lastRunAt: string | null;
  scannedCount: number;
  dedupedCount: number;
  observedCount: number;
  appliedCount: number;
  lastError: string | null;
};
