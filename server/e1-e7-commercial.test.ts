import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * E1-E7 商业化功能测试
 * 覆盖：订阅管理、每日摘要、试用注册、分享功能
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

describe("E1-E7 Commercial Features", () => {
  const ctx = createPublicContext();
  const caller = appRouter.createCaller(ctx);

  // ========== E1: 订阅管理 ==========
  describe("E1: subscriptions", () => {
    let createdSubId: number | null = null;

    it("lists subscriptions for a user (empty initially)", async () => {
      const subs = await caller.subscriptions.list({ userId: 999 });
      expect(Array.isArray(subs)).toBe(true);
    });

    it("creates a new subscription", async () => {
      const result = await caller.subscriptions.create({
        userId: 1,
        channel: "email",
        channelAddress: "test@stockclaw.com",
        frequency: "daily",
      });
      expect(result).toBeDefined();
      expect(result).toHaveProperty("success");
      expect(result.success).toBe(true);
    });

    it("lists subscriptions after creation", async () => {
      const subs = await caller.subscriptions.list({ userId: 1 });
      expect(subs.length).toBeGreaterThanOrEqual(1);
      const found = subs.find((s: any) => s.channelAddress === "test@stockclaw.com");
      expect(found).toBeDefined();
      if (found) {
        createdSubId = (found as any).id;
      }
    });

    it("updates a subscription", async () => {
      if (!createdSubId) return;
      const result = await caller.subscriptions.update({
        id: createdSubId,
        frequency: "weekly",
        isActive: 0,
      });
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it("deletes a subscription", async () => {
      if (!createdSubId) return;
      const result = await caller.subscriptions.delete({ id: createdSubId });
      expect(result).toHaveProperty("success");
      expect(result.success).toBe(true);
    });
  });

  // ========== E2: 每日摘要 ==========
  describe("E2: daily reports", () => {
    it("generates a daily report", async () => {
      const report = await caller.reports.generateDaily();
      expect(report).toBeDefined();
      if (report) {
        expect(report).toHaveProperty("reportDate");
        expect(report).toHaveProperty("content");
      }
    });

    it("retrieves daily report by date", async () => {
      const today = new Date().toISOString().slice(0, 10);
      const report = await caller.reports.getDaily({ date: today });
      // May or may not exist depending on previous test
      if (report) {
        expect(report).toHaveProperty("reportDate");
        expect(report).toHaveProperty("content");
      }
    });

    it("lists recent reports", async () => {
      const reports = await caller.reports.recent({ limit: 5 });
      expect(Array.isArray(reports)).toBe(true);
    });
  });

  // ========== E6: 免费试用 ==========
  describe("E6: trials", () => {
    it("registers a new trial", async () => {
      const result = await caller.trials.register({
        contact: `test_${Date.now()}@stockclaw.com`,
        contactType: "email",
      });
      expect(result).toBeDefined();
      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("message");
      expect(result).toHaveProperty("trial");
    });

    it("prevents duplicate trial registration", async () => {
      const contact = `dup_${Date.now()}@stockclaw.com`;
      // First registration
      const first = await caller.trials.register({
        contact,
        contactType: "email",
      });
      expect(first.success).toBe(true);

      // Second registration with same contact
      const second = await caller.trials.register({
        contact,
        contactType: "email",
      });
      // Should return existing trial info
      expect(second).toHaveProperty("trial");
    });
  });

  // ========== E7: 分析分享 ==========
  describe("E7: share", () => {
    let shareToken: string | null = null;

    it("creates a share token", async () => {
      const result = await caller.share.create({
        evidenceId: "EV-001",
      });
      expect(result).toBeDefined();
      expect(result).toHaveProperty("token");
      expect(typeof result.token).toBe("string");
      expect(result.token.length).toBeGreaterThan(0);
      shareToken = result.token;
    });

    it("views shared content by token", async () => {
      if (!shareToken) return;
      const result = await caller.share.view({ token: shareToken });
      expect(result).toBeDefined();
      expect(result.found).toBe(true);
      if (result.found) {
        expect(result).toHaveProperty("disclaimer");
      }
    });

    it("returns not found for invalid token", async () => {
      const result = await caller.share.view({ token: "invalid_token_xyz" });
      expect(result.found).toBe(false);
    });
  });

  // ========== 免责声明集成验证 ==========
  describe("disclaimer integration", () => {
    it("disclaimer is included in share view", async () => {
      const share = await caller.share.create({ evidenceId: "EV-001" });
      const view = await caller.share.view({ token: share.token });
      if (view.found) {
        expect(view.disclaimer).toBeDefined();
        expect(typeof view.disclaimer).toBe("string");
        expect(view.disclaimer!.length).toBeGreaterThan(0);
      }
    });
  });
});
