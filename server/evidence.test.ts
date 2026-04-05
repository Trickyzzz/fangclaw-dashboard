import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { addEvidenceChain, getEvidenceChain } from "./db";

/**
 * 证据链详情页相关 API 测试
 * 测试证据链的查询、创建和数据完整性
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

describe("evidence API", () => {
  it("evidence.get returns null for non-existent evidence ID", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.evidence.get({ evidenceId: "EC-99999999-ZZZZ" });
    expect(result).toBeNull();
  });

  it("evidence.recent returns an array of evidence chains", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.evidence.recent();
    expect(Array.isArray(result)).toBe(true);
  });

  it("evidence.get returns correct data for existing evidence", async () => {
    // Create a test evidence chain via DB helper
    const testEvidenceId = `EC-TEST-${Date.now()}`;
    await addEvidenceChain({
      evidenceId: testEvidenceId,
      sourceMessage: "测试消息：NVIDIA发布新一代GPU",
      sourceType: "test",
      sourceUrl: null,
      sourceTimestamp: Date.now(),
      analysis: {
        entities: ["NVIDIA", "GPU"],
        relatedIndicators: [1, 2],
        impactAssessment: "对AI芯片行业有重大正面影响",
        confidence: 85,
        reasoning: "NVIDIA新GPU发布 → 算力提升 → AI训练效率提高",
      },
      impacts: [
        {
          symbol: "NVDA",
          name: "NVIDIA",
          oldWeight: 8,
          newWeight: 10,
          direction: "up",
          reason: "新产品发布直接利好",
        },
      ],
      verificationQuestions: [
        "新GPU的量产时间是否已确认？",
        "主要客户的采购意向如何？",
        "竞品是否有类似产品即将发布？",
      ],
    });

    // Query via tRPC
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.evidence.get({ evidenceId: testEvidenceId });

    expect(result).not.toBeNull();
    expect(result!.evidenceId).toBe(testEvidenceId);
    expect(result!.sourceMessage).toBe("测试消息：NVIDIA发布新一代GPU");
    expect(result!.sourceType).toBe("test");
  });

  it("evidence chain has complete analysis data", async () => {
    const testEvidenceId = `EC-TEST-FULL-${Date.now()}`;
    await addEvidenceChain({
      evidenceId: testEvidenceId,
      sourceMessage: "完整性测试消息",
      sourceType: "test",
      sourceUrl: "https://example.com/test",
      sourceTimestamp: Date.now(),
      analysis: {
        entities: ["Entity1", "Entity2"],
        relatedIndicators: [3, 5],
        impactAssessment: "测试影响评估",
        confidence: 72,
        reasoning: "步骤1 → 步骤2 → 步骤3",
      },
      impacts: [
        {
          symbol: "688256",
          name: "寒武纪",
          oldWeight: 7,
          newWeight: 9,
          direction: "up",
          reason: "测试原因",
        },
        {
          symbol: "688041",
          name: "海光信息",
          oldWeight: 6,
          newWeight: 5,
          direction: "down",
          reason: "测试负面原因",
        },
      ],
      verificationQuestions: ["Q1?", "Q2?", "Q3?"],
    });

    // Verify via DB helper
    const evidence = await getEvidenceChain(testEvidenceId);
    expect(evidence).not.toBeNull();
    expect(evidence!.analysis).not.toBeNull();
    expect(evidence!.analysis!.entities).toEqual(["Entity1", "Entity2"]);
    expect(evidence!.analysis!.relatedIndicators).toEqual([3, 5]);
    expect(evidence!.analysis!.confidence).toBe(72);
    expect(evidence!.analysis!.reasoning).toContain("→");
    expect(evidence!.impacts).not.toBeNull();
    expect(evidence!.impacts!.length).toBe(2);
    expect(evidence!.impacts![0].direction).toBe("up");
    expect(evidence!.impacts![1].direction).toBe("down");
    expect(evidence!.verificationQuestions).toEqual(["Q1?", "Q2?", "Q3?"]);
  });

  it("evidence.get validates input - requires evidenceId string", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    // @ts-expect-error - testing invalid input
    await expect(caller.evidence.get({})).rejects.toThrow();
  });
});
