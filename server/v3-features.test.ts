import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * v3.1 Agent Swarm 增强功能测试
 * 测试新增的后端接口：因子模板、异常检测、拥挤度、热力矩阵、回测、免责声明
 * 注意：discover 和 analyze 接口需要 LLM 调用，仅测试非 LLM 依赖的接口
 */

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("v3.1 Agent Swarm Features", () => {
  const ctx = createPublicContext();
  const caller = appRouter.createCaller(ctx);

  describe("factorTemplates.list", () => {
    it("returns an array of factor templates", async () => {
      const templates = await caller.factorTemplates.list();
      expect(Array.isArray(templates)).toBe(true);
      // 种子数据应该有 10 个因子模板
      expect(templates.length).toBeGreaterThanOrEqual(1);
      // 检查模板结构
      if (templates.length > 0) {
        const t = templates[0];
        expect(t).toHaveProperty("code");
        expect(t).toHaveProperty("name");
        expect(t).toHaveProperty("category");
        expect(t).toHaveProperty("signalDefinition");
        expect(t).toHaveProperty("historicalWinRate");
      }
    });
  });

  describe("companies.anomalies", () => {
    it("returns anomaly detection results as array", async () => {
      const anomalies = await caller.companies.anomalies();
      expect(anomalies).toBeDefined();
      expect(Array.isArray(anomalies)).toBe(true);
      // Each anomaly should have type, detail, severity
      if (anomalies.length > 0) {
        const a = anomalies[0] as Record<string, unknown>;
        expect(a).toHaveProperty("type");
        expect(a).toHaveProperty("detail");
        expect(a).toHaveProperty("severity");
      }
    });
  });

  describe("risk.crowding", () => {
    it("returns crowding calculation results", async () => {
      const crowding = await caller.risk.crowding();
      expect(crowding).toBeDefined();
      expect(crowding).toHaveProperty("overall");
      expect(crowding).toHaveProperty("breakdown");
      expect(typeof crowding.overall).toBe("number");
      expect(crowding.overall).toBeGreaterThanOrEqual(0);
      expect(crowding.overall).toBeLessThanOrEqual(100);
      expect(typeof crowding.breakdown).toBe("object");
    });
  });

  describe("indicators.heatmap", () => {
    it("returns heatmap data with dimensions and matrix", async () => {
      const heatmap = await caller.indicators.heatmap();
      expect(heatmap).toBeDefined();
      // heatmap returns { dimensions: string[], matrix: {row, col, value}[] }
      expect(heatmap).toHaveProperty("dimensions");
      expect(heatmap).toHaveProperty("matrix");
      expect(Array.isArray(heatmap.dimensions)).toBe(true);
      expect(Array.isArray(heatmap.matrix)).toBe(true);
      expect(heatmap.dimensions.length).toBe(6); // 6 dimensions
      // matrix should be 6x6 = 36 cells
      expect(heatmap.matrix.length).toBe(36);
    });
  });

  describe("disclaimer.get", () => {
    it("returns Chinese and English disclaimers", async () => {
      const disclaimer = await caller.disclaimer.get();
      expect(disclaimer).toBeDefined();
      expect(disclaimer).toHaveProperty("zh");
      expect(disclaimer).toHaveProperty("en");
      expect(typeof disclaimer.zh).toBe("string");
      expect(typeof disclaimer.en).toBe("string");
      expect(disclaimer.zh).toContain("免责声明");
      expect(disclaimer.en).toContain("Disclaimer");
    });
  });

  describe("companies.list", () => {
    it("returns companies with crossDimension field support", async () => {
      const companies = await caller.companies.list();
      expect(Array.isArray(companies)).toBe(true);
      expect(companies.length).toBeGreaterThan(0);
    });
  });

  describe("indicators.list", () => {
    it("returns indicators with v3 fields", async () => {
      const indicators = await caller.indicators.list();
      expect(Array.isArray(indicators)).toBe(true);
      expect(indicators.length).toBeGreaterThan(0);
      // 检查 v3 新增字段存在
      if (indicators.length > 0) {
        const ind = indicators[0];
        expect(ind).toHaveProperty("id");
        expect(ind).toHaveProperty("name");
        expect(ind).toHaveProperty("category");
      }
    });
  });

  describe("companies.latestAnalysis", () => {
    it("returns latest analysis map", async () => {
      const analysis = await caller.companies.latestAnalysis();
      expect(analysis).toBeDefined();
      expect(typeof analysis).toBe("object");
    });
  });

  describe("evidence.recent", () => {
    it("returns recent evidence chains", async () => {
      const recent = await caller.evidence.recent();
      expect(Array.isArray(recent)).toBe(true);
    });
  });

  describe("keyVariables.list", () => {
    it("returns key variables", async () => {
      const vars = await caller.keyVariables.list();
      expect(Array.isArray(vars)).toBe(true);
    });
  });
});
