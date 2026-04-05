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

describe("dataSources.secRecentFilings", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns normalized SEC filings for tracked US symbols", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          0: { ticker: "NVDA", cik_str: 1045810, title: "NVIDIA CORP" },
          1: { ticker: "TSM", cik_str: 1046179, title: "TAIWAN SEMICONDUCTOR MANUFACTURING CO LTD" },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          filings: {
            recent: {
              accessionNumber: ["0001045810-25-000123"],
              filingDate: ["2026-04-01"],
              form: ["8-K"],
              primaryDocDescription: ["Current report"],
              primaryDocument: ["nvda-20260401x8k.htm"],
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          filings: {
            recent: {
              accessionNumber: ["0001046179-25-000456"],
              filingDate: ["2026-04-02"],
              form: ["6-K"],
              primaryDocDescription: ["Report of foreign issuer"],
              primaryDocument: ["tsm-20260402x6k.htm"],
            },
          },
        }),
      });

    vi.stubGlobal("fetch", fetchMock);

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.dataSources.secRecentFilings({ limit: 5 });

    expect(result.length).toBe(2);
    expect(result[0]).toMatchObject({
      symbol: "TSM",
      companyName: "TAIWAN SEMICONDUCTOR MANUFACTURING CO LTD",
      formType: "6-K",
      description: "Report of foreign issuer",
    });
    expect(result[0].url).toContain("sec.gov/Archives");
  });
});
