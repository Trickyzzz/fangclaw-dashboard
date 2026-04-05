import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * FangClaw 因果分析引擎集成测试
 * Mock LLM 调用，验证完整因果链路：
 * 消息输入 → AI 分析 → 公司池权重更新 → 证据链生成 → 变更日志写入
 */

// Mock LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    id: "test-id",
    created: Date.now(),
    model: "test-model",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: JSON.stringify({
            summary: "NVIDIA发布新一代GPU，利好AI算力产业链",
            entities: ["NVIDIA", "B300", "AI芯片", "GPU"],
            relatedIndicators: [18],
            impacts: [
              {
                symbol: "688256",
                name: "寒武纪",
                weightDelta: 1,
                direction: "up",
                reason: "NVIDIA新品发布带动国产AI芯片关注度提升",
              },
              {
                symbol: "688041",
                name: "海光信息",
                weightDelta: 1,
                direction: "up",
                reason: "算力需求提升利好国产CPU/DCU厂商",
              },
            ],
            impactAssessment:
              "NVIDIA新GPU发布将推动全球AI算力需求进一步增长，国产替代链受益。",
            confidence: 75,
            reasoning:
              "NVIDIA B300性能大幅提升 → 下游CSP加速采购 → 算力需求传导至国产替代链 → 寒武纪、海光信息等受益",
            verificationQuestions: [
              "向半导体设备供应商确认：近期是否收到与AI芯片产线扩产相关的设备订单询价？",
              "向云厂商采购部门了解：2026年下半年AI服务器采购计划是否有上调？",
              "向封测厂商确认：HBM封装产能利用率是否已接近满载？",
            ],
            counterArgument: "NVIDIA新品发布可能导致旧款产品降价，压缩国产替代的价格空间",
            macroRegime: "expansion",
            nonObviousInsight: "NVIDIA新GPU发布可能加速光模块升级需求，间接利好华工科技等光通信厂商",
            dimensionScores: {
              fundamental: { score: 7, direction: "up", brief: "算力需求增长提升盈利预期" },
              technical: { score: 5, direction: "neutral", brief: "技术面影响待观察" },
              flow: { score: 6, direction: "up", brief: "北向资金持续流入算力板块" },
              catalyst: { score: 9, direction: "up", brief: "新品发布是强催化事件" },
              sentiment: { score: 8, direction: "up", brief: "市场情绪积极" },
              alternative: { score: 4, direction: "neutral", brief: "替代数据暂无明显信号" }
            },
            scenarios: [
              { name: "基准情景", nameEn: "Base", probability: 55, description: "算力需求稳步增长", trigger: "下游采购计划确认", poolImpact: "目标池整体权重上调" },
              { name: "乐观情景", nameEn: "Bull", probability: 30, description: "算力需求爆发式增长", trigger: "多家CSP加大采购", poolImpact: "全链条受益" },
              { name: "悲观情景", nameEn: "Bear", probability: 15, description: "出口管制加剧", trigger: "新一轮制裁落地", poolImpact: "国产替代链承压" }
            ],
          }),
        },
        finish_reason: "stop",
      },
    ],
    usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 },
  }),
}));

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

describe("causal.analyze success path", () => {
  it("returns complete analysis result with evidence chain", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.causal.analyze({
      message:
        "NVIDIA发布新一代B300 GPU，AI推理性能较上代提升3倍，预计2026年Q3量产",
      sourceType: "manual",
    });

    // Verify result structure
    expect(result).toHaveProperty("evidenceId");
    expect(result.evidenceId).toMatch(/^EC-\d{8}-[A-Z0-9]{4}$/);

    expect(result).toHaveProperty("summary");
    expect(typeof result.summary).toBe("string");
    expect(result.summary.length).toBeGreaterThan(0);

    expect(result).toHaveProperty("entities");
    expect(Array.isArray(result.entities)).toBe(true);
    expect(result.entities.length).toBeGreaterThan(0);

    expect(result).toHaveProperty("confidence");
    expect(typeof result.confidence).toBe("number");
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(100);

    expect(result).toHaveProperty("reasoning");
    expect(typeof result.reasoning).toBe("string");

    // Verify verification questions
    expect(result).toHaveProperty("verificationQuestions");
    expect(Array.isArray(result.verificationQuestions)).toBe(true);
    expect(result.verificationQuestions.length).toBe(3);

    // Verify impacts
    expect(result).toHaveProperty("impacts");
    expect(Array.isArray(result.impacts)).toBe(true);

    // Verify related indicators
    expect(result).toHaveProperty("relatedIndicators");
    expect(Array.isArray(result.relatedIndicators)).toBe(true);
  });

  it("updates company weights in the database", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Get initial weights
    const beforeCompanies = await caller.companies.list();
    const hanwuji = beforeCompanies.find((c) => c.symbol === "688256");
    const haiguang = beforeCompanies.find((c) => c.symbol === "688041");

    // Run analysis
    const result = await caller.causal.analyze({
      message:
        "NVIDIA发布新一代B300 GPU，AI推理性能较上代提升3倍",
      sourceType: "manual",
    });

    // Get updated weights
    const afterCompanies = await caller.companies.list();
    const hanwujiAfter = afterCompanies.find((c) => c.symbol === "688256");
    const haiguangAfter = afterCompanies.find((c) => c.symbol === "688041");

    // Verify weights were updated (if companies exist and weights are within bounds)
    if (hanwuji && hanwujiAfter && hanwuji.weight < 10) {
      expect(hanwujiAfter.weight).toBeGreaterThanOrEqual(hanwuji.weight);
    }
    if (haiguang && haiguangAfter && haiguang.weight < 10) {
      expect(haiguangAfter.weight).toBeGreaterThanOrEqual(haiguang.weight);
    }
  });

  it("creates change log entries when impacts occur", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Run analysis
    const result = await caller.causal.analyze({
      message:
        "NVIDIA发布新一代B300 GPU，AI推理性能较上代提升3倍",
      sourceType: "manual",
    });

    // Get logs and check for evidence-linked entries
    const afterLogs = await caller.changeLogs.list({ limit: 100 });

    // If there were impacts (weight changes), there should be log entries with this evidence ID
    if (result.impacts.length > 0) {
      const relatedLogs = afterLogs.filter(
        (l) => l.evidenceId === result.evidenceId
      );
      expect(relatedLogs.length).toBeGreaterThan(0);
    }

    // Verify log entries have required fields
    if (afterLogs.length > 0) {
      const log = afterLogs[0];
      expect(log).toHaveProperty("id");
      expect(log).toHaveProperty("timestamp");
      expect(log).toHaveProperty("action");
    }
  });

  it("creates evidence chain record", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Run analysis
    const result = await caller.causal.analyze({
      message:
        "NVIDIA发布新一代B300 GPU，AI推理性能较上代提升3倍",
      sourceType: "manual",
    });

    // Verify evidence chain was saved
    const evidence = await caller.evidence.get({
      evidenceId: result.evidenceId,
    });
    expect(evidence).not.toBeNull();
    if (evidence) {
      expect(evidence.evidenceId).toBe(result.evidenceId);
      expect(evidence.sourceMessage).toContain("NVIDIA");
      expect(evidence.analysis).not.toBeNull();
      expect(evidence.verificationQuestions).not.toBeNull();
    }
  });
});

describe("causal.analyze dimensionScores contract", () => {
  it("returns dimensionScores with all 6 dimensions", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.causal.analyze({
      message: "NVIDIA发布新一代B300 GPU",
      sourceType: "manual",
    });

    // Verify dimensionScores exists
    expect(result).toHaveProperty("dimensionScores");
    const ds = result.dimensionScores;
    expect(ds).toBeDefined();

    // Verify all 6 dimensions present
    const dims = ["fundamental", "technical", "flow", "catalyst", "sentiment", "alternative"];
    for (const dim of dims) {
      expect(ds).toHaveProperty(dim);
      const d = (ds as Record<string, any>)[dim];
      expect(d).toHaveProperty("score");
      expect(d).toHaveProperty("direction");
      expect(d).toHaveProperty("brief");
      expect(typeof d.score).toBe("number");
      expect(d.score).toBeGreaterThanOrEqual(0);
      expect(d.score).toBeLessThanOrEqual(10);
      expect(["up", "down", "neutral"]).toContain(d.direction);
      expect(typeof d.brief).toBe("string");
    }
  });

  it("returns counterArgument and macroRegime", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.causal.analyze({
      message: "NVIDIA发布新一代B300 GPU",
      sourceType: "manual",
    });

    expect(result).toHaveProperty("counterArgument");
    expect(typeof result.counterArgument).toBe("string");
    expect(result.counterArgument!.length).toBeGreaterThan(0);

    expect(result).toHaveProperty("macroRegime");
    expect(["expansion", "contraction", "policy_pivot", "liquidity_squeeze", "stagflation"]).toContain(result.macroRegime);
  });

  it("returns scenarios with 3 entries", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.causal.analyze({
      message: "NVIDIA发布新一代B300 GPU",
      sourceType: "manual",
    });

    expect(result).toHaveProperty("scenarios");
    expect(Array.isArray(result.scenarios)).toBe(true);
    expect(result.scenarios!.length).toBe(3);

    for (const s of result.scenarios!) {
      expect(s).toHaveProperty("name");
      expect(s).toHaveProperty("nameEn");
      expect(s).toHaveProperty("probability");
      expect(s).toHaveProperty("description");
      expect(s).toHaveProperty("trigger");
      expect(s).toHaveProperty("poolImpact");
    }

    // Verify probabilities sum to 100
    const totalProb = result.scenarios!.reduce((sum, s) => sum + s.probability, 0);
    expect(totalProb).toBe(100);
  });
});
