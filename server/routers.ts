import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { z } from "zod";
import { eq, and, lte } from "drizzle-orm";
import { trials } from "../drizzle/schema";
import { getDb } from "./db";
import {
  getAllCompanies,
  getCompanyBySymbol,
  getCompanyStats,
  getAllIndicators,
  getChangeLogs,
  addChangeLog,
  getEvidenceChain,
  getRecentEvidenceChains,
  getLatestAnalysisForCompanies,
  getAllKeyVariables,
  getAllFactorTemplates,
  detectAnomalies,
  calculateCrowding,
  getFactorHeatmap,
  backtestEvidence,
  buildDiscoverySummary,
  // E1-E7
  getSubscriptionsByUserId,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  detectAndNotify,
  generateDailySummary,
  getDailyReport,
  getRecentDailyReports,
  createTrial,
  getTrialByContact,
  getAllTrials,
  createShareToken,
  getShareByToken,
} from "./db";
import { getRecentSecFilings } from "./data-sources/secEdgar";
import { getRecentCninfoAnnouncements } from "./data-sources/cninfo";
import { executeCausalAnalysis } from "./ingestion/autoAnalyze";
import { runIngestionCycle } from "./ingestion/poller";

// ========== R4: A股本土化 Prompt 增强 ==========
const A_SHARE_RULES = `
A股市场特殊规则（必须在分析中考虑）：
- 涨跌停制度：主板±10%，科创板/创业板±20%，ST股±5%
- T+1交易制度：当日买入次日才能卖出，影响短线策略
- 北向资金：沪港通/深港通外资流向是重要的领先指标，被称为"聪明钱"
- 大基金：国家集成电路产业投资基金的增减持是半导体板块的重要信号
- 融资融券：融资余额变化反映散户杠杆情绪
- 限售股解禁：大股东解禁期前后股价承压
- 政策敏感性：A股对政策面（如降准降息、产业政策）反应强烈
- 板块轮动：A股存在明显的板块轮动效应，需关注资金在板块间的流转
`;

// ========== E1: 宏观经济体制判断（CFA Institute 标准） ==========
const MACRO_REGIME_RULES = `
宏观经济体制判断（每次分析前必须先判断当前体制）：
在分析具体消息之前，先判断当前宏观环境属于以下哪种体制，并据此调整因子权重：
1. 扩张期（Expansion）：GDP增长加速、企业盈利上行、信贷扩张 → 成长因子权重↑，防御因子权重↓
2. 收缩期（Contraction）：GDP增长放缓、企业盈利下行、信贷收紧 → 价值因子权重↑，高杠杆公司风险↑
3. 政策转向期（Policy Pivot）：货币/财政政策方向发生重大变化 → 政策维度因子权重大幅↑，关注受益/受损板块
4. 流动性收紧期（Liquidity Squeeze）：利率上行、资金面紧张 → 资金维度因子权重↑，高估值公司承压
5. 滞胀期（Stagflation）：通胀上行但增长停滞 → 上游资源品受益，下游消费品承压
请在分析结果的 reasoning 字段中明确标注当前体制判断及其对本次分析的影响。
`;

// ========== E2: 反对论点与认知增强（花旗 Cognitive Debt 启发） ==========
const COUNTER_ARGUMENT_RULES = `
反对论点要求（认知增强，防止认知债务）：
对于每个分析结论，必须同时提供反对论点（Devil's Advocate）：
1. 为什么这个分析可能是错的？（至少给出1个反对理由）
2. 哪些假设可能不成立？
3. 有没有被忽略的反面证据？
这样做的目的是帮助用户保持独立判断力，而非盲目依赖AI分析。
`;

// ========== E5/E6: 非显而易见关联发现（Moody's 启发） ==========
const NON_OBVIOUS_RULES = `
非显而易见关联发现（Non-Obvious Correlation Discovery）：
当发现跨维度交叉因子时，必须回答以下问题：
1. 为什么这个关联不是显而易见的？（即普通投资者为什么会忽略它）
2. 这个关联的经济学传导机制是什么？
3. 历史上是否有类似的关联模式出现过？
这是 FangClaw 的核心价值——帮助用户发现"你不知道你不知道的"（unknown unknowns）。
`;

// ========== R7: 免责声明 ==========
const DISCLAIMER_ZH = "⚠️ 免责声明：FangClaw 系统提供的所有分析结果仅供研究参考，不构成任何投资建议。投资有风险，决策需谨慎。系统基于 AI 模型和公开信息进行分析，可能存在偏差或错误。用户应结合自身判断和专业顾问意见做出投资决策。";
const DISCLAIMER_EN = "⚠️ Disclaimer: All analysis provided by FangClaw is for research reference only and does not constitute investment advice. Investment involves risks; decisions should be made with caution. The system analyzes based on AI models and public information, which may contain biases or errors.";

export const appRouter = router({
  system: systemRouter,
  dataSources: router({
    secRecentFilings: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(20).optional() }).optional())
      .query(async ({ input }) => {
        return getRecentSecFilings(input?.limit ?? 6);
      }),
    cninfoRecentAnnouncements: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(20).optional() }).optional())
      .query(async ({ input }) => {
        return getRecentCninfoAnnouncements(input?.limit ?? 6);
      }),
    runIngestionCycle: publicProcedure.mutation(async () => {
      return runIngestionCycle();
    }),
  }),
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ========== 公司池 ==========
  companies: router({
    list: publicProcedure.query(async () => {
      return getAllCompanies();
    }),
    stats: publicProcedure.query(async () => {
      return getCompanyStats();
    }),
    getBySymbol: publicProcedure
      .input(z.object({ symbol: z.string() }))
      .query(async ({ input }) => {
        return getCompanyBySymbol(input.symbol);
      }),
    /** P1: 获取每家公司的最新 AI 分析摘要 */
    latestAnalysis: publicProcedure.query(async () => {
      const analysisMap = await getLatestAnalysisForCompanies();
      const result: Record<string, { evidenceId: string; direction: string; confidence: number; summary: string; triggeredFactors: number; createdAt: Date }> = {};
      analysisMap.forEach((data, symbol) => {
        result[symbol] = data;
      });
      return result;
    }),
    /** P1-B: 异常信号检测 */
    anomalies: publicProcedure.query(async () => {
      return detectAnomalies();
    }),
  }),

  // ========== 指标框架 ==========
  indicators: router({
    list: publicProcedure.query(async () => {
      return getAllIndicators();
    }),
    /** P2-B: 因子热力矩阵 */
    heatmap: publicProcedure.query(async () => {
      return getFactorHeatmap();
    }),
  }),

  // ========== 变更日志 ==========
  changeLogs: router({
    list: publicProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return getChangeLogs(input?.limit ?? 50);
      }),
  }),

  // ========== 证据链 ==========
  evidence: router({
    get: publicProcedure
      .input(z.object({ evidenceId: z.string() }))
      .query(async ({ input }) => {
        return getEvidenceChain(input.evidenceId);
      }),
    recent: publicProcedure.query(async () => {
      return getRecentEvidenceChains(20);
    }),
    /** P2-A: 因子回测模拟 */
    backtest: publicProcedure
      .input(z.object({ evidenceId: z.string() }))
      .query(async ({ input }) => {
        return backtestEvidence(input.evidenceId);
      }),
  }),

  // ========== 关键变量监控 ==========
  keyVariables: router({
    list: publicProcedure.query(async () => {
      return getAllKeyVariables();
    }),
  }),

  // ========== P1-A: 十大因子模板 ==========
  factorTemplates: router({
    list: publicProcedure.query(async () => {
      return getAllFactorTemplates();
    }),
  }),

  // ========== P1-C: 风控拥挤度 ==========
  risk: router({
    crowding: publicProcedure.query(async () => {
      return calculateCrowding();
    }),
  }),

  // ========== R7: 免责声明 ==========
  disclaimer: router({
    get: publicProcedure.query(() => {
      return { zh: DISCLAIMER_ZH, en: DISCLAIMER_EN };
    }),
  }),

  // ========== E1: 订阅管理 ==========
  subscriptions: router({
    list: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return getSubscriptionsByUserId(input.userId);
      }),
    create: publicProcedure
      .input(z.object({
        userId: z.number(),
        channel: z.enum(["email", "feishu", "wecom"]),
        channelAddress: z.string().min(1),
        frequency: z.enum(["realtime", "daily", "weekly"]).optional(),
        watchCompanies: z.array(z.string()).optional(),
        watchDimensions: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        await createSubscription({
          userId: input.userId,
          channel: input.channel,
          channelAddress: input.channelAddress,
          frequency: input.frequency || "daily",
          watchCompanies: input.watchCompanies || null,
          watchDimensions: input.watchDimensions || null,
        });
        return { success: true };
      }),
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        channel: z.enum(["email", "feishu", "wecom"]).optional(),
        channelAddress: z.string().optional(),
        frequency: z.enum(["realtime", "daily", "weekly"]).optional(),
        watchCompanies: z.array(z.string()).optional(),
        watchDimensions: z.array(z.string()).optional(),
        isActive: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateSubscription(id, data);
        return { success: true };
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteSubscription(input.id);
        return { success: true };
      }),
    /** 手动触发推送测试 */
    testPush: publicProcedure.mutation(async () => {
      const result = await detectAndNotify();
      return result;
    }),
  }),

  // ========== E2: 每日摘要 ==========
  reports: router({
    /** 生成今日摘要 */
    generateDaily: publicProcedure.mutation(async () => {
      return generateDailySummary();
    }),
    /** 获取指定日期摘要 */
    getDaily: publicProcedure
      .input(z.object({ date: z.string().optional() }))
      .query(async ({ input }) => {
        return getDailyReport(input.date);
      }),
    /** 获取最近 N 天摘要 */
    recent: publicProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return getRecentDailyReports(input?.limit ?? 7);
      }),
  }),

  // ========== E6: 免费试用 ==========
  trials: router({
    /** 申请免费试用 */
    register: publicProcedure
      .input(z.object({
        contact: z.string().min(1),
        contactType: z.enum(["email", "wechat"]),
      }))
      .mutation(async ({ input }) => {
        // 检查是否已有试用
        const existing = await getTrialByContact(input.contact);
        if (existing && existing.status === "active" && new Date(existing.expiresAt) > new Date()) {
          return { success: false, message: "您已有活跃的试用账户", trial: existing };
        }
        const trial = await createTrial(input.contact, input.contactType);
        return { success: true, message: "试用已激活，有效期 7 天", trial };
      }),
    /** 查询试用状态 */
    check: publicProcedure
      .input(z.object({ contact: z.string() }))
      .query(async ({ input }) => {
        return getTrialByContact(input.contact);
      }),
    /** 管理员查看所有试用 */
    listAll: publicProcedure.query(async () => {
      return getAllTrials();
    }),
    /** 更新试用状态（转化/过期） */
    updateStatus: publicProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["active", "expired", "converted"]),
      }))
      .mutation(async ({ input }) => {
        const database = await getDb();
        if (!database) return { success: false, message: "数据库不可用" };
        await database.update(trials).set({ status: input.status }).where(eq(trials.id, input.id));
        return { success: true };
      }),
    /** 软删除试用（标记为 expired） */
    remove: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const database = await getDb();
        if (!database) return { success: false, message: "数据库不可用" };
        await database.update(trials).set({ status: "expired" }).where(eq(trials.id, input.id));
        return { success: true };
      }),
    /** 批量过期处理：将已超过有效期的试用标记为 expired */
    expireAll: publicProcedure.mutation(async () => {
      const database = await getDb();
      if (!database) return { success: false, message: "数据库不可用" };
      const now = new Date();
      await database.update(trials)
        .set({ status: "expired" })
        .where(and(eq(trials.status, "active"), lte(trials.expiresAt, now)));
      return { success: true, message: "已处理过期试用" };
    }),
  }),

  // ========== E7: 分析分享 ==========
  share: router({
    /** 创建分享链接 */
    create: publicProcedure
      .input(z.object({
        evidenceId: z.string(),
        userId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await createShareToken(input.evidenceId, input.userId);
        return result;
      }),
    /** 查看分享内容 */
    view: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const share = await getShareByToken(input.token);
        if (!share) return { found: false, evidence: null };
        const evidence = await getEvidenceChain(share.evidenceId);
        return {
          found: true,
          evidence,
          disclaimer: DISCLAIMER_ZH,
          viewCount: share.viewCount,
        };
      }),
  }),

  // ========== AI 因果推理引擎 ==========
  causal: router({
    /**
     * 核心：输入一条消息 → AI 分析 → 自动更新公司池 → 生成证据链 → 返回完整结果
     * v3.0 升级：增加 A 股本土化规则 + 经济学逻辑检验
     */
    analyze: publicProcedure
      .input(z.object({
        message: z.string().min(5, "消息至少需要5个字符"),
        sourceType: z.string().optional(),
        sourceUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return executeCausalAnalysis({
          message: input.message,
          sourceType: input.sourceType ?? "manual",
          sourceUrl: input.sourceUrl ?? null,
          decisionMode: "full_apply",
        });
      }),

    /**
     * P0-A: 因子发现模式
     * 系统主动扫描当前目标池状态，发现潜在因子信号
     */
    discover: publicProcedure.mutation(async () => {
      const summary = await buildDiscoverySummary();
      if (!summary) throw new Error("无法构建发现上下文");

      const systemPrompt = `你是 StockClaw 智能投研系统的因子发现引擎——Agent Swarm 蜂群智能的核心组件。你的任务是基于当前目标池的状态，主动发现非显而易见的关联（Non-Obvious Correlations）和潜在的因子信号。

当前目标池快照：
- 公司数量：${summary.poolSnapshot.totalCompanies}
- 高权重公司（≥8）：${summary.poolSnapshot.highWeightCount}
- 平均权重：${summary.poolSnapshot.avgWeight}

当前指标状态：
- 总指标数：${summary.indicatorSnapshot.total}
- 已触发：${summary.indicatorSnapshot.triggered}
- 交叉因子触发：${summary.indicatorSnapshot.crossTriggered}

公司列表：
${summary.companySummary}

指标列表：
${summary.indicatorSummary}

可用因子模板（${summary.activeTemplates.length}个）：
${summary.activeTemplates.map(t => `[${t.code}] ${t.name} (${t.category}${t.crossCategory ? ` ×${t.crossCategory}` : ""}) - ${t.signalDefinition} [胜率${t.historicalWinRate}%]`).join("\n")}

最近分析活动：
${summary.recentActivity.map(a => `${a.evidenceId}: ${a.message} (置信度${a.confidence})`).join("\n")}

${A_SHARE_RULES}

${MACRO_REGIME_RULES}

${COUNTER_ARGUMENT_RULES}

${NON_OBVIOUS_RULES}

请基于以上信息，发现当前值得关注的非显而易见关联和因子信号。分析要点：
1. 哪些因子模板当前可能被触发？
2. 哪些公司的权重分布存在异常？
3. 指标触发的维度分布是否均衡？
4. 是否存在跨维度交叉信号？如果有，解释为什么这个关联不是显而易见的。
5. 基于最近的分析活动，有哪些趋势正在形成？
6. 当前宏观经济体制是什么？对因子权重有何影响？
7. 对于每个发现，同时给出反对论点。

请严格按照 JSON Schema 返回结果。`;

      const llmResult = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "请执行因子发现扫描，输出当前值得关注的信号和建议。" },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "factor_discovery",
            strict: true,
            schema: {
              type: "object",
              properties: {
                discoveredSignals: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      signalName: { type: "string", description: "信号名称" },
                      signalNameEn: { type: "string", description: "英文名称" },
                      templateCode: { type: "string", description: "关联的因子模板代码（如有）" },
                      severity: { type: "string", enum: ["high", "medium", "low"], description: "严重程度" },
                      description: { type: "string", description: "信号描述" },
                      affectedSymbols: { type: "array", items: { type: "string" }, description: "受影响的股票代码" },
                      suggestedAction: { type: "string", description: "建议操作" },
                      confidence: { type: "number", description: "置信度（0-100）" },
                      counterArgument: { type: "string", description: "反对论点：为什么这个信号可能是错的" },
                      nonObviousReason: { type: "string", description: "为什么这个关联不是显而易见的" },
                    },
                    required: ["signalName", "signalNameEn", "templateCode", "severity", "description", "affectedSymbols", "suggestedAction", "confidence", "counterArgument", "nonObviousReason"],
                    additionalProperties: false,
                  },
                  description: "发现的信号列表",
                },
                poolHealthAssessment: { type: "string", description: "目标池整体健康度评估" },
                trendSummary: { type: "string", description: "当前趋势总结" },
                watchlist: {
                  type: "array",
                  items: { type: "string" },
                  description: "建议重点关注的公司代码列表",
                },
                riskWarnings: {
                  type: "array",
                  items: { type: "string" },
                  description: "风险预警信息",
                },
              },
              required: ["discoveredSignals", "poolHealthAssessment", "trendSummary", "watchlist", "riskWarnings"],
              additionalProperties: false,
            },
          },
        },
      });

      const resultText = llmResult.choices[0]?.message?.content;
      if (!resultText || typeof resultText !== "string") {
        throw new Error("因子发现返回结果为空");
      }

      const discovery = JSON.parse(resultText);

      // 记录发现日志
      await addChangeLog({
        timestamp: Date.now(),
        action: "discovery",
        message: `因子发现扫描完成: 发现 ${discovery.discoveredSignals.length} 个信号`,
        reason: discovery.trendSummary,
      });

      // E1: 因子发现完成后触发推送
      try {
        await detectAndNotify();
      } catch (pushErr) {
        console.error("[E1 Push] discover 推送触发失败:", pushErr);
      }

      return {
        ...discovery,
        // E4: OpenClaw compatible 标准化字段
        signalType: "discovery" as const,
        disclaimer: DISCLAIMER_ZH,
        timestamp: Date.now(),
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
