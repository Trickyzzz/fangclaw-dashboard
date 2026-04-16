import { describe, expect, it } from "vitest";
import { buildDataFeedLayerStatus } from "../client/src/lib/dataFeedLayers";

describe("buildDataFeedLayerStatus", () => {
  it("groups disclosure, news, and system states by evidence grade", () => {
    const layers = buildDataFeedLayerStatus({
      cninfoCount: 5,
      secCount: 2,
      marketNewsCount: 4,
      ifindCount: 3,
      cninfoFallback: false,
      secFallback: true,
      marketNewsFallback: false,
      ifindFallback: false,
      ingestionRunning: true,
      lastRunAt: "2026-04-16T10:00:00.000Z",
      cninfoLastUpdated: "2026-04-15",
      secLastUpdated: "2026-04-14",
      marketNewsLastUpdated: "2026-04-16T09:59:00.000Z",
    });

    expect(layers).toEqual([
      {
        layer: "official_disclosure",
        title: "官方披露",
        titleEn: "Official Disclosure",
        description: "硬证据来源，适合进入证据链",
        sources: [
          { name: "CNINFO", label: "A股公告", count: 5, status: "live", grade: "hard_evidence", lastUpdated: "2026-04-15" },
          { name: "SEC EDGAR", label: "海外监管披露", count: 2, status: "fallback", grade: "hard_evidence", lastUpdated: "2026-04-14" },
          { name: "IFIND", label: "官方金融数据", count: 3, status: "live", grade: "hard_evidence", lastUpdated: null },
        ],
      },
      {
        layer: "realtime_news",
        title: "实时快讯",
        titleEn: "Realtime News",
        description: "触发器来源，适合驱动自动分析",
        sources: [
          { name: "WALLSTREETCN", label: "7x24 财经快讯", count: 4, status: "live", grade: "trigger", lastUpdated: "2026-04-16T09:59:00.000Z" },
        ],
      },
      {
        layer: "system_status",
        title: "系统状态",
        titleEn: "System Status",
        description: "展示巡检状态和兜底情况",
        sources: [
          { name: "INGESTION", label: "自动巡检", count: 1, status: "live", grade: "system", lastUpdated: "2026-04-16T10:00:00.000Z" },
          { name: "FALLBACK", label: "兜底源", count: 1, status: "fallback", grade: "system", lastUpdated: null },
        ],
      },
    ]);
  });
});
