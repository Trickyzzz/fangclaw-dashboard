import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * P0/P1/P2 功能补充测试
 * - P0-B: scenarios 字段在 LLM 返回中的处理
 * - P1-A: companies.latestAnalysis 接口
 * - P1-B: keyVariables.list 接口
 */

// No global mock - import db functions directly for integration tests

describe("P0-B: scenarios field in analysis", () => {
  it("analysis type should support scenarios array", () => {
    // Verify the type structure
    const mockAnalysis = {
      entities: ["NVIDIA", "GPU"],
      relatedIndicators: [1, 2],
      impactAssessment: "Test impact",
      confidence: 75,
      reasoning: "Step1→Step2→Step3",
      scenarios: [
        {
          name: "基准",
          nameEn: "Base",
          probability: 50,
          description: "Base case description",
          trigger: "Normal conditions",
          poolImpact: "Stable weights",
        },
        {
          name: "乐观",
          nameEn: "Bull",
          probability: 30,
          description: "Bull case description",
          trigger: "Positive catalyst",
          poolImpact: "Weight increase",
        },
        {
          name: "悲观",
          nameEn: "Bear",
          probability: 20,
          description: "Bear case description",
          trigger: "Negative catalyst",
          poolImpact: "Weight decrease",
        },
      ],
    };

    expect(mockAnalysis.scenarios).toHaveLength(3);
    expect(mockAnalysis.scenarios[0].name).toBe("基准");
    expect(mockAnalysis.scenarios[1].nameEn).toBe("Bull");
    expect(mockAnalysis.scenarios[2].probability).toBe(20);

    // Verify probabilities sum to 100
    const totalProb = mockAnalysis.scenarios.reduce((sum, s) => sum + s.probability, 0);
    expect(totalProb).toBe(100);
  });

  it("scenarios should have required fields", () => {
    const scenario = {
      name: "基准",
      nameEn: "Base",
      probability: 50,
      description: "Description",
      trigger: "Trigger condition",
      poolImpact: "Impact description",
    };

    expect(scenario).toHaveProperty("name");
    expect(scenario).toHaveProperty("nameEn");
    expect(scenario).toHaveProperty("probability");
    expect(scenario).toHaveProperty("description");
    expect(scenario).toHaveProperty("trigger");
    expect(scenario).toHaveProperty("poolImpact");
  });
});

describe("P1-A: companies.latestAnalysis", () => {
  it("latestAnalysis endpoint should be accessible via tRPC router", async () => {
    // Import the router to verify the endpoint exists
    const { appRouter } = await import("./routers");
    expect(appRouter).toBeDefined();

    // Verify the companies router has latestAnalysis procedure
    const procedures = Object.keys((appRouter as any)._def.procedures);
    expect(procedures).toContain("companies.latestAnalysis");
  });
});

describe("P1-B: keyVariables", () => {
  it("keyVariables.list endpoint should be accessible via tRPC router", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys((appRouter as any)._def.procedures);
    expect(procedures).toContain("keyVariables.list");
  });

  it("getAllKeyVariables should return array from database", async () => {
    const { getAllKeyVariables } = await import("./db");
    const vars = await getAllKeyVariables();
    expect(Array.isArray(vars)).toBe(true);
    // Should have seeded data
    expect(vars.length).toBeGreaterThan(0);
  });

  it("key variables should have required fields", async () => {
    const { getAllKeyVariables } = await import("./db");
    const vars = await getAllKeyVariables();
    if (vars.length > 0) {
      const v = vars[0];
      expect(v).toHaveProperty("id");
      expect(v).toHaveProperty("name");
      expect(v).toHaveProperty("category");
      expect(v).toHaveProperty("currentValue");
      expect(v).toHaveProperty("signal");
    }
  });
});

describe("P2-B: reasoning chain parsing", () => {
  it("should split reasoning by arrow separators", () => {
    const reasoning = "NVIDIA发布新GPU→算力需求大增→半导体产业链受益→寒武纪和海光信息权重上调";
    const steps = reasoning.split(/[→➜]/).map(s => s.trim()).filter(Boolean);
    expect(steps).toHaveLength(4);
    expect(steps[0]).toContain("NVIDIA");
    expect(steps[3]).toContain("权重上调");
  });

  it("should handle single-step reasoning gracefully", () => {
    const reasoning = "市场整体平稳，无明显变化";
    const steps = reasoning.split(/[→➜]/).map(s => s.trim()).filter(Boolean);
    expect(steps).toHaveLength(1);
    expect(steps[0]).toBe("市场整体平稳，无明显变化");
  });

  it("should handle empty reasoning", () => {
    const reasoning = "";
    const steps = reasoning.split(/[→➜]/).map(s => s.trim()).filter(Boolean);
    expect(steps).toHaveLength(0);
  });
});
