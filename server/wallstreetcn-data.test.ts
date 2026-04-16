import { beforeEach, describe, expect, it, vi } from "vitest";
import { getRecentMarketNewsFromWallstreetcn } from "./data-sources/wallstreetcn";

describe("dataSources.marketNews", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("uses content text as the title when WallstreetCN live items omit title", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          items: [
            {
              id: 3089061,
              title: "",
              content_text: "沪深京三市成交额超2万亿，较上日此时缩量超900亿。",
              display_time: 1776320512,
              uri: "livenews/3089061",
            },
          ],
        },
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await getRecentMarketNewsFromWallstreetcn(3, "a-stock-channel");

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "3089061",
      title: "沪深京三市成交额超2万亿，较上日此时缩量超900亿。",
      summary: "沪深京三市成交额超2万亿，较上日此时缩量超900亿。",
      sourceLabel: "华尔街见闻 7x24",
    });
  });
});
