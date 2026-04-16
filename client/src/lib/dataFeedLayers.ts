export type DataFeedSourceStatus = "live" | "fallback" | "empty";
export type DataFeedEvidenceGrade = "hard_evidence" | "trigger" | "system";

export type DataFeedLayerStatus = {
  layer: "official_disclosure" | "realtime_news" | "system_status";
  title: string;
  titleEn: string;
  description: string;
  sources: {
    name: string;
    label: string;
    count: number;
    status: DataFeedSourceStatus;
    grade: DataFeedEvidenceGrade;
    lastUpdated: string | null;
  }[];
};

type BuildDataFeedLayerStatusInput = {
  cninfoCount: number;
  secCount: number;
  marketNewsCount: number;
  ifindCount?: number;
  cninfoFallback: boolean;
  secFallback: boolean;
  marketNewsFallback: boolean;
  ifindFallback?: boolean;
  ingestionRunning: boolean;
  lastRunAt: string | null;
  cninfoLastUpdated?: string | null;
  secLastUpdated?: string | null;
  marketNewsLastUpdated?: string | null;
};

function sourceStatus(count: number, fallback: boolean): DataFeedSourceStatus {
  if (fallback) return "fallback";
  return count > 0 ? "live" : "empty";
}

export function buildDataFeedLayerStatus(input: BuildDataFeedLayerStatusInput): DataFeedLayerStatus[] {
  const fallbackCount = [input.cninfoFallback, input.secFallback, input.marketNewsFallback]
    .filter(Boolean).length;

  return [
    {
      layer: "official_disclosure",
      title: "官方披露",
      titleEn: "Official Disclosure",
      description: "硬证据来源，适合进入证据链",
      sources: [
        {
          name: "CNINFO",
          label: "A股公告",
          count: input.cninfoCount,
          status: sourceStatus(input.cninfoCount, input.cninfoFallback),
          grade: "hard_evidence",
          lastUpdated: input.cninfoLastUpdated ?? null,
        },
        {
          name: "SEC EDGAR",
          label: "海外监管披露",
          count: input.secCount,
          status: sourceStatus(input.secCount, input.secFallback),
          grade: "hard_evidence",
          lastUpdated: input.secLastUpdated ?? null,
        },
        {
          name: "IFIND",
          label: "官方金融数据",
          count: input.ifindCount ?? 0,
          status: sourceStatus(input.ifindCount ?? 0, input.ifindFallback ?? false),
          grade: "hard_evidence",
          lastUpdated: null,
        },
      ],
    },
    {
      layer: "realtime_news",
      title: "实时快讯",
      titleEn: "Realtime News",
      description: "触发器来源，适合驱动自动分析",
      sources: [
        {
          name: "WALLSTREETCN",
          label: "7x24 财经快讯",
          count: input.marketNewsCount,
          status: sourceStatus(input.marketNewsCount, input.marketNewsFallback),
          grade: "trigger",
          lastUpdated: input.marketNewsLastUpdated ?? null,
        },
      ],
    },
    {
      layer: "system_status",
      title: "系统状态",
      titleEn: "System Status",
      description: "展示巡检状态和兜底情况",
      sources: [
        {
          name: "INGESTION",
          label: "自动巡检",
          count: input.ingestionRunning || input.lastRunAt ? 1 : 0,
          status: input.ingestionRunning || input.lastRunAt ? "live" : "empty",
          grade: "system",
          lastUpdated: input.lastRunAt,
        },
        {
          name: "FALLBACK",
          label: "兜底源",
          count: fallbackCount,
          status: fallbackCount > 0 ? "fallback" : "live",
          grade: "system",
          lastUpdated: null,
        },
      ],
    },
  ];
}
