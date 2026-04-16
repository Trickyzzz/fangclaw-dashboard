import { z } from "zod";
import { getIngestionStatus } from "../ingestion/poller";
import { getAllCompanies, getDb } from "../db";
import { ENV } from "./env";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";
import { isSqliteMode } from "../sqliteStore";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  ingestion: router({
    status: publicProcedure.query(() => getIngestionStatus()),
  }),

  readiness: publicProcedure.query(async () => {
    const ingestion = getIngestionStatus();
    const databaseConfigured = Boolean(ENV.databaseUrl);
    const llmConfigured = Boolean(ENV.forgeApiKey);
    const oauthConfigured = Boolean(ENV.oAuthServerUrl);

    let databaseConnected = false;
    let dataInitialized = false;
    if (databaseConfigured) {
      try {
        if (isSqliteMode()) {
          await getAllCompanies();
          databaseConnected = true;
          dataInitialized = true;
        } else {
          const db = await getDb();
          databaseConnected = Boolean(db);
          if (databaseConnected) {
            await getAllCompanies();
            dataInitialized = true;
          }
        }
      } catch {
        databaseConnected = false;
        dataInitialized = false;
      }
    }

    const missing: string[] = [];
    if (!databaseConfigured) missing.push("DATABASE_URL");
    if (!llmConfigured) missing.push("BUILT_IN_FORGE_API_KEY 或 OPENAI_API_KEY");
    if (!oauthConfigured) missing.push("OAUTH_SERVER_URL");
    if (databaseConfigured && !databaseConnected) missing.push("数据库连接失败");
    if (databaseConnected && !dataInitialized) missing.push("数据库未初始化（执行 pnpm db:push 与 seed）");

    return {
      mode: missing.length === 0 ? "realtime" : "demo",
      databaseConfigured,
      databaseConnected,
      dataInitialized,
      llmConfigured,
      oauthConfigured,
      ingestion,
      missing,
    };
  }),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),
});
