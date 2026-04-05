import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("dataSources.cninfoRecentAnnouncements", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns normalized CNINFO announcements for the semiconductor theme", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        announcements: [
          {
            secCode: "688368",
            secName: "晶丰明源",
            announcementTitle: "上海晶丰明源半导体股份有限公司第三届董事会第四十一次会议决议公告",
            announcementTime: 1775145600000,
            adjunctUrl: "finalpage/2026-04-03/1225076889.PDF",
            announcementId: "1225076889",
          },
          {
            secCode: "300046",
            secName: "台基股份",
            announcementTitle: "华泰联合证券有限责任公司关于湖北台基半导体股份有限公司使用暂时闲置募集资金进行现金管理的核查意见",
            announcementTime: 1775145600000,
            adjunctUrl: "finalpage/2026-04-03/1225077043.PDF",
            announcementId: "1225077043",
          },
        ],
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.dataSources.cninfoRecentAnnouncements({ limit: 5 });

    expect(result.length).toBe(2);
    expect(result[0]).toMatchObject({
      symbol: "688368",
      companyName: "晶丰明源",
      announcementId: "1225076889",
    });
    expect(result[0].url).toContain("cninfo.com.cn/new/disclosure/detail");
  });
});
