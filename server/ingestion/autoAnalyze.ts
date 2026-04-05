import { invokeLLM } from "../_core/llm";
import {
  addChangeLog,
  addEvidenceChain,
  detectAndNotify,
  getAllCompanies,
  getAllIndicators,
  updateCompanyWeight,
  updateIndicatorStatusV3,
} from "../db";
import type { MixedModeDecision } from "./types";
import { shouldApplyImpacts } from "./relevance";

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

const ECON_LOGIC_CHECK = `
经济学逻辑检验（每次分析必须执行）：
1. 因果方向检验：确认因→果的方向是否符合经济学常识（例如"需求增加→价格上涨"而非反向）
2. 传导路径检验：确认影响的传导路径是否合理（例如"上游涨价→中游成本压力→下游提价"）
3. 时间尺度检验：确认影响的时间尺度是否合理（政策效果通常滞后1-2个季度）
4. 反身性检验：考虑市场预期是否已经price-in了该信息
`;

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

const COUNTER_ARGUMENT_RULES = `
反对论点要求（认知增强，防止认知债务）：
对于每个分析结论，必须同时提供反对论点（Devil's Advocate）：
1. 为什么这个分析可能是错的？（至少给出1个反对理由）
2. 哪些假设可能不成立？
3. 有没有被忽略的反面证据？
这样做的目的是帮助用户保持独立判断力，而非盲目依赖AI分析。
`;

const NON_OBVIOUS_RULES = `
非显而易见关联发现（Non-Obvious Correlation Discovery）：
当发现跨维度交叉因子时，必须回答以下问题：
1. 为什么这个关联不是显而易见的？（即普通投资者为什么会忽略它）
2. 这个关联的经济学传导机制是什么？
3. 历史上是否有类似的关联模式出现过？
这是 FangClaw 的核心价值——帮助用户发现"你不知道你不知道的"（unknown unknowns）。
`;

const DISCLAIMER_ZH = "⚠️ 免责声明：FangClaw 系统提供的所有分析结果仅供研究参考，不构成任何投资建议。投资有风险，决策需谨慎。系统基于 AI 模型和公开信息进行分析，可能存在偏差或错误。用户应结合自身判断和专业顾问意见做出投资决策。";

type DimScore = {
  score: number;
  direction: "up" | "down" | "neutral";
  brief: string;
};

type ParsedAnalysis = {
  summary: string;
  entities: string[];
  relatedIndicators: number[];
  impacts: { symbol: string; name: string; weightDelta: number; direction: "up" | "down" | "neutral"; reason: string }[];
  impactAssessment: string;
  confidence: number;
  reasoning: string;
  counterArgument: string;
  macroRegime: "expansion" | "contraction" | "policy_pivot" | "liquidity_squeeze" | "stagflation";
  nonObviousInsight: string;
  verificationQuestions: string[];
  dimensionScores: {
    fundamental: DimScore;
    technical: DimScore;
    flow: DimScore;
    catalyst: DimScore;
    sentiment: DimScore;
    alternative: DimScore;
  };
  scenarios: { name: string; nameEn: string; probability: number; description: string; trigger: string; poolImpact: string }[];
};

type ExecuteAnalysisInput = {
  message: string;
  sourceType: string;
  sourceUrl?: string | null;
  decisionMode?: MixedModeDecision | "auto";
};

export async function executeCausalAnalysis(input: ExecuteAnalysisInput) {
  const currentCompanies = await getAllCompanies();
  const currentIndicators = await getAllIndicators();

  const companySummary = currentCompanies.map(c =>
    `${c.symbol} ${c.name} (${c.sector}, ${c.chainPosition}, 权重${c.weight})`
  ).join("\n");

  const indicatorSummary = currentIndicators.map(i =>
    `[${i.id}] ${i.name} (${i.category})${i.crossDimension ? ` ×${i.crossDimension}` : ""}: ${i.threshold}`
  ).join("\n");

  const systemPrompt = `你是 StockClaw 智能投研系统的因果分析引擎——Agent Swarm 认知增强平台的核心组件。你的任务是分析一条市场消息，判断它对当前公司池中哪些公司产生影响，以及触发了哪些监控指标。

当前公司池（${currentCompanies.length}家）：
${companySummary}

当前监控指标（${currentIndicators.length}个，标注了交叉维度）：
${indicatorSummary}

${A_SHARE_RULES}

${ECON_LOGIC_CHECK}

${MACRO_REGIME_RULES}

${COUNTER_ARGUMENT_RULES}

${NON_OBVIOUS_RULES}

分析规则：
1. 仔细阅读消息内容，识别涉及的实体（公司、技术、政策等）
2. 判断消息对公司池中哪些公司有影响（正面/负面/中性）
3. 判断触发了哪些监控指标（注意交叉维度标注）
4. 对受影响的公司给出权重调整建议（-3到+3之间的整数）
5. 生成3个线下验证问题，帮助投资者进一步确认
6. 给出整体置信度评分（0-100）
7. 【重要】对于每个分析结论，同时给出反对论点（counterArgument字段）
8. 如果发现跨维度交叉因子，解释为什么这个关联不是显而易见的
9. 【重要】生成3种情景推演：
   - 基准情景（Base Case）：最可能发生的情况，概率最高
   - 乐观情景（Bull Case）：最有利的发展路径
   - 悲观情景（Bear Case）：最不利的发展路径
   每种情景需要给出概率（三种概率之和必须等于100）、描述、触发条件和对整个目标池的影响
10. 【重要】六维因子评分（dimensionScores）：你需要以“蜂群智能”的方式，分别从6个维度独立评估本条消息的影响：
   - fundamental（基本面）
   - technical（技术面）
   - flow（资金行为）
   - catalyst（事件驱动）
   - sentiment（情绪）
   - alternative（替代数据）

你必须严格按照 JSON Schema 格式返回结果。权重调整必须有充分理由。如果消息与公司池无关，impacts 数组为空。`;

  const llmResult = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `请分析以下市场消息：\n\n"${input.message}"` },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "causal_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            entities: { type: "array", items: { type: "string" } },
            relatedIndicators: { type: "array", items: { type: "number" } },
            impacts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  symbol: { type: "string" },
                  name: { type: "string" },
                  weightDelta: { type: "number" },
                  direction: { type: "string", enum: ["up", "down", "neutral"] },
                  reason: { type: "string" },
                },
                required: ["symbol", "name", "weightDelta", "direction", "reason"],
                additionalProperties: false,
              },
            },
            impactAssessment: { type: "string" },
            confidence: { type: "number" },
            reasoning: { type: "string" },
            counterArgument: { type: "string" },
            macroRegime: { type: "string", enum: ["expansion", "contraction", "policy_pivot", "liquidity_squeeze", "stagflation"] },
            nonObviousInsight: { type: "string" },
            verificationQuestions: { type: "array", items: { type: "string" } },
            dimensionScores: {
              type: "object",
              properties: {
                fundamental: { type: "object", properties: { score: { type: "number" }, direction: { type: "string", enum: ["up", "down", "neutral"] }, brief: { type: "string" } }, required: ["score", "direction", "brief"], additionalProperties: false },
                technical: { type: "object", properties: { score: { type: "number" }, direction: { type: "string", enum: ["up", "down", "neutral"] }, brief: { type: "string" } }, required: ["score", "direction", "brief"], additionalProperties: false },
                flow: { type: "object", properties: { score: { type: "number" }, direction: { type: "string", enum: ["up", "down", "neutral"] }, brief: { type: "string" } }, required: ["score", "direction", "brief"], additionalProperties: false },
                catalyst: { type: "object", properties: { score: { type: "number" }, direction: { type: "string", enum: ["up", "down", "neutral"] }, brief: { type: "string" } }, required: ["score", "direction", "brief"], additionalProperties: false },
                sentiment: { type: "object", properties: { score: { type: "number" }, direction: { type: "string", enum: ["up", "down", "neutral"] }, brief: { type: "string" } }, required: ["score", "direction", "brief"], additionalProperties: false },
                alternative: { type: "object", properties: { score: { type: "number" }, direction: { type: "string", enum: ["up", "down", "neutral"] }, brief: { type: "string" } }, required: ["score", "direction", "brief"], additionalProperties: false },
              },
              required: ["fundamental", "technical", "flow", "catalyst", "sentiment", "alternative"],
              additionalProperties: false,
            },
            scenarios: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  nameEn: { type: "string" },
                  probability: { type: "number" },
                  description: { type: "string" },
                  trigger: { type: "string" },
                  poolImpact: { type: "string" },
                },
                required: ["name", "nameEn", "probability", "description", "trigger", "poolImpact"],
                additionalProperties: false,
              },
            },
          },
          required: ["summary", "entities", "relatedIndicators", "impacts", "impactAssessment", "confidence", "reasoning", "counterArgument", "macroRegime", "nonObviousInsight", "verificationQuestions", "dimensionScores", "scenarios"],
          additionalProperties: false,
        },
      },
    },
  });

  const analysisText = llmResult.choices[0]?.message?.content;
  if (!analysisText || typeof analysisText !== "string") {
    throw new Error("AI 分析返回结果为空");
  }

  const analysis = JSON.parse(analysisText) as ParsedAnalysis;
  const now = Date.now();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const evidenceId = `EC-${dateStr}-${randomSuffix}`;
  const proposedImpacts = analysis.impacts.filter(impact =>
    currentCompanies.some(company => company.symbol === impact.symbol)
  );
  const decision: MixedModeDecision = input.decisionMode === "auto"
    ? (shouldApplyImpacts({ confidence: analysis.confidence, impacts: proposedImpacts }) ? "full_apply" : "observe_only")
    : (input.decisionMode ?? "full_apply");

  const appliedImpacts: { symbol: string; name: string; oldWeight: number; newWeight: number; direction: "up" | "down" | "neutral"; reason: string }[] = [];

  if (decision === "full_apply") {
    for (const impact of proposedImpacts) {
      const company = currentCompanies.find(c => c.symbol === impact.symbol);
      if (!company) continue;

      const oldWeight = company.weight;
      const newWeight = Math.max(1, Math.min(10, oldWeight + impact.weightDelta));

      if (newWeight !== oldWeight) {
        await updateCompanyWeight(impact.symbol, newWeight);
        await addChangeLog({
          timestamp: now,
          action: "weight",
          symbol: impact.symbol,
          name: impact.name,
          message: `权重调整: ${oldWeight} → ${newWeight} (${impact.weightDelta > 0 ? "+" : ""}${impact.weightDelta})`,
          reason: impact.reason,
          evidenceId,
          oldWeight,
          newWeight,
        });
        appliedImpacts.push({ symbol: impact.symbol, name: impact.name, oldWeight, newWeight, direction: impact.direction, reason: impact.reason });
      }
    }

    for (const indicatorId of analysis.relatedIndicators) {
      const indicator = currentIndicators.find(i => i.id === indicatorId);
      if (indicator) {
        await updateIndicatorStatusV3(indicatorId, "triggered");
      }
    }
  }

  await addEvidenceChain({
    evidenceId,
    sourceMessage: input.message,
    sourceType: input.sourceType,
    sourceUrl: input.sourceUrl ?? null,
    sourceTimestamp: now,
    analysis: {
      entities: analysis.entities,
      relatedIndicators: analysis.relatedIndicators,
      impactAssessment: analysis.impactAssessment,
      confidence: analysis.confidence,
      reasoning: analysis.reasoning,
      scenarios: analysis.scenarios,
      decision,
      proposedImpacts,
    } as any,
    impacts: appliedImpacts,
    verificationQuestions: analysis.verificationQuestions,
  });

  await addChangeLog({
    timestamp: now,
    action: "analysis",
    message: decision === "full_apply"
      ? `AI 分析完成: "${analysis.summary}" — 落地 ${appliedImpacts.length} 家公司`
      : `自动巡检记录候选证据链: "${analysis.summary}"`,
    reason: analysis.impactAssessment,
    evidenceId,
  });

  if (decision === "full_apply") {
    try {
      await detectAndNotify({
        evidenceId,
        impacts: appliedImpacts,
        analysis: {
          impactAssessment: analysis.impactAssessment,
          confidence: analysis.confidence,
          relatedIndicators: analysis.relatedIndicators,
        },
      });
    } catch (error) {
      console.error("[Push] Failed to send notifications after analyze:", error);
    }
  }

  const confidenceLevel: "high" | "medium" | "low" = analysis.confidence >= 75 ? "high" : analysis.confidence >= 45 ? "medium" : "low";

  return {
    evidenceId,
    summary: analysis.summary,
    entities: analysis.entities,
    relatedIndicators: analysis.relatedIndicators.map(id => {
      const indicator = currentIndicators.find(item => item.id === id);
      return indicator ? { id: indicator.id, name: indicator.name, category: indicator.category } : { id, name: "未知", category: "未知" };
    }),
    impacts: appliedImpacts,
    proposedImpacts,
    impactAssessment: analysis.impactAssessment,
    confidence: analysis.confidence,
    confidenceLevel,
    reasoning: analysis.reasoning,
    counterArgument: analysis.counterArgument,
    macroRegime: analysis.macroRegime,
    nonObviousInsight: analysis.nonObviousInsight,
    verificationQuestions: analysis.verificationQuestions,
    dimensionScores: analysis.dimensionScores ?? {
      fundamental: { score: 5, direction: "neutral" as const, brief: "数据不足" },
      technical: { score: 5, direction: "neutral" as const, brief: "数据不足" },
      flow: { score: 5, direction: "neutral" as const, brief: "数据不足" },
      catalyst: { score: 5, direction: "neutral" as const, brief: "数据不足" },
      sentiment: { score: 5, direction: "neutral" as const, brief: "数据不足" },
      alternative: { score: 5, direction: "neutral" as const, brief: "数据不足" },
    },
    scenarios: analysis.scenarios,
    totalCompaniesAffected: appliedImpacts.length,
    signalType: "analysis" as const,
    disclaimer: DISCLAIMER_ZH,
    decision,
  };
}
