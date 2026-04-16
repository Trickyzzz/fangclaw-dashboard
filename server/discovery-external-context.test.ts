import { describe, expect, it } from "vitest";
import { buildDiscoveryExternalContext, toIfindCode } from "./discoveryExternalContext";

describe("discovery external context", () => {
  it("normalizes A-share symbols into iFinD quote codes", () => {
    expect(toIfindCode("300557")).toBe("300557.SZ");
    expect(toIfindCode("688256")).toBe("688256.SH");
    expect(toIfindCode("NVDA")).toBeNull();
  });

  it("compresses market news, announcements, filings, and quotes into prompt context", () => {
    const context = buildDiscoveryExternalContext({
      marketNews: [
        {
          id: "n1",
          title: "算力产业链持续爆发",
          summary: "创业板指涨超3%，算力概念股持续爆发。",
          source: "wallstreetcn",
          sourceLabel: "华尔街见闻 7x24",
          publishedAt: "2026-04-16T07:00:50.000Z",
          url: "https://wallstreetcn.com/livenews",
          symbols: ["300557"],
        },
      ],
      announcements: [
        {
          symbol: "300557",
          companyName: "理工光科",
          title: "关于签订重要合同的公告",
          publishedAt: "2026-04-16",
          announcementId: "a1",
          pdfUrl: "https://example.com/a1.pdf",
          url: "https://example.com/a1",
        },
      ],
      secFilings: [
        {
          symbol: "NVDA",
          companyName: "NVIDIA CORP",
          cik: "1045810",
          formType: "8-K",
          filedAt: "2026-04-15",
          description: "Current report",
          accessionNumber: "x1",
          url: "https://sec.example.com/x1",
        },
      ],
      ifindQuotes: [
        {
          symbol: "300557.SZ",
          time: null,
          open: 34.03,
          high: 35.16,
          low: 33.73,
          latest: 34.79,
        },
      ],
      sourceErrors: ["SEC: rate limited"],
    });

    expect(context.promptSection).toContain("外部数据源快照");
    expect(context.promptSection).toContain("算力产业链持续爆发");
    expect(context.promptSection).toContain("理工光科");
    expect(context.promptSection).toContain("300557.SZ");
    expect(context.promptSection).toContain("SEC: rate limited");
    expect(context.scanMeta).toMatchObject({
      marketNewsCount: 1,
      announcementCount: 1,
      secFilingCount: 1,
      quoteCount: 1,
      sourceErrorCount: 1,
      hasFreshExternalData: true,
    });
  });
});
