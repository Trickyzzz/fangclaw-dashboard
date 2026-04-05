import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * FangClaw 核心 API 测试
 * 测试公司池、指标、变更日志的查询接口
 */

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

describe("companies", () => {
  it("companies.list returns an array", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.companies.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("companies.list returns companies with required fields", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.companies.list();
    if (result.length > 0) {
      const company = result[0];
      expect(company).toHaveProperty("symbol");
      expect(company).toHaveProperty("name");
      expect(company).toHaveProperty("weight");
      expect(company).toHaveProperty("chainPosition");
      expect(typeof company.symbol).toBe("string");
      expect(typeof company.name).toBe("string");
      expect(typeof company.weight).toBe("number");
    }
  });

  it("companies.stats returns valid statistics", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const stats = await caller.companies.stats();
    expect(stats).toHaveProperty("total");
    expect(stats).toHaveProperty("avgWeight");
    expect(stats).toHaveProperty("upstream");
    expect(stats).toHaveProperty("midstream");
    expect(stats).toHaveProperty("downstream");
    expect(typeof stats.total).toBe("number");
    expect(typeof stats.avgWeight).toBe("number");
    expect(stats.total).toBeGreaterThanOrEqual(0);
  });

  it("companies.getBySymbol returns a company or null", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.companies.getBySymbol({ symbol: "688981" });
    if (result) {
      expect(result.symbol).toBe("688981");
      expect(result.name).toBe("中芯国际");
    }
  });
});

describe("indicators", () => {
  it("indicators.list returns an array", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.indicators.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("indicators.list returns indicators with required fields", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.indicators.list();
    if (result.length > 0) {
      const indicator = result[0];
      expect(indicator).toHaveProperty("id");
      expect(indicator).toHaveProperty("name");
      expect(indicator).toHaveProperty("category");
      expect(indicator).toHaveProperty("lastStatus");
    }
  });
});

describe("changeLogs", () => {
  it("changeLogs.list returns an array", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.changeLogs.list({ limit: 10 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("changeLogs.list respects limit parameter", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.changeLogs.list({ limit: 5 });
    expect(result.length).toBeLessThanOrEqual(5);
  });
});

describe("evidence", () => {
  it("evidence.recent returns an array", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.evidence.recent();
    expect(Array.isArray(result)).toBe(true);
  });

  it("evidence.get returns null for non-existent id", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.evidence.get({ evidenceId: "NON-EXISTENT-ID" });
    expect(result).toBeNull();
  });
});

describe("causal.analyze input validation", () => {
  it("rejects empty message", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.causal.analyze({ message: "" })
    ).rejects.toThrow();
  });

  it("rejects message shorter than 5 characters", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.causal.analyze({ message: "abc" })
    ).rejects.toThrow();
  });
});
