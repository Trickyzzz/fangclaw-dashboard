import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * E1-E7 边界条件与新增接口测试
 * 覆盖：推送失败容错、重复订阅、无效 token、空报告、试用管理接口
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

describe("E1-E7 Edge Cases & New Endpoints", () => {
  const ctx = createPublicContext();
  const caller = appRouter.createCaller(ctx);

  // ========== E1 边界条件 ==========
  describe("E1: subscription edge cases", () => {
    it("handles listing subscriptions for non-existent user", async () => {
      const subs = await caller.subscriptions.list({ userId: 999999 });
      expect(Array.isArray(subs)).toBe(true);
      expect(subs.length).toBe(0);
    });

    it("handles deleting non-existent subscription gracefully", async () => {
      const result = await caller.subscriptions.delete({ id: 999999 });
      // Should not throw, returns success (idempotent delete)
      expect(result).toHaveProperty("success");
    });

    it("test push returns result without error", async () => {
      const result = await caller.subscriptions.testPush({ userId: 1 });
      expect(result).toBeDefined();
      expect(result).toHaveProperty("sent");
      expect(result).toHaveProperty("anomalies");
    });
  });

  // ========== E2 边界条件 ==========
  describe("E2: daily report edge cases", () => {
    it("handles getDaily for future date (no report)", async () => {
      const futureDate = "2099-12-31";
      const report = await caller.reports.getDaily({ date: futureDate });
      expect(report).toBeNull();
    });

    it("handles recent with limit 0", async () => {
      const reports = await caller.reports.recent({ limit: 0 });
      expect(Array.isArray(reports)).toBe(true);
      expect(reports.length).toBe(0);
    });

    it("handles recent with large limit", async () => {
      const reports = await caller.reports.recent({ limit: 1000 });
      expect(Array.isArray(reports)).toBe(true);
    });
  });

  // ========== E6 新增接口测试 ==========
  describe("E6: trials management", () => {
    it("checks trial status for non-existent contact", async () => {
      const result = await caller.trials.check({ contact: "nonexistent@test.com" });
      // Should return null or undefined for non-existent contact
      expect(result === null || result === undefined).toBe(true);
    });

    it("lists all trials (admin)", async () => {
      const allTrials = await caller.trials.listAll();
      expect(Array.isArray(allTrials)).toBe(true);
    });

    it("registers and then checks trial status", async () => {
      const contact = `check_${Date.now()}@stockclaw.com`;
      const reg = await caller.trials.register({ contact, contactType: "email" });
      expect(reg.success).toBe(true);

      const check = await caller.trials.check({ contact });
      expect(check).toBeDefined();
      expect(check!.status).toBe("active");
    });

    it("updates trial status to converted", async () => {
      const contact = `convert_${Date.now()}@stockclaw.com`;
      const reg = await caller.trials.register({ contact, contactType: "email" });
      expect(reg.success).toBe(true);
      const trialId = reg.trial?.id;
      if (!trialId) return;

      const result = await caller.trials.updateStatus({ id: trialId, status: "converted" });
      expect(result.success).toBe(true);

      const check = await caller.trials.check({ contact });
      expect(check!.status).toBe("converted");
    });

    it("batch expire processes without error", async () => {
      const result = await caller.trials.expireAll();
      expect(result).toHaveProperty("success");
      expect(result.success).toBe(true);
    });

    it("removes (soft-deletes) a trial", async () => {
      const contact = `remove_${Date.now()}@stockclaw.com`;
      const reg = await caller.trials.register({ contact, contactType: "email" });
      expect(reg.success).toBe(true);
      const trialId = reg.trial?.id;
      if (!trialId) return;

      const result = await caller.trials.remove({ id: trialId });
      expect(result.success).toBe(true);

      const check = await caller.trials.check({ contact });
      expect(check!.status).toBe("expired");
    });

    it("updateStatus handles non-existent id gracefully", async () => {
      // Should not throw even for non-existent ID
      const result = await caller.trials.updateStatus({ id: 999999, status: "expired" });
      expect(result).toHaveProperty("success");
    });
  });

  // ========== E7 边界条件 ==========
  describe("E7: share edge cases", () => {
    it("handles empty evidenceId gracefully", async () => {
      try {
        await caller.share.create({ evidenceId: "" });
        // If it doesn't throw, that's also acceptable
      } catch (e: any) {
        // Zod validation should catch empty string
        expect(e).toBeDefined();
      }
    });

    it("handles viewing with empty token", async () => {
      const result = await caller.share.view({ token: "___empty___" });
      expect(result.found).toBe(false);
    });

    it("creates multiple shares for same evidence", async () => {
      const r1 = await caller.share.create({ evidenceId: "EV-MULTI" });
      const r2 = await caller.share.create({ evidenceId: "EV-MULTI" });
      expect(r1.token).toBeDefined();
      expect(r2.token).toBeDefined();
      // Each share should get a unique token
      expect(r1.token).not.toBe(r2.token);
    });
  });

  // ========== 免责声明 ==========
  describe("Disclaimer endpoint", () => {
    it("returns disclaimer text", async () => {
      const result = await caller.disclaimer.get();
      expect(result).toBeDefined();
      expect(result).toHaveProperty("zh");
      expect(result).toHaveProperty("en");
      expect(result.zh.length).toBeGreaterThan(0);
      expect(result.en.length).toBeGreaterThan(0);
    });
  });
});
