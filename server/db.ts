import { eq, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  companies, InsertCompany, Company,
  indicators, InsertIndicator,
  changeLogs, InsertChangeLog,
  evidenceChains, InsertEvidenceChain,
  keyVariables, InsertKeyVariable,
  factorTemplates, InsertFactorTemplate,
  subscriptions, InsertSubscription,
  trials, InsertTrial,
  shareTokens, InsertShareToken,
  dailyReports, InsertDailyReport,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ========== USER ==========

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) { values.lastSignedIn = new Date(); }
    if (Object.keys(updateSet).length === 0) { updateSet.lastSignedIn = new Date(); }
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get user: database not available"); return undefined; }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ========== COMPANIES ==========

export async function getAllCompanies() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(companies).where(eq(companies.isActive, 1)).orderBy(desc(companies.weight));
}

export async function getCompanyBySymbol(symbol: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(companies).where(eq(companies.symbol, symbol)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertCompany(data: InsertCompany) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(companies).values(data).onDuplicateKeyUpdate({
    set: {
      name: data.name,
      sector: data.sector,
      chainPosition: data.chainPosition,
      weight: data.weight,
      tags: data.tags,
      lastChange: new Date(),
    },
  });
}

export async function updateCompanyWeight(symbol: string, newWeight: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(companies).set({ weight: newWeight, lastChange: new Date() }).where(eq(companies.symbol, symbol));
}

export async function updateCompanyPrice(symbol: string, price: number, change: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(companies).set({
    latestPrice: price,
    priceChange: change,
    priceUpdatedAt: new Date(),
  }).where(eq(companies.symbol, symbol));
}

export async function getCompanyStats() {
  const db = await getDb();
  if (!db) return { total: 0, avgWeight: 0, upstream: 0, midstream: 0, downstream: 0 };
  const all = await db.select().from(companies).where(eq(companies.isActive, 1));
  const total = all.length;
  const avgWeight = total > 0 ? Math.round((all.reduce((s, c) => s + c.weight, 0) / total) * 10) / 10 : 0;
  const upstream = all.filter(c => c.chainPosition === "上游").length;
  const midstream = all.filter(c => c.chainPosition === "中游").length;
  const downstream = all.filter(c => c.chainPosition === "下游").length;
  return { total, avgWeight, upstream, midstream, downstream };
}

// ========== INDICATORS ==========

export async function getAllIndicators() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(indicators).orderBy(indicators.id);
}

export async function upsertIndicator(data: InsertIndicator) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(indicators).values(data).onDuplicateKeyUpdate({
    set: {
      name: data.name,
      category: data.category,
      description: data.description,
      threshold: data.threshold,
      example: data.example,
      dataSources: data.dataSources,
    },
  });
}

export async function updateIndicatorStatus(id: number, status: "normal" | "triggered") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, unknown> = { lastStatus: status };
  if (status === "triggered") {
    updateData.lastTriggeredAt = new Date();
  }
  await db.update(indicators).set(updateData).where(eq(indicators.id, id));
}

// ========== CHANGE LOGS ==========

export async function getChangeLogs(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(changeLogs).orderBy(desc(changeLogs.id)).limit(limit);
}

export async function addChangeLog(data: InsertChangeLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(changeLogs).values(data);
}

// ========== EVIDENCE CHAINS ==========

export async function getEvidenceChain(evidenceId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(evidenceChains).where(eq(evidenceChains.evidenceId, evidenceId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function addEvidenceChain(data: InsertEvidenceChain) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(evidenceChains).values(data);
}

export async function getRecentEvidenceChains(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(evidenceChains).orderBy(desc(evidenceChains.id)).limit(limit);
}

/**
 * P1: 获取某公司的最新分析摘要（从证据链中提取）
 * 返回最近一次涉及该公司的分析结果
 */
// ========== KEY VARIABLES ==========

export async function getAllKeyVariables() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(keyVariables).orderBy(keyVariables.id);
}

export async function upsertKeyVariable(data: InsertKeyVariable) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(keyVariables).values(data).onDuplicateKeyUpdate({
    set: {
      currentValue: data.currentValue,
      signal: data.signal,
      impactNote: data.impactNote,
      triggerCondition: data.triggerCondition,
    },
  });
}

// ========== v3.0: FACTOR LIFECYCLE ==========

/**
 * R3: 更新指标触发状态时同步更新生命周期字段
 */
export async function updateIndicatorStatusV3(id: number, status: "normal" | "triggered") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (status === "triggered") {
    // 更新 lastTriggeredAt, triggerCount+1, 如果 firstTriggeredAt 为空则设置
    await db.execute(
      sql`UPDATE indicators SET lastStatus='triggered', lastTriggeredAt=NOW(), triggerCount=triggerCount+1, firstTriggeredAt=COALESCE(firstTriggeredAt, NOW()) WHERE id=${id}`
    );
  } else {
    await db.update(indicators).set({ lastStatus: status }).where(eq(indicators.id, id));
  }
}

// ========== v3.0: FACTOR TEMPLATES ==========

export async function getAllFactorTemplates() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(factorTemplates).orderBy(factorTemplates.priority);
}

export async function getFactorTemplateByCode(code: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(factorTemplates).where(eq(factorTemplates.code, code)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// ========== v3.0: ANOMALY DETECTION ==========

/**
 * P1-B: 检测目标池中的异常信号
 * R1: 权重单次变动超过2级
 * R2: 同一公司24h内被多条消息影响
 * R3: 某维度下超过50%指标同时触发
 * R4: 证据链中出现跨维度交叉信号
 */
export async function detectAnomalies() {
  const db = await getDb();
  if (!db) return [];
  const anomalies: { type: string; severity: "high" | "medium" | "low"; symbol?: string; name?: string; detail: string }[] = [];

  // R1: 检查最近24h内权重变动超过2的记录
  const recentLogs = await db.select().from(changeLogs)
    .where(sql`\`timestamp\` > ${Date.now() - 86400000} AND action = 'weight'`)
    .orderBy(desc(changeLogs.id));

  for (const log of recentLogs) {
    if (log.oldWeight !== null && log.newWeight !== null) {
      const delta = Math.abs(log.newWeight - log.oldWeight);
      if (delta >= 2) {
        anomalies.push({
          type: "weight_spike",
          severity: delta >= 3 ? "high" : "medium",
          symbol: log.symbol ?? undefined,
          name: log.name ?? undefined,
          detail: `权重变动 ${log.oldWeight} → ${log.newWeight}（变化 ${delta} 级）`,
        });
      }
    }
  }

  // R2: 同一公司24h内被多条消息影响
  const symbolCounts = new Map<string, number>();
  for (const log of recentLogs) {
    if (log.symbol) {
      symbolCounts.set(log.symbol, (symbolCounts.get(log.symbol) || 0) + 1);
    }
  }
  for (const [symbol, count] of Array.from(symbolCounts)) {
    if (count >= 2) {
      const log = recentLogs.find(l => l.symbol === symbol);
      anomalies.push({
        type: "multi_hit",
        severity: count >= 3 ? "high" : "medium",
        symbol,
        name: log?.name ?? undefined,
        detail: `24小时内被 ${count} 条消息影响`,
      });
    }
  }

  // R3: 某维度下超过50%指标同时触发
  const allIndicators = await db.select().from(indicators);
  const categoryMap = new Map<string, { total: number; triggered: number }>();
  for (const ind of allIndicators) {
    const cat = ind.category;
    if (!categoryMap.has(cat)) categoryMap.set(cat, { total: 0, triggered: 0 });
    const entry = categoryMap.get(cat)!;
    entry.total++;
    if (ind.lastStatus === "triggered") entry.triggered++;
  }
  for (const [cat, { total, triggered }] of Array.from(categoryMap)) {
    if (total > 0 && triggered / total >= 0.5) {
      anomalies.push({
        type: "dimension_overload",
        severity: triggered / total >= 0.75 ? "high" : "medium",
        detail: `「${cat}」维度 ${triggered}/${total} 个指标触发（${Math.round(triggered / total * 100)}%）`,
      });
    }
  }

  // R4: 跨维度交叉信号
  const crossIndicators = allIndicators.filter(i => i.crossDimension && i.lastStatus === "triggered");
  for (const ind of crossIndicators) {
    anomalies.push({
      type: "cross_dimension",
      severity: "medium",
      detail: `「${ind.name}」触发跨维度信号：${ind.category} × ${ind.crossDimension}`,
    });
  }

  return anomalies;
}

// ========== v3.0: RISK CROWDING ==========

/**
 * P1-C: 因子拥挤度动态计算
 * 基于高权重公司占比、触发指标集中度、证据链方向一致性
 */
export async function calculateCrowding() {
  const db = await getDb();
  if (!db) return { overall: 0, breakdown: {} as Record<string, number> };

  const allCompanies = await db.select().from(companies).where(eq(companies.isActive, 1));
  const allIndicators2 = await db.select().from(indicators);

  // 高权重公司占比
  const highWeight = allCompanies.filter(c => c.weight >= 8).length;
  const weightCrowding = allCompanies.length > 0 ? highWeight / allCompanies.length : 0;

  // 触发指标集中度
  const triggered = allIndicators2.filter(i => i.lastStatus === "triggered").length;
  const indicatorCrowding = allIndicators2.length > 0 ? triggered / allIndicators2.length : 0;

  // 证据链方向一致性（最近20条）
  const recentChains = await db.select().from(evidenceChains).orderBy(desc(evidenceChains.id)).limit(20);
  let upCount = 0;
  let downCount = 0;
  for (const chain of recentChains) {
    const impacts = chain.impacts as { direction: string }[] | null;
    if (!impacts) continue;
    for (const imp of impacts) {
      if (imp.direction === "up") upCount++;
      else if (imp.direction === "down") downCount++;
    }
  }
  const totalDir = upCount + downCount;
  const directionCrowding = totalDir > 0 ? Math.max(upCount, downCount) / totalDir : 0;

  const overall = Math.round((weightCrowding * 0.3 + indicatorCrowding * 0.3 + directionCrowding * 0.4) * 100);

  return {
    overall,
    breakdown: {
      weightCrowding: Math.round(weightCrowding * 100),
      indicatorCrowding: Math.round(indicatorCrowding * 100),
      directionCrowding: Math.round(directionCrowding * 100),
    },
    details: {
      highWeightCount: highWeight,
      totalCompanies: allCompanies.length,
      triggeredIndicators: triggered,
      totalIndicators: allIndicators2.length,
      recentUpImpacts: upCount,
      recentDownImpacts: downCount,
    },
  };
}

// ========== v3.0: HEATMAP ==========

/**
 * P2-B: 因子热力矩阵
 * 计算6个维度之间的交叉共振强度
 */
export async function getFactorHeatmap() {
  const db = await getDb();
  if (!db) return [];

  const dimensions = ["宏观/政策", "中观/行业", "微观/公司", "因子/量价", "事件/催化", "资金行为"];
  const allIndicators3 = await db.select().from(indicators);
  const recentChains = await db.select().from(evidenceChains).orderBy(desc(evidenceChains.id)).limit(50);

  // 构建 6×6 矩阵
  const matrix: { row: string; col: string; value: number }[] = [];

  for (const rowDim of dimensions) {
    for (const colDim of dimensions) {
      if (rowDim === colDim) {
        // 对角线：该维度自身的触发强度
        const dimIndicators = allIndicators3.filter(i => i.category === rowDim);
        const triggered = dimIndicators.filter(i => i.lastStatus === "triggered").length;
        matrix.push({ row: rowDim, col: colDim, value: dimIndicators.length > 0 ? Math.round(triggered / dimIndicators.length * 100) : 0 });
      } else {
        // 非对角线：两个维度之间的交叉信号强度
        const crossCount = allIndicators3.filter(
          i => i.category === rowDim && i.crossDimension === colDim && i.lastStatus === "triggered"
        ).length;
        // 也检查证据链中同时触发两个维度指标的情况
        let chainCross = 0;
        for (const chain of recentChains) {
          const analysis = chain.analysis as { relatedIndicators: number[] } | null;
          if (!analysis?.relatedIndicators) continue;
          const relatedInds = analysis.relatedIndicators.map(id => allIndicators3.find(i => i.id === id)).filter(Boolean);
          const hasRow = relatedInds.some(i => i!.category === rowDim);
          const hasCol = relatedInds.some(i => i!.category === colDim);
          if (hasRow && hasCol) chainCross++;
        }
        const rawValue = crossCount * 30 + chainCross * 5;
        matrix.push({ row: rowDim, col: colDim, value: Math.min(100, rawValue) });
      }
    }
  }

  return { dimensions, matrix };
}

// ========== v3.0: BACKTEST ==========

/**
 * P2-A: 因子回测模拟
 * 基于历史证据链的方向一致性回测
 */
export async function backtestEvidence(evidenceId: string) {
  const db = await getDb();
  if (!db) return null;

  const chain = await getEvidenceChain(evidenceId);
  if (!chain) return null;

  const analysis = chain.analysis as { relatedIndicators: number[]; confidence: number } | null;
  const impacts = chain.impacts as { symbol: string; direction: string }[] | null;
  if (!analysis || !impacts) return null;

  // 查找历史上触发相同指标的证据链
  const allChains = await db.select().from(evidenceChains).orderBy(desc(evidenceChains.id)).limit(100);
  const historicalMatches: { evidenceId: string; matchScore: number; direction: string; createdAt: Date }[] = [];

  for (const hChain of allChains) {
    if (hChain.evidenceId === evidenceId) continue;
    const hAnalysis = hChain.analysis as { relatedIndicators: number[] } | null;
    const hImpacts = hChain.impacts as { direction: string }[] | null;
    if (!hAnalysis?.relatedIndicators || !hImpacts) continue;

    // 计算指标重叠度
    const overlap = analysis.relatedIndicators.filter(id => hAnalysis.relatedIndicators.includes(id)).length;
    if (overlap === 0) continue;

    const matchScore = overlap / Math.max(analysis.relatedIndicators.length, hAnalysis.relatedIndicators.length);
    const dominantDir = hImpacts.reduce((acc, i) => {
      acc[i.direction] = (acc[i.direction] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const dir = Object.entries(dominantDir).sort((a, b) => b[1] - a[1])[0]?.[0] || "neutral";

    historicalMatches.push({
      evidenceId: hChain.evidenceId,
      matchScore: Math.round(matchScore * 100),
      direction: dir,
      createdAt: hChain.createdAt,
    });
  }

  // 计算分析一致性
  const currentDir = impacts.length > 0 ? impacts[0].direction : "neutral";
  const consistent = historicalMatches.filter(m => m.direction === currentDir).length;
  const consistencyRate = historicalMatches.length > 0 ? Math.round(consistent / historicalMatches.length * 100) : 0;

  return {
    evidenceId,
    currentDirection: currentDir,
    historicalMatches: historicalMatches.slice(0, 10),
    totalMatches: historicalMatches.length,
    consistencyRate,
    confidence: analysis.confidence,
    backtestVerdict: consistencyRate >= 60 ? "consistent" : consistencyRate >= 40 ? "mixed" : "divergent",
  };
}

// ========== v3.0: DISCOVERY ==========

/**
 * P0-A: 因子发现模式
 * 基于当前目标池状态，主动扫描潜在因子信号
 */
export async function buildDiscoverySummary() {
  const db = await getDb();
  if (!db) return null;

  const allCompanies2 = await db.select().from(companies).where(eq(companies.isActive, 1));
  const allIndicators4 = await db.select().from(indicators);
  const recentChains = await db.select().from(evidenceChains).orderBy(desc(evidenceChains.id)).limit(30);
  const templates = await db.select().from(factorTemplates).where(eq(factorTemplates.isActive, 1));

  // 构建发现上下文
  const triggeredIndicators = allIndicators4.filter(i => i.lastStatus === "triggered");
  const crossTriggered = triggeredIndicators.filter(i => i.crossDimension);
  const highWeightCompanies = allCompanies2.filter(c => c.weight >= 8);

  // 最近证据链摘要
  const recentSummaries = recentChains.slice(0, 5).map(c => {
    const a = c.analysis as { impactAssessment: string; confidence: number } | null;
    return {
      evidenceId: c.evidenceId,
      message: c.sourceMessage.substring(0, 100),
      assessment: a?.impactAssessment ?? "",
      confidence: a?.confidence ?? 0,
      createdAt: c.createdAt,
    };
  });

  return {
    poolSnapshot: {
      totalCompanies: allCompanies2.length,
      highWeightCount: highWeightCompanies.length,
      avgWeight: allCompanies2.length > 0 ? Math.round(allCompanies2.reduce((s, c) => s + c.weight, 0) / allCompanies2.length * 10) / 10 : 0,
    },
    indicatorSnapshot: {
      total: allIndicators4.length,
      triggered: triggeredIndicators.length,
      crossTriggered: crossTriggered.length,
      categories: Array.from(new Set(allIndicators4.map(i => i.category))),
    },
    recentActivity: recentSummaries,
    activeTemplates: templates.map(t => ({
      code: t.code,
      name: t.name,
      category: t.category,
      crossCategory: t.crossCategory,
      signalDefinition: t.signalDefinition,
      historicalWinRate: t.historicalWinRate,
    })),
    companySummary: allCompanies2.map(c => `${c.symbol} ${c.name} (${c.sector}, ${c.chainPosition}, W${c.weight})`).join("\n"),
    indicatorSummary: allIndicators4.map(i => `[${i.id}] ${i.name} (${i.category})${i.crossDimension ? ` ×${i.crossDimension}` : ""} [${i.lastStatus}]`).join("\n"),
  };
}

// ========== EVIDENCE ANALYSIS MAP ==========

export async function getLatestAnalysisForCompanies() {
  const db = await getDb();
  if (!db) return new Map<string, { evidenceId: string; direction: string; confidence: number; summary: string; triggeredFactors: number; createdAt: Date }>();
  
  // 获取最近 50 条证据链
  const recentChains = await db.select().from(evidenceChains).orderBy(desc(evidenceChains.id)).limit(50);
  
  const companyMap = new Map<string, { evidenceId: string; direction: string; confidence: number; summary: string; triggeredFactors: number; createdAt: Date }>();
  
  for (const chain of recentChains) {
    const impacts = chain.impacts as { symbol: string; direction: string }[] | null;
    const analysis = chain.analysis as { confidence: number; impactAssessment: string; relatedIndicators: number[] } | null;
    if (!impacts || !analysis) continue;
    
    for (const impact of impacts) {
      if (!companyMap.has(impact.symbol)) {
        companyMap.set(impact.symbol, {
          evidenceId: chain.evidenceId,
          direction: impact.direction,
          confidence: analysis.confidence,
          summary: analysis.impactAssessment,
          triggeredFactors: analysis.relatedIndicators?.length ?? 0,
          createdAt: chain.createdAt,
        });
      }
    }
  }
  
  return companyMap;
}

// ========== E1: SUBSCRIPTIONS ==========

export async function getSubscriptionsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
}

export async function getAllActiveSubscriptions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subscriptions).where(eq(subscriptions.isActive, 1));
}

export async function createSubscription(data: InsertSubscription) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(subscriptions).values(data);
}

export async function updateSubscription(id: number, data: Partial<InsertSubscription>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(subscriptions).set(data).where(eq(subscriptions.id, id));
}

export async function deleteSubscription(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(subscriptions).where(eq(subscriptions.id, id));
}

// ========== E1: PUSH NOTIFICATION ==========

/**
 * 异常检测 + 推送通知
 * 检测异常信号并向所有符合条件的订阅用户发送通知
 */
export async function detectAndNotify(analysisResult?: {
  evidenceId: string;
  impacts: { symbol: string; name: string; direction: string; oldWeight: number; newWeight: number }[];
  analysis: { impactAssessment: string; confidence: number; relatedIndicators: number[] };
}) {
  const anomalies = await detectAnomalies();
  if (anomalies.length === 0 && !analysisResult) return { sent: 0, anomalies: [] };

  const allSubs = await getAllActiveSubscriptions();
  const realtimeSubs = allSubs.filter(s => s.frequency === "realtime");

  let notificationsSent = 0;

  for (const sub of realtimeSubs) {
    // 检查是否匹配用户关注的公司和维度
    const watchCompanies = sub.watchCompanies as string[] | null;
    const watchDimensions = sub.watchDimensions as string[] | null;

    let relevantAnomalies = anomalies;
    if (watchCompanies && watchCompanies.length > 0) {
      relevantAnomalies = relevantAnomalies.filter(a => !a.symbol || watchCompanies.includes(a.symbol));
    }

    if (relevantAnomalies.length === 0 && !analysisResult) continue;

    // 构建推送内容
    const content = buildNotificationContent(relevantAnomalies, analysisResult);
    await sendNotification(sub.channel, sub.channelAddress as string, content);
    notificationsSent++;
  }

  return { sent: notificationsSent, anomalies };
}

function buildNotificationContent(
  anomalies: { type: string; severity: string; symbol?: string; name?: string; detail: string }[],
  analysisResult?: { evidenceId: string; impacts: { symbol: string; name: string; direction: string }[]; analysis: { impactAssessment: string } }
): { title: string; body: string } {
  const lines: string[] = [];
  const now = new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });

  if (analysisResult) {
    lines.push(`【新分析结果】${analysisResult.analysis.impactAssessment}`);
    for (const imp of analysisResult.impacts.slice(0, 5)) {
      const arrow = imp.direction === "up" ? "↑" : imp.direction === "down" ? "↓" : "→";
      lines.push(`  ${arrow} ${imp.name}(${imp.symbol})`);
    }
  }

  if (anomalies.length > 0) {
    lines.push(`\n【异常信号 ${anomalies.length} 个】`);
    for (const a of anomalies.slice(0, 5)) {
      const icon = a.severity === "high" ? "🚨" : a.severity === "medium" ? "⚠️" : "ℹ️";
      lines.push(`  ${icon} ${a.detail}`);
    }
  }

  lines.push(`\n————\nFangClaw 智能监控 | ${now}`);
  lines.push(`⚠️ 免责声明：本推送仅供参考，不构成投资建议。`);

  return {
    title: `FangClaw 异常信号提醒 (${anomalies.length} 个信号)`,
    body: lines.join("\n"),
  };
}

async function sendNotification(channel: string, address: string, content: { title: string; body: string }) {
  try {
    if (channel === "email") {
      // 使用内置通知 API 发送邮件
      const { notifyOwner } = await import("./_core/notification");
      await notifyOwner({ title: content.title, content: content.body });
    } else if (channel === "feishu") {
      // 飞书 Webhook
      await fetch(address, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          msg_type: "text",
          content: { text: `${content.title}\n\n${content.body}` },
        }),
      });
    } else if (channel === "wecom") {
      // 企业微信 Webhook
      await fetch(address, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          msgtype: "text",
          text: { content: `${content.title}\n\n${content.body}` },
        }),
      });
    }
  } catch (error) {
    console.error(`[Push] Failed to send ${channel} notification:`, error);
  }
}

// ========== E2: DAILY REPORTS ==========

export async function generateDailySummary() {
  const db = await getDb();
  if (!db) return null;

  const today = new Date().toISOString().slice(0, 10);
  const oneDayAgo = Date.now() - 86400000;

  // 今日权重变动 Top 5
  const recentLogs = await db.select().from(changeLogs)
    .where(sql`\`timestamp\` > ${oneDayAgo} AND action = 'weight'`)
    .orderBy(desc(changeLogs.id));

  const topMovers = recentLogs
    .filter(l => l.oldWeight !== null && l.newWeight !== null)
    .map(l => ({
      symbol: l.symbol || "",
      name: l.name || "",
      oldWeight: l.oldWeight!,
      newWeight: l.newWeight!,
    }))
    .sort((a, b) => Math.abs(b.newWeight - b.oldWeight) - Math.abs(a.newWeight - a.oldWeight))
    .slice(0, 5);

  // 今日触发的指标
  const allInds = await db.select().from(indicators);
  const triggeredIndicators = allInds
    .filter(i => i.lastStatus === "triggered")
    .map(i => ({ name: i.name, category: i.category }));

  // 今日新增证据链
  const todayChains = await db.select().from(evidenceChains)
    .where(sql`DATE(createdAt) = ${today}`)
    .orderBy(desc(evidenceChains.id));

  const evidenceSummary = todayChains.slice(0, 3).map(c => {
    const a = c.analysis as { impactAssessment: string } | null;
    return a?.impactAssessment || c.sourceMessage.substring(0, 80);
  }).join("; ");

  // 明日关注清单
  const highWeightCompanies = await db.select().from(companies)
    .where(sql`isActive = 1 AND weight >= 8`)
    .orderBy(desc(companies.weight));
  const tomorrowWatchlist = highWeightCompanies.slice(0, 5).map(c => `${c.name}(${c.symbol})`);

  const content = {
    topMovers,
    triggeredIndicators,
    newEvidenceCount: todayChains.length,
    evidenceSummary: evidenceSummary || "今日无新增证据链",
    tomorrowWatchlist,
    aiSummary: "",
  };

  // 存储报告
  try {
    await db.insert(dailyReports).values({
      reportDate: today,
      content,
      pushStatus: "pending",
    }).onDuplicateKeyUpdate({
      set: { content, pushStatus: "pending" },
    });
  } catch (e) {
    console.error("[DailyReport] Failed to save:", e);
  }

  return { reportDate: today, content };
}

export async function getDailyReport(date?: string) {
  const db = await getDb();
  if (!db) return null;
  const targetDate = date || new Date().toISOString().slice(0, 10);
  const result = await db.select().from(dailyReports).where(eq(dailyReports.reportDate, targetDate)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getRecentDailyReports(limit = 7) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dailyReports).orderBy(desc(dailyReports.reportDate)).limit(limit);
}

// ========== E6: TRIALS ==========

export async function createTrial(contact: string, contactType: "email" | "wechat") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await db.insert(trials).values({ contact, contactType, expiresAt });
  return { contact, contactType, expiresAt };
}

export async function getTrialByContact(contact: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(trials)
    .where(eq(trials.contact, contact))
    .orderBy(desc(trials.id))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getAllTrials() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(trials).orderBy(desc(trials.id));
}

// ========== E7: SHARE TOKENS ==========

export async function createShareToken(evidenceId: string, sharedBy?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const token = `SC${Date.now().toString(36)}${Math.random().toString(36).substring(2, 8)}`;
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  await db.insert(shareTokens).values({ token, evidenceId, sharedBy, expiresAt });
  return { token, evidenceId, expiresAt };
}

export async function getShareByToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(shareTokens)
    .where(eq(shareTokens.token, token))
    .limit(1);
  if (result.length === 0) return null;
  const share = result[0];
  // 检查是否过期
  if (share.expiresAt && new Date(share.expiresAt) < new Date()) return null;
  if (!share.isActive) return null;
  // 增加查看次数
  await db.update(shareTokens).set({ viewCount: (share.viewCount || 0) + 1 }).where(eq(shareTokens.id, share.id));
  return share;
}
