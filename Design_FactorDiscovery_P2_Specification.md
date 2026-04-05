# FangClaw 因子发现引擎 — P2 详细设计文档

**文档版本**：v1.0 | **日期**：2026-04-04 | **作者**：Manus AI

---

## 目录

1. P2-A：因子回测模拟（历史验证面板）
2. P2-B：因子热力矩阵（6×6 交叉维度热力图）
3. 附录：实施检查清单

---

## 1. P2-A：因子回测模拟

### 1.1 功能概述

在证据链详情页中增加"历史回测"区块。当用户查看某条 AI 分析的证据链时，系统自动回溯该分析涉及的因子在历史分析中的表现，展示"类似因子组合在过去的分析中产生了什么结论"。

**核心理念：** 因子发现引擎的核心是"假设生成→假设验证"。回测模拟就是验证环节——通过历史数据回答"这个因子组合以前靠谱吗？"。

**重要约束：** FangClaw 是投研看板而非量化交易系统，因此"回测"不是传统意义上的收益率回测，而是**分析一致性回测**——检验类似的因子组合在历史分析中是否产生了一致的方向判断。

### 1.2 回测逻辑设计

#### 1.2.1 回测维度

| 维度 | 定义 | 数据来源 |
|------|------|---------|
| 因子一致性 | 相同因子维度被触发时，历史分析的方向判断是否一致 | evidenceChains.analysis |
| 公司命中率 | 某公司被分析涉及时，后续权重变化是否与分析方向一致 | evidenceChains + changeLogs |
| 情景准确度 | 历史情景推演中，基准情景的实际发生率 | evidenceChains.analysis.scenarios |
| 因子衰减 | 某因子从首次触发到不再触发的平均时间跨度 | indicators + changeLogs |

#### 1.2.2 回测计算逻辑

```typescript
interface BacktestResult {
  // 因子一致性
  factorConsistency: {
    dimension: string;           // 因子维度
    totalAnalyses: number;       // 涉及该维度的历史分析总数
    consistentDirection: number; // 方向一致的次数
    consistencyRate: number;     // 一致率 (0-1)
  }[];

  // 公司命中率
  companyHitRate: {
    symbol: string;
    name: string;
    totalMentions: number;       // 被分析提及的总次数
    directionCorrect: number;    // 方向判断正确的次数（权重变化与判断一致）
    hitRate: number;             // 命中率 (0-1)
  }[];

  // 情景准确度
  scenarioAccuracy: {
    totalScenarios: number;      // 历史情景推演总数
    baseHitCount: number;        // 基准情景命中次数
    bullHitCount: number;        // 乐观情景命中次数
    bearHitCount: number;        // 悲观情景命中次数
    baseAccuracy: number;        // 基准情景准确率
  };

  // 因子衰减
  factorDecay: {
    dimension: string;
    avgActiveSpan: number;       // 平均活跃时间跨度（天）
    currentAge: number;          // 当前因子已活跃天数
    decayRisk: "high" | "medium" | "low"; // 衰减风险
  }[];

  // 综合评分
  overallScore: number;          // 0-100
  overallGrade: "A" | "B" | "C" | "D" | "F";
  summary: string;               // 综合评价
}
```

### 1.3 后端 API 设计

#### 1.3.1 新增查询函数：`runBacktest`

```typescript
// server/db.ts 新增
export async function runBacktest(evidenceId: string): Promise<BacktestResult> {
  // 1. 获取当前证据链
  const currentEvidence = await getEvidenceById(evidenceId);
  if (!currentEvidence) throw new Error("Evidence not found");

  // 2. 获取所有历史证据链
  const allEvidence = await getAllEvidenceChains();
  const historicalEvidence = allEvidence.filter(e => e.id !== evidenceId);

  // 3. 获取当前证据链涉及的因子维度
  const currentDimensions = extractDimensions(currentEvidence.analysis);

  // 4. 计算因子一致性
  const factorConsistency = currentDimensions.map(dim => {
    const relatedAnalyses = historicalEvidence.filter(e =>
      extractDimensions(e.analysis).includes(dim)
    );
    const totalAnalyses = relatedAnalyses.length;
    const consistentDirection = relatedAnalyses.filter(e =>
      getDirection(e.analysis) === getDirection(currentEvidence.analysis)
    ).length;
    return {
      dimension: dim,
      totalAnalyses,
      consistentDirection,
      consistencyRate: totalAnalyses > 0 ? consistentDirection / totalAnalyses : 0,
    };
  });

  // 5. 计算公司命中率
  const affectedCompanies = currentEvidence.analysis?.affectedCompanies ?? [];
  const companyHitRate = affectedCompanies.map((ac: any) => {
    const mentions = historicalEvidence.filter(e =>
      e.analysis?.affectedCompanies?.some((c: any) => c.symbol === ac.symbol)
    );
    const directionCorrect = mentions.filter(e => {
      // 检查该分析后，公司权重是否按预期方向变化
      const predictedDirection = getCompanyDirection(e.analysis, ac.symbol);
      const actualChange = getWeightChangeAfter(ac.symbol, e.createdAt);
      return (predictedDirection === "up" && actualChange > 0) ||
             (predictedDirection === "down" && actualChange < 0);
    }).length;
    return {
      symbol: ac.symbol,
      name: ac.name,
      totalMentions: mentions.length,
      directionCorrect,
      hitRate: mentions.length > 0 ? directionCorrect / mentions.length : 0,
    };
  });

  // 6. 计算情景准确度（基于历史情景推演）
  const scenariosHistory = historicalEvidence
    .filter(e => e.analysis?.scenarios)
    .map(e => e.analysis.scenarios);
  // ... 统计逻辑 ...

  // 7. 计算因子衰减
  // ... 基于 indicators 的 updatedAt 计算 ...

  // 8. 综合评分
  const avgConsistency = average(factorConsistency.map(f => f.consistencyRate));
  const avgHitRate = average(companyHitRate.map(c => c.hitRate));
  const overallScore = Math.round(avgConsistency * 50 + avgHitRate * 50);
  const overallGrade = overallScore >= 80 ? "A" : overallScore >= 60 ? "B" :
                       overallScore >= 40 ? "C" : overallScore >= 20 ? "D" : "F";

  return {
    factorConsistency,
    companyHitRate,
    scenarioAccuracy: { /* ... */ },
    factorDecay: [],
    overallScore,
    overallGrade,
    summary: generateBacktestSummary(overallScore, factorConsistency, companyHitRate),
  };
}
```

#### 1.3.2 新增接口：`evidence.backtest`

```typescript
backtest: publicProcedure
  .input(z.object({ evidenceId: z.string() }))
  .query(async ({ input }) => {
    return await runBacktest(input.evidenceId);
  }),
```

### 1.4 前端组件规格

#### 1.4.1 EvidenceDetail 页面新增"历史回测"区块

在证据链详情页的"情景推演"区块之后、"验证清单"之前，插入回测区块：

```
┌─ 📊 历史回测 Historical Backtest ────────────────┐
│                                                   │
│  综合评分                                          │
│  ┌──────────────────────────────────────────────┐ │
│  │        ████████████████████░░░░  78/100  B   │ │
│  │  本次分析的因子组合在历史中表现良好，方向判断  │ │
│  │  一致性较高，但公司命中率有待提升。            │ │
│  └──────────────────────────────────────────────┘ │
│                                                   │
│  ┌─ 因子一致性 ─────────────────────────────────┐ │
│  │ 维度          历史分析  方向一致  一致率      │ │
│  │ 基本面        8         6         75%        │ │
│  │ 事件驱动      5         4         80%        │ │
│  │ 技术面        3         2         67%        │ │
│  └──────────────────────────────────────────────┘ │
│                                                   │
│  ┌─ 公司命中率 ─────────────────────────────────┐ │
│  │ 公司          提及次数  方向正确  命中率      │ │
│  │ 寒武纪        4         3         75%        │ │
│  │ 海光信息      3         2         67%        │ │
│  │ NVIDIA        6         5         83%        │ │
│  └──────────────────────────────────────────────┘ │
│                                                   │
│  ⚠ 回测基于有限历史分析记录，仅供参考             │
└───────────────────────────────────────────────────┘
```

#### 1.4.2 组件结构

```tsx
function BacktestSection({ evidenceId }: { evidenceId: string }) {
  const backtestQuery = trpc.evidence.backtest.useQuery({ evidenceId });

  if (backtestQuery.isLoading) return <BacktestSkeleton />;
  if (!backtestQuery.data) return null;

  const bt = backtestQuery.data;

  return (
    <section>
      {/* 综合评分卡片 */}
      <OverallScoreCard score={bt.overallScore} grade={bt.overallGrade} summary={bt.summary} />

      {/* 因子一致性表格 */}
      <ConsistencyTable data={bt.factorConsistency} />

      {/* 公司命中率表格 */}
      <HitRateTable data={bt.companyHitRate} />

      {/* 免责声明 */}
      <Disclaimer text="回测基于有限历史分析记录，仅供参考，不构成投资建议。" />
    </section>
  );
}
```

### 1.5 测试规格

```typescript
describe("evidence.backtest", () => {
  it("应返回包含 overallScore 和 overallGrade 的结果");
  it("factorConsistency 的 consistencyRate 应在 0-1 之间");
  it("companyHitRate 的 hitRate 应在 0-1 之间");
  it("overallGrade 应根据 overallScore 正确分级");
  it("evidenceId 不存在时应返回错误");
  it("历史数据不足时应返回合理的默认值");
});
```

---

## 2. P2-B：因子热力矩阵

### 2.1 功能概述

在六维因子页面中增加一个 6×6 的交叉维度热力图。横轴和纵轴分别是六个因子维度（基本面、技术面、资金行为、事件驱动、情绪面、替代数据），每个交叉格子的颜色深度表示两个维度之间的**共振强度**——即两个维度的指标同时被触发的频率。

**核心理念：** 因子发现引擎强调"交叉因子"的价值。热力矩阵让用户一眼看到哪些维度之间存在强共振，从而发现潜在的交叉因子机会。

### 2.2 共振强度计算逻辑

#### 2.2.1 共振定义

两个因子维度 A 和 B 的共振强度定义为：

```
Resonance(A, B) = 在所有历史分析中，A 维度和 B 维度同时被提及的次数 / 总分析次数

其中"被提及"的判定：
- 分析结果的 reasoning_steps 中包含该维度相关的关键词
- 或 affectedCompanies 中涉及该维度的指标
```

#### 2.2.2 共振强度等级

| 共振值 | 等级 | 颜色 | 含义 |
|--------|------|------|------|
| ≥ 0.7 | 强共振 | 深青色 (#00D4AA) | 两个维度高度关联，可能存在稳定的交叉因子 |
| 0.4-0.7 | 中共振 | 中青色 (#00D4AA80) | 两个维度有一定关联，值得关注 |
| 0.1-0.4 | 弱共振 | 浅青色 (#00D4AA30) | 两个维度偶尔关联 |
| < 0.1 | 无共振 | 深色背景 (#0A0F1A) | 两个维度几乎独立 |

#### 2.2.3 对角线含义

对角线上的值表示该维度自身的活跃度（活跃指标数 / 总指标数），用不同颜色标注。

### 2.3 数据结构设计

```typescript
interface HeatmapData {
  dimensions: string[];           // 六个维度名称
  matrix: number[][];             // 6×6 共振矩阵 (0-1)
  highlights: {
    dimA: string;
    dimB: string;
    resonance: number;
    insight: string;              // AI 生成的洞察
  }[];
  metadata: {
    totalAnalyses: number;        // 用于计算的总分析数
    timeRange: string;            // 数据时间范围
    lastUpdated: string;          // 最后更新时间
  };
}
```

### 2.4 后端 API 设计

#### 2.4.1 新增查询函数：`calculateFactorHeatmap`

```typescript
// server/db.ts 新增
export async function calculateFactorHeatmap(): Promise<HeatmapData> {
  const dimensions = ["基本面", "技术面", "资金行为", "事件驱动", "情绪面", "替代数据"];
  const evidenceChains = await getAllEvidenceChains();
  const indicators = await getAllIndicators();

  // 初始化 6×6 矩阵
  const matrix: number[][] = dimensions.map(() => dimensions.map(() => 0));
  const coOccurrence: number[][] = dimensions.map(() => dimensions.map(() => 0));

  // 统计每条证据链中各维度的共现
  for (const ec of evidenceChains) {
    const mentionedDims = new Set<number>();

    // 从 reasoning_steps 中提取涉及的维度
    const steps = ec.analysis?.reasoning_steps ?? [];
    for (const step of steps) {
      const stepText = JSON.stringify(step).toLowerCase();
      dimensions.forEach((dim, idx) => {
        if (containsDimensionKeywords(stepText, dim)) {
          mentionedDims.add(idx);
        }
      });
    }

    // 统计共现
    const dimArray = Array.from(mentionedDims);
    for (let i = 0; i < dimArray.length; i++) {
      for (let j = i; j < dimArray.length; j++) {
        coOccurrence[dimArray[i]][dimArray[j]]++;
        if (i !== j) coOccurrence[dimArray[j]][dimArray[i]]++;
      }
    }
  }

  // 计算共振强度
  const totalAnalyses = evidenceChains.length;
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 6; j++) {
      matrix[i][j] = totalAnalyses > 0 ? coOccurrence[i][j] / totalAnalyses : 0;
    }
  }

  // 对角线：使用维度活跃度
  dimensions.forEach((dim, idx) => {
    const dimIndicators = indicators.filter(ind => ind.category === dim);
    const activeCount = dimIndicators.filter(ind => ind.status === "活跃").length;
    matrix[idx][idx] = dimIndicators.length > 0 ? activeCount / dimIndicators.length : 0;
  });

  // 生成高亮洞察
  const highlights: HeatmapData["highlights"] = [];
  for (let i = 0; i < 6; i++) {
    for (let j = i + 1; j < 6; j++) {
      if (matrix[i][j] >= 0.4) {
        highlights.push({
          dimA: dimensions[i],
          dimB: dimensions[j],
          resonance: matrix[i][j],
          insight: generateResonanceInsight(dimensions[i], dimensions[j], matrix[i][j]),
        });
      }
    }
  }

  return {
    dimensions,
    matrix,
    highlights,
    metadata: {
      totalAnalyses,
      timeRange: `最近 ${totalAnalyses} 次分析`,
      lastUpdated: new Date().toISOString(),
    },
  };
}

function containsDimensionKeywords(text: string, dimension: string): boolean {
  const keywordMap: Record<string, string[]> = {
    "基本面": ["营收", "利润", "毛利", "净利", "ROE", "PE", "PB", "估值", "财报", "业绩", "基本面"],
    "技术面": ["均线", "MACD", "RSI", "KDJ", "成交量", "突破", "支撑", "阻力", "技术面", "形态"],
    "资金行为": ["北向", "融资", "融券", "主力", "资金流", "大单", "机构", "资金行为", "持仓"],
    "事件驱动": ["政策", "监管", "发布", "公告", "事件", "新闻", "制裁", "补贴", "事件驱动"],
    "情绪面": ["情绪", "恐慌", "贪婪", "舆情", "社交", "KOL", "散户", "情绪面", "市场情绪"],
    "替代数据": ["卫星", "招聘", "专利", "物流", "供应链", "替代数据", "另类数据", "爬虫"],
  };
  const keywords = keywordMap[dimension] ?? [];
  return keywords.some(kw => text.includes(kw));
}

function generateResonanceInsight(dimA: string, dimB: string, resonance: number): string {
  if (resonance >= 0.7) {
    return `${dimA}与${dimB}存在强共振（${(resonance*100).toFixed(0)}%），两个维度的信号经常同时出现，可能存在稳定的交叉因子。`;
  }
  return `${dimA}与${dimB}存在中等共振（${(resonance*100).toFixed(0)}%），值得关注两者的交叉信号。`;
}
```

#### 2.4.2 新增接口：`indicators.heatmap`

```typescript
heatmap: publicProcedure.query(async () => {
  return await calculateFactorHeatmap();
}),
```

### 2.5 前端组件规格

#### 2.5.1 热力矩阵组件

在 IndicatorFramework 组件中，六维因子卡片网格下方增加热力矩阵：

```
┌─ 🔥 因子热力矩阵 Factor Resonance Matrix ────────┐
│                                                   │
│  基于 12 次历史分析的维度共振强度                   │
│                                                   │
│         基本面  技术面  资金  事件  情绪  替代     │
│  基本面  ■0.75  ■0.45  ■0.30 ■0.60 ■0.15 ■0.05  │
│  技术面  ■0.45  ■0.80  ■0.55 ■0.20 ■0.35 ■0.10  │
│  资金    ■0.30  ■0.55  ■0.70 ■0.40 ■0.25 ■0.08  │
│  事件    ■0.60  ■0.20  ■0.40 ■0.65 ■0.50 ■0.12  │
│  情绪    ■0.15  ■0.35  ■0.25 ■0.50 ■0.60 ■0.20  │
│  替代    ■0.05  ■0.10  ■0.08 ■0.12 ■0.20 ■0.30  │
│                                                   │
│  ■ 强共振(≥70%)  ■ 中共振(40-70%)  ■ 弱共振(<40%) │
│                                                   │
│  💡 洞察:                                          │
│  • 基本面×事件驱动 共振 60%：政策事件经常影响基本面 │
│  • 技术面×资金行为 共振 55%：资金流向与技术信号同步 │
└───────────────────────────────────────────────────┘
```

#### 2.5.2 组件实现

```tsx
function FactorHeatmap() {
  const heatmapQuery = trpc.indicators.heatmap.useQuery();

  if (heatmapQuery.isLoading) return <HeatmapSkeleton />;
  if (!heatmapQuery.data) return null;

  const { dimensions, matrix, highlights, metadata } = heatmapQuery.data;

  // 颜色映射函数
  const getColor = (value: number, isDiagonal: boolean) => {
    if (isDiagonal) {
      // 对角线用不同色系表示活跃度
      return `rgba(59, 130, 246, ${0.2 + value * 0.8})`; // 蓝色系
    }
    if (value >= 0.7) return "rgba(0, 212, 170, 0.9)";   // 强共振 - 深青
    if (value >= 0.4) return "rgba(0, 212, 170, 0.5)";   // 中共振 - 中青
    if (value >= 0.1) return "rgba(0, 212, 170, 0.2)";   // 弱共振 - 浅青
    return "rgba(10, 15, 26, 0.8)";                       // 无共振 - 深色
  };

  return (
    <div className="border border-border/30 bg-card/20 p-4">
      <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
        🔥 因子热力矩阵
        <span className="text-[10px] text-muted-foreground font-data">
          FACTOR RESONANCE MATRIX
        </span>
        <span className="text-xs text-muted-foreground ml-auto font-data">
          基于 {metadata.totalAnalyses} 次分析
        </span>
      </h3>

      {/* 6×6 网格 */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {/* 空角 */}
        <div />
        {/* 列标题 */}
        {dimensions.map(dim => (
          <div key={dim} className="text-[10px] text-center text-muted-foreground font-data truncate">
            {dim.slice(0, 3)}
          </div>
        ))}
        {/* 行 */}
        {dimensions.map((rowDim, i) => (
          <>
            <div key={`row-${i}`} className="text-[10px] text-right text-muted-foreground font-data pr-1 flex items-center justify-end">
              {rowDim.slice(0, 3)}
            </div>
            {dimensions.map((_, j) => (
              <div
                key={`cell-${i}-${j}`}
                className="aspect-square flex items-center justify-center text-[9px] font-data cursor-pointer hover:ring-1 hover:ring-fang-cyan/50 transition-all"
                style={{ backgroundColor: getColor(matrix[i][j], i === j) }}
                title={`${dimensions[i]} × ${dimensions[j]}: ${(matrix[i][j]*100).toFixed(0)}%`}
              >
                {(matrix[i][j] * 100).toFixed(0)}
              </div>
            ))}
          </>
        ))}
      </div>

      {/* 图例 */}
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground mb-3">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3" style={{ backgroundColor: "rgba(0, 212, 170, 0.9)" }} /> 强共振(≥70%)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3" style={{ backgroundColor: "rgba(0, 212, 170, 0.5)" }} /> 中共振(40-70%)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3" style={{ backgroundColor: "rgba(0, 212, 170, 0.2)" }} /> 弱共振(&lt;40%)
        </span>
      </div>

      {/* 洞察 */}
      {highlights.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold text-foreground flex items-center gap-1">
            💡 共振洞察
          </h4>
          {highlights.map((h, idx) => (
            <p key={idx} className="text-xs text-muted-foreground leading-relaxed">
              <span className="text-fang-cyan font-semibold">{h.dimA}×{h.dimB}</span>{" "}
              共振 {(h.resonance * 100).toFixed(0)}%：{h.insight}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 2.6 测试规格

```typescript
describe("indicators.heatmap", () => {
  it("应返回 6×6 的矩阵");
  it("矩阵应是对称的（matrix[i][j] === matrix[j][i]）");
  it("所有值应在 0-1 之间");
  it("对角线值应反映维度活跃度");
  it("highlights 应只包含共振值 ≥ 0.4 的维度对");
  it("metadata.totalAnalyses 应等于实际证据链数量");
});

describe("evidence.backtest", () => {
  it("应返回包含 overallScore 和 overallGrade 的结果");
  it("factorConsistency 的 consistencyRate 应在 0-1 之间");
  it("companyHitRate 的 hitRate 应在 0-1 之间");
  it("overallGrade 应根据 overallScore 正确分级");
  it("evidenceId 不存在时应返回错误");
});
```

---

## 附录 C：P2 实施检查清单

| 序号 | 任务 | 文件 | 状态 |
|------|------|------|------|
| C-1 | 新增 `runBacktest` 函数 | server/db.ts | [ ] |
| C-2 | 新增 `evidence.backtest` 接口 | server/routers.ts | [ ] |
| C-3 | EvidenceDetail 页面增加回测区块 | client/src/pages/EvidenceDetail.tsx | [ ] |
| C-4 | 实现综合评分卡片组件 | client/src/pages/EvidenceDetail.tsx | [ ] |
| C-5 | 实现因子一致性表格 | client/src/pages/EvidenceDetail.tsx | [ ] |
| C-6 | 实现公司命中率表格 | client/src/pages/EvidenceDetail.tsx | [ ] |
| C-7 | 新增 `calculateFactorHeatmap` 函数 | server/db.ts | [ ] |
| C-8 | 新增 `indicators.heatmap` 接口 | server/routers.ts | [ ] |
| C-9 | 实现 `containsDimensionKeywords` 关键词映射 | server/db.ts | [ ] |
| C-10 | IndicatorFramework 增加热力矩阵组件 | client/src/components/IndicatorFramework.tsx | [ ] |
| C-11 | 实现颜色映射和图例 | client/src/components/IndicatorFramework.tsx | [ ] |
| C-12 | 实现共振洞察展示 | client/src/components/IndicatorFramework.tsx | [ ] |
| C-13 | 编写 P2 Vitest 测试 | server/factor-p2.test.ts | [ ] |
| C-14 | 运行全量测试确认无回归 | - | [ ] |

---

## 附录 D：三份设计文档总览

| 文档 | 文件名 | 功能模块 | 预估工时 |
|------|--------|---------|---------|
| P0 设计文档 | Design_FactorDiscovery_P0_Specification.md | 因子发现模式 + 交叉因子标签 | 4-5h |
| P1 设计文档 | Design_FactorDiscovery_P1_Specification.md | 十大因子模板 + 异常信号 + 拥挤度动态计算 | 8-10h |
| P2 设计文档 | Design_FactorDiscovery_P2_Specification.md | 因子回测模拟 + 因子热力矩阵 | 6-8h |

**总预估工时**：18-23 小时

**实施顺序建议**：P0-A → P0-B → P1-C → P1-B → P1-A → P2-B → P2-A

**理由**：
1. P0-A（因子发现模式）和 P0-B（交叉因子标签）是基础能力，其他功能依赖它们
2. P1-C（拥挤度动态计算）是纯计算逻辑，独立性强，可以快速完成
3. P1-B（异常信号）依赖证据链数据，在 P0 完成后数据更丰富
4. P1-A（十大因子模板）是最复杂的功能，需要 P0 的基础
5. P2-B（热力矩阵）依赖历史分析数据，在 P0/P1 完成后效果更好
6. P2-A（因子回测）是最后的验证环节，需要足够的历史数据积累
