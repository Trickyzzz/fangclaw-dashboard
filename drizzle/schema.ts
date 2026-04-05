import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, float, json, bigint } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * 动态公司池 - 核心实体表
 */
export const companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  symbol: varchar("symbol", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  sector: varchar("sector", { length: 100 }),
  chainPosition: mysqlEnum("chainPosition", ["上游", "中游", "下游"]).notNull(),
  weight: int("weight").notNull().default(5),
  tags: json("tags").$type<string[]>(),
  addedAt: timestamp("addedAt").defaultNow().notNull(),
  lastChange: timestamp("lastChange"),
  isActive: int("isActive").notNull().default(1),
  /** 最新价格 */
  latestPrice: float("latestPrice"),
  /** 涨跌幅 (%) */
  priceChange: float("priceChange"),
  /** 最后更新价格时间 */
  priceUpdatedAt: timestamp("priceUpdatedAt"),
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

/**
 * 20 指标框架 - v3.0 增加交叉因子和生命周期字段
 */
export const indicators = mysqlTable("indicators", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  description: text("description"),
  threshold: text("threshold"),
  example: text("example"),
  dataSources: json("dataSources").$type<string[]>(),
  lastStatus: mysqlEnum("lastStatus", ["normal", "triggered"]).default("normal").notNull(),
  lastTriggeredAt: timestamp("lastTriggeredAt"),
  /** P0-B: 交叉因子标签 - 标注该指标跨越的另一个维度 */
  crossDimension: varchar("crossDimension", { length: 50 }),
  /** R3: 因子生命周期 - 首次触发时间 */
  firstTriggeredAt: timestamp("firstTriggeredAt"),
  /** R3: 因子生命周期 - 累计触发次数 */
  triggerCount: int("triggerCount").notNull().default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Indicator = typeof indicators.$inferSelect;
export type InsertIndicator = typeof indicators.$inferInsert;

/**
 * 变更日志 - 记录所有公司池变动
 */
export const changeLogs = mysqlTable("changeLogs", {
  id: int("id").autoincrement().primaryKey(),
  timestamp: bigint("timestamp", { mode: "number" }).notNull(),
  action: varchar("action", { length: 20 }).notNull(),
  symbol: varchar("symbol", { length: 20 }),
  name: varchar("name", { length: 100 }),
  message: text("message"),
  reason: text("reason"),
  evidenceId: varchar("evidenceId", { length: 50 }),
  oldWeight: int("oldWeight"),
  newWeight: int("newWeight"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChangeLog = typeof changeLogs.$inferSelect;
export type InsertChangeLog = typeof changeLogs.$inferInsert;

/**
 * 证据链 - 存储 AI 推理的完整过程
 */
export const evidenceChains = mysqlTable("evidenceChains", {
  id: int("id").autoincrement().primaryKey(),
  evidenceId: varchar("evidenceId", { length: 50 }).notNull().unique(),
  sourceMessage: text("sourceMessage").notNull(),
  sourceType: varchar("sourceType", { length: 50 }),
  sourceUrl: text("sourceUrl"),
  sourceTimestamp: bigint("sourceTimestamp", { mode: "number" }),
  /** AI 分析结果 JSON */
  analysis: json("analysis").$type<{
    entities: string[];
    relatedIndicators: number[];
    impactAssessment: string;
    confidence: number;
    reasoning: string;
    scenarios?: {
      name: string;
      nameEn: string;
      probability: number;
      description: string;
      trigger: string;
      poolImpact: string;
    }[];
  }>(),
  /** 受影响的公司及权重变化 */
  impacts: json("impacts").$type<{
    symbol: string;
    name: string;
    oldWeight: number;
    newWeight: number;
    direction: "up" | "down" | "neutral";
    reason: string;
  }[]>(),
  /** 线下验证清单 */
  verificationQuestions: json("verificationQuestions").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EvidenceChain = typeof evidenceChains.$inferSelect;
export type InsertEvidenceChain = typeof evidenceChains.$inferInsert;

/**
 * P1: 关键变量监控表
 */
export const keyVariables = mysqlTable("keyVariables", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  nameEn: varchar("nameEn", { length: 100 }),
  category: varchar("category", { length: 50 }).notNull(),
  currentValue: varchar("currentValue", { length: 200 }).notNull(),
  triggerCondition: text("triggerCondition"),
  signal: mysqlEnum("signal", ["Bullish", "Bearish", "Neutral"]).default("Neutral").notNull(),
  impactNote: text("impactNote"),
  source: varchar("source", { length: 200 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type KeyVariable = typeof keyVariables.$inferSelect;
export type InsertKeyVariable = typeof keyVariables.$inferInsert;

/**
 * P1-A: 十大因子模板表
 * 预定义的因子分析模板，帮助用户快速应用标准化分析框架
 */
export const factorTemplates = mysqlTable("factorTemplates", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  nameEn: varchar("nameEn", { length: 100 }),
  category: varchar("category", { length: 50 }).notNull(),
  /** 交叉的第二个维度（如果是交叉因子） */
  crossCategory: varchar("crossCategory", { length: 50 }),
  description: text("description"),
  /** 信号定义：什么情况下触发 */
  signalDefinition: text("signalDefinition"),
  /** 数据来源 */
  dataSources: json("dataSources").$type<string[]>(),
  /** 适用市场 */
  applicableMarkets: json("applicableMarkets").$type<string[]>(),
  /** 历史胜率（0-100） */
  historicalWinRate: float("historicalWinRate"),
  /** 平均持续天数 */
  avgDurationDays: int("avgDurationDays"),
  /** 优先级（1-10，10最高） */
  priority: int("priority").notNull().default(5),
  /** 是否启用 */
  isActive: int("isActive").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FactorTemplate = typeof factorTemplates.$inferSelect;
export type InsertFactorTemplate = typeof factorTemplates.$inferInsert;

/**
 * E1: 用户订阅表 - 管理推送偏好
 */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** 推送渠道 */
  channel: mysqlEnum("channel", ["email", "feishu", "wecom"]).notNull(),
  /** 渠道地址（邮箱/Webhook URL） */
  channelAddress: text("channelAddress").notNull(),
  /** 推送频率 */
  frequency: mysqlEnum("frequency", ["realtime", "daily", "weekly"]).default("daily").notNull(),
  /** 关注的公司符号列表（空=全部） */
  watchCompanies: json("watchCompanies").$type<string[]>(),
  /** 关注的维度列表（空=全部） */
  watchDimensions: json("watchDimensions").$type<string[]>(),
  /** 是否启用 */
  isActive: int("isActive").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * E6: 免费试用表
 */
export const trials = mysqlTable("trials", {
  id: int("id").autoincrement().primaryKey(),
  /** 联系方式（邮箱或微信号） */
  contact: varchar("contact", { length: 320 }).notNull(),
  /** 联系方式类型 */
  contactType: mysqlEnum("contactType", ["email", "wechat"]).notNull(),
  /** 试用开始时间 */
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  /** 试用结束时间 */
  expiresAt: timestamp("expiresAt").notNull(),
  /** 试用状态 */
  status: mysqlEnum("status", ["active", "expired", "converted"]).default("active").notNull(),
  /** 已推送次数 */
  pushCount: int("pushCount").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Trial = typeof trials.$inferSelect;
export type InsertTrial = typeof trials.$inferInsert;

/**
 * E7: 分享令牌表
 */
export const shareTokens = mysqlTable("shareTokens", {
  id: int("id").autoincrement().primaryKey(),
  /** 分享令牌 */
  token: varchar("token", { length: 64 }).notNull().unique(),
  /** 关联的证据链 ID */
  evidenceId: varchar("evidenceId", { length: 50 }).notNull(),
  /** 分享者用户 ID */
  sharedBy: int("sharedBy"),
  /** 查看次数 */
  viewCount: int("viewCount").notNull().default(0),
  /** 是否有效 */
  isActive: int("isActive").notNull().default(1),
  /** 过期时间 */
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ShareToken = typeof shareTokens.$inferSelect;
export type InsertShareToken = typeof shareTokens.$inferInsert;

/**
 * E2: 每日摘要报告表
 */
export const dailyReports = mysqlTable("dailyReports", {
  id: int("id").autoincrement().primaryKey(),
  /** 报告日期 YYYY-MM-DD */
  reportDate: varchar("reportDate", { length: 10 }).notNull().unique(),
  /** 报告内容 JSON */
  content: json("content").$type<{
    topMovers: { symbol: string; name: string; oldWeight: number; newWeight: number }[];
    triggeredIndicators: { name: string; category: string }[];
    newEvidenceCount: number;
    evidenceSummary: string;
    tomorrowWatchlist: string[];
    aiSummary: string;
  }>(),
  /** 推送状态 */
  pushStatus: mysqlEnum("pushStatus", ["pending", "sent", "failed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DailyReport = typeof dailyReports.$inferSelect;
export type InsertDailyReport = typeof dailyReports.$inferInsert;
