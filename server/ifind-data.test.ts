import { beforeEach, describe, expect, it, vi } from "vitest";
import { getIfindRealtimeQuotes, resetIfindAccessTokenCache } from "./data-sources/ifind";

describe("iFinD HTTP API data source", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetIfindAccessTokenCache();
    process.env.IFIND_ENABLED = "true";
    process.env.IFIND_BASE_URL = "https://quantapi.51ifind.com/api/v1";
    process.env.IFIND_REFRESH_TOKEN = "test-refresh-token";
  });

  it("exchanges refresh_token for access_token and returns normalized realtime quotes", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({
          errorcode: 0,
          errmsg: "success",
          data: { access_token: "test-access-token" },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({
          errorcode: 0,
          errmsg: "success",
          tables: [
            {
              thscode: "300033.SZ",
              table: {
                time: ["2026-04-16 10:00:00"],
                open: [100.1],
                high: [102.2],
                low: [99.8],
                latest: [101.5],
              },
            },
          ],
        }),
      });

    vi.stubGlobal("fetch", fetchMock);

    const result = await getIfindRealtimeQuotes(["300033.SZ"]);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://quantapi.51ifind.com/api/v1/get_access_token",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          refresh_token: "test-refresh-token",
        }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://quantapi.51ifind.com/api/v1/real_time_quotation",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          access_token: "test-access-token",
        }),
        body: JSON.stringify({
          codes: "300033.SZ",
          indicators: "open,high,low,latest",
        }),
      })
    );
    expect(result).toEqual([
      {
        symbol: "300033.SZ",
        time: "2026-04-16 10:00:00",
        open: 100.1,
        high: 102.2,
        low: 99.8,
        latest: 101.5,
      },
    ]);
  });
});
