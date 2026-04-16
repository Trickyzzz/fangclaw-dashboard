import { describe, expect, it } from "vitest";
import { buildCandidateSignals } from "./discoveryCandidates";

describe("buildCandidateSignals", () => {
  const companies = [
    { symbol: "688256", name: "寒武纪", sector: "AI芯片", chainPosition: "上游", tags: ["AI芯片", "国产替代"] },
    { symbol: "300557", name: "理工光科", sector: "机器人/光纤传感", chainPosition: "中游", tags: ["机器人", "传感"] },
  ];

  it("creates a candidate when external material mentions a target company and factor keywords", () => {
    const candidates = buildCandidateSignals({
      companies,
      marketNews: [
        {
          id: "n1",
          title: "字节跳动加大国产AI芯片采购，寒武纪相关订单需求升温",
          summary: "国产替代和算力采购需求增强。",
          source: "wallstreetcn",
          sourceLabel: "华尔街见闻 7x24",
          publishedAt: "2026-04-16T07:00:00.000Z",
          url: "https://wallstreetcn.com/livenews",
          symbols: ["688256"],
        },
      ],
      announcements: [],
      secFilings: [],
      ifindQuotes: [],
    });

    expect(candidates[0]).toMatchObject({
      title: "订单/需求候选信号",
      affectedSymbols: ["688256"],
      factorCodes: ["F10", "F03"],
      evidenceCount: 1,
    });
    expect(candidates[0].confidence).toBeGreaterThanOrEqual(60);
  });

  it("keeps sector-level material as a lower confidence candidate", () => {
    const candidates = buildCandidateSignals({
      companies,
      marketNews: [
        {
          id: "n2",
          title: "算力产业链持续爆发，AI芯片板块活跃",
          summary: "市场关注国产算力方向。",
          source: "wallstreetcn",
          sourceLabel: "华尔街见闻 7x24",
          publishedAt: "2026-04-16T07:00:00.000Z",
          url: "https://wallstreetcn.com/livenews",
          symbols: [],
        },
      ],
      announcements: [],
      secFilings: [],
      ifindQuotes: [],
    });

    expect(candidates[0]).toMatchObject({
      title: "产业链热度候选信号",
      affectedSymbols: ["688256"],
      evidenceCount: 1,
    });
    expect(candidates[0].confidence).toBeLessThan(60);
  });

  it("adds quote confirmation when a matched company has strong intraday range", () => {
    const candidates = buildCandidateSignals({
      companies,
      marketNews: [
        {
          id: "n3",
          title: "寒武纪获得国产AI芯片订单关注",
          summary: "订单需求升温。",
          source: "wallstreetcn",
          sourceLabel: "华尔街见闻 7x24",
          publishedAt: "2026-04-16T07:00:00.000Z",
          url: "https://wallstreetcn.com/livenews",
          symbols: ["688256"],
        },
      ],
      announcements: [],
      secFilings: [],
      ifindQuotes: [
        { symbol: "688256.SH", time: null, open: 1280, high: 1315, low: 1270, latest: 1308.59 },
      ],
    });

    expect(candidates[0].evidenceCount).toBe(2);
    expect(candidates[0].reasons.join("\n")).toContain("行情确认");
    expect(candidates[0].upgradeChecklist).toEqual(expect.arrayContaining([
      { label: "实体命中", passed: true, detail: "已命中目标池公司或明确股票代码" },
      { label: "因子模板", passed: true, detail: "已匹配 F10/F03" },
      { label: "行情确认", passed: true, detail: "已有 iFinD 日内区间或价格异动确认" },
    ]));
    expect(candidates[0].upgradeReadiness).toBeGreaterThanOrEqual(70);
    expect(candidates[0].upgradeRecommendation).toEqual({
      level: "ready_for_review",
      label: "建议升级复核",
      reason: "候选已满足多数升级条件，建议转认知分析生成证据链后复核。",
    });
  });

  it("uses relationship profiles to connect ecosystem news to target companies", () => {
    const candidates = buildCandidateSignals({
      companies,
      marketNews: [
        {
          id: "n4",
          title: "字节跳动发布2026年AI算力采购计划，重点采购国产AI芯片",
          summary: "云厂商算力采购需求升温。",
          source: "wallstreetcn",
          sourceLabel: "华尔街见闻 7x24",
          publishedAt: "2026-04-16T07:00:00.000Z",
          url: "https://wallstreetcn.com/livenews",
          symbols: [],
        },
      ],
      announcements: [],
      secFilings: [],
      ifindQuotes: [],
    });

    expect(candidates[0]).toMatchObject({
      title: "订单/需求候选信号",
      affectedSymbols: ["688256"],
    });
    expect(candidates[0].reasons.join("\n")).toContain("关系图命中");
    expect(candidates[0].missingEvidence.join("\n")).toContain("关系链");
    expect(candidates[0].upgradeChecklist).toEqual(expect.arrayContaining([
      { label: "实体命中", passed: false, detail: "未直接点名目标池公司，仅通过关系图或产业链关联" },
      { label: "硬证据", passed: false, detail: "缺少公告、订单金额、业绩指引或监管披露验证" },
    ]));
    expect(candidates[0].upgradeRecommendation.level).toBe("needs_evidence");
  });
});
