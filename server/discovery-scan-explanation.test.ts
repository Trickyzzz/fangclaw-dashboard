import { describe, expect, it } from "vitest";
import { buildDiscoveryScanExplanation } from "./discoveryScanExplanation";

describe("buildDiscoveryScanExplanation", () => {
  it("turns a zero-signal scan into an actionable negative report", () => {
    const report = buildDiscoveryScanExplanation({
      signalCount: 0,
      poolHealthAssessment: "LLM 已完成目标池扫描，当前未发现需要立即行动的高置信异常。",
      trendSummary: "LLM 深度扫描完成，但未返回明确的新增因子信号。",
      dataSources: {
        marketNewsCount: 5,
        announcementCount: 5,
        quoteCount: 3,
        secFilingCount: 5,
        sourceErrorCount: 0,
        hasFreshExternalData: true,
      },
    });

    expect(report.status).toBe("no_high_confidence_signal");
    expect(report.headline).toContain("未形成高置信新增信号");
    expect(report.reviewedMaterials).toEqual([
      { label: "7x24 快讯", count: 5, interpretation: "用于捕捉实时催化和情绪变化" },
      { label: "A股公告", count: 5, interpretation: "用于验证公司层面的硬证据" },
      { label: "iFinD 行情", count: 3, interpretation: "用于观察价格、日内区间和交易异动" },
      { label: "SEC 披露", count: 5, interpretation: "用于观察海外龙头和产业链锚点变化" },
    ]);
    expect(report.whyNoSignal[0]).toContain("没有形成");
    expect(report.closestTriggers.length).toBeGreaterThan(0);
    expect(report.nextSteps).toContain("等待新的公司公告、订单、业绩预告或政策细则后再次扫描。");
  });

  it("explains when source errors reduce confidence", () => {
    const report = buildDiscoveryScanExplanation({
      signalCount: 0,
      poolHealthAssessment: "暂无目标池健康度评估",
      trendSummary: "暂无趋势总结",
      dataSources: {
        marketNewsCount: 0,
        announcementCount: 0,
        quoteCount: 0,
        secFilingCount: 0,
        sourceErrorCount: 2,
        hasFreshExternalData: false,
      },
    });

    expect(report.whyNoSignal).toContain("本次外部数据源不足或存在异常，结论置信度会被主动压低。");
    expect(report.nextSteps).toContain("先修复异常数据源或补充手动材料，再进行深度扫描。");
  });
});
