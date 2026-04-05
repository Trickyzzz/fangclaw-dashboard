# FangClaw v2.3 — P0/P1/P2 详细设计文档

**版本**：v1.0 | **日期**：2026-04-04 | **作者**：Manus AI

---

## 目录

1. [P0-A：六维因子网格卡片](#p0-a六维因子网格卡片)
2. [P0-B：情景推演模块](#p0-b情景推演模块)
3. [P1-A：迷你行动卡](#p1-a迷你行动卡)
4. [P1-B：关键变量监控](#p1-b关键变量监控)
5. [P2-A：目标池热力图](#p2-a目标池热力图)
6. [P2-B：推理可视化](#p2-b推理可视化)

---

## P0-A：六维因子网格卡片

### 1. 设计目标

将当前"六维因子"Tab 从扁平的指标列表升级为 **2×3 网格卡片**布局，每张卡片代表一个因子维度（基本面/技术面/资金行为/事件驱动/情绪/替代数据），让用户一眼看到六个维度的健康度，然后按需深入。

### 2. 设计原理

**为什么网格卡片比列表更好？**

当前 IndicatorFramework 组件将 20 个指标以扁平列表展示，用户需要逐个浏览才能了解整体状况。这违反了"先总览后细节"的信息架构原则。AION 的因子证据网格（2×4 卡片）证明了网格布局在因子展示场景中的优越性：用户可以在 3 秒内扫描所有维度的健康度，然后点击感兴趣的维度深入查看。

**信息密度对比：**

| 维度 | 当前列表模式 | 网格卡片模式 |
|------|------------|------------|
| 首屏信息量 | 3-4 个指标的详情 | 6 个维度的健康度总览 |
| 定位速度 | 需滚动查找 | 一眼定位 |
| 状态感知 | 逐个查看 triggered/normal | 颜色编码 + 触发比例 |

### 3. 数据来源

**已有数据（无需新增 API）：**
- `indicators` 表包含 `category` 字段，可按维度分组
- `lastStatus` 字段标识 normal/triggered 状态
- 前端 `useIndicators()` hook 已返回完整指标列表

**维度与 category 的映射关系：**

| 六维因子 | 对应 category | 指标数量 |
|---------|--------------|---------|
| 基本面 | 微观/公司 | 5 个（#9-#13） |
| 技术面 | 因子/量价 | 4 个（#14-#17） |
| 资金行为 | 因子/量价（资金类）| 与技术面共享 category |
| 事件驱动 | 事件/催化 | 3 个（#18-#20） |
| 情绪 | 宏观/政策（部分） | 与宏观共享 |
| 替代数据 | 中观/行业 | 4 个（#5-#8） |

**注意**：当前 category 分类（宏观/政策、中观/行业、微观/公司、因子/量价、事件/催化）与 PPT 六维因子（基本面/技术面/资金行为/事件驱动/情绪/替代数据）并不完全对应。设计方案采用**前端映射**策略，在组件中定义 category → 六维因子的映射表，不修改数据库。

### 4. 前端组件规格

**组件名**：`FactorGridCard`（新增）

**卡片内容：**
- 维度名称 + 英文名（如"基本面 Fundamental"）
- 颜色标识圆点
- 触发数/总数（如"2/5 触发"）
- 健康度进度条（基于触发比例：0% 触发 = 满绿，100% 触发 = 满红）
- 一句话当前状态描述（根据触发比例动态生成）

**布局**：2 列 × 3 行网格（`grid grid-cols-2 gap-3`），在移动端降级为 1 列

**交互**：点击卡片展开该维度下的具体指标列表（复用现有 IndicatorCard 组件）

### 5. 实现步骤

1. 在 IndicatorFramework.tsx 顶部新增 `CATEGORY_TO_FACTOR` 映射表
2. 新增 `FactorGridCard` 子组件
3. 将现有的 badge 区域替换为 2×3 网格
4. 点击卡片时设置 `catFilter` 为对应 category，滚动到指标列表

---

## P0-B：情景推演模块

### 1. 设计目标

在认知引擎的 AI 分析结果中增加**"情景推演"区块**，将 AI 输出从"确定性结论"升级为"概率化多路径分析"。每次分析输出三种情景：基准（Base）、乐观（Bull）、悲观（Bear），每种情景包含概率、描述和触发条件。

### 2. 设计原理

**为什么情景推演比单一结论更好？**

当前认知引擎输出一个置信度和一组权重调整，这是"确定性"输出。但市场消息的影响往往是多路径的——同一条消息在不同条件下可能产生截然不同的结果。AION 的四情景模型（基准 54%/看多 24%/看空 16%/黑天鹅 6%）证明了概率化思维在投研场景中的价值。

**FangClaw 的适配差异：** AION 的情景推演针对单只个股的价格走势，FangClaw 的情景推演针对**整个主题/目标池**的影响路径。例如，输入"美国收紧半导体出口管制"时，三种情景分别描述对 AI 算力/半导体链整体的不同影响路径。

### 3. 数据结构变更

**后端 LLM prompt 修改**（routers.ts）：

在 `causal.analyze` 的 JSON Schema 中新增 `scenarios` 字段：

```typescript
scenarios: {
  type: "array",
  items: {
    type: "object",
    properties: {
      name: { type: "string", description: "情景名称（基准/乐观/悲观）" },
      probability: { type: "number", description: "概率（0-100）" },
      description: { type: "string", description: "情景描述（2-3句话）" },
      trigger: { type: "string", description: "触发条件" },
      poolImpact: { type: "string", description: "对目标池的整体影响" },
    },
    required: ["name", "probability", "description", "trigger", "poolImpact"],
    additionalProperties: false,
  },
  description: "三种情景推演（基准/乐观/悲观）",
}
```

**数据库**：不需要新增表。scenarios 数据存储在 `evidenceChains.analysis` JSON 字段中。需要更新 schema.ts 中 analysis 的 TypeScript 类型定义，增加可选的 `scenarios` 字段。

**前端类型**：在 api.ts 的 `EvidenceChain.analysis` 类型中增加 `scenarios` 可选字段。

### 4. 前端组件规格

**位置**：CausalAnalysis.tsx 的结果区域，在"推理过程"和"线下验证清单"之间插入

**布局**：3 列网格（`grid grid-cols-3 gap-3`），每列一个情景卡片

**卡片内容：**
- 情景名称 + 概率标签（如"基准 54%"）
- 颜色编码：基准=蓝色、乐观=绿色、悲观=红色
- 情景描述（2-3 句话）
- 触发条件（灰色小字）
- 对目标池的影响（底部）

**同步更新**：EvidenceDetail.tsx 证据链详情页也需要展示 scenarios 数据

### 5. 实现步骤

1. 修改 routers.ts 中 `causal.analyze` 的 LLM prompt 和 JSON Schema
2. 更新 drizzle/schema.ts 中 analysis 的 TypeScript 类型
3. 更新 api.ts 中 EvidenceChain 的类型定义
4. 在 CausalAnalysis.tsx 中新增 ScenarioCards 子组件
5. 在 EvidenceDetail.tsx 中新增情景推演展示区块
6. 更新 causal.test.ts 中的 mock 数据和断言

---

## P1-A：迷你行动卡

### 1. 设计目标

在目标池的公司列表展开行中，为每家公司增加一个**迷你行动卡**，展示 AI 综合评级、最近分析方向信号和因子触发数量，让用户在不离开列表视图的情况下快速识别"哪些股票需要立刻关注"。

### 2. 设计原理

**为什么迷你行动卡比标签更好？**

当前展开行只显示标签（如"A股""AI芯片"）和加入时间，信息密度极低。交易者面对 30 只股票的列表时，最需要的是快速识别优先级。AION 的核心行动卡（BUY/SELL 信号 + 84.6/100 评分）证明了在列表视图中嵌入决策信号的价值。

**FangClaw 的适配差异：** AION 给出精确的 BUY/SELL 信号，FangClaw 作为看板不适合给出交易信号，但可以展示"AI 关注度"——即该公司最近被 AI 分析提及的频率和方向。

### 3. 数据来源

**需要新增后端接口：**

```typescript
// 新增 router: companies.actionCard
companies.actionCard: publicProcedure
  .input(z.object({ symbol: z.string() }))
  .query(async ({ input }) => {
    // 1. 查询该公司最近一条证据链中的 impact
    // 2. 统计该公司在最近 N 条证据链中被提及的次数
    // 3. 计算综合评级（基于最近分析的 confidence 和 direction）
    return {
      lastDirection: "up" | "down" | "neutral" | null,
      lastConfidence: number | null,
      lastEvidenceId: string | null,
      mentionCount: number,  // 最近 20 条证据链中被提及次数
      factorTriggered: number,  // 当前触发的因子数
      factorTotal: number,
    };
  })
```

**需要新增 db.ts 查询函数：**

```typescript
// 获取某公司最近一次被 AI 分析影响的记录
export async function getCompanyLatestImpact(symbol: string)

// 统计某公司在最近 N 条证据链中被提及的次数
export async function getCompanyMentionCount(symbol: string, limit: number)
```

### 4. 前端组件规格

**位置**：CompanyPool.tsx 的展开行（`expanded` 区域）

**布局**：在现有标签区域下方新增一行，包含 3 个迷你信息块

**内容：**
- **AI 评级**：圆形评分环（基于最近分析 confidence，如 78/100）+ 方向箭头
- **分析频率**：最近被提及次数（如"近期提及 3 次"）
- **因子触发**：触发的因子数/总数（如"2/6 因子触发"）

**交互**：点击评级区域跳转到最近一条证据链详情页

### 5. 实现步骤

1. 在 db.ts 中新增 `getCompanyLatestImpact` 和 `getCompanyMentionCount` 函数
2. 在 routers.ts 中新增 `companies.actionCard` 接口
3. 在 api.ts 中新增 `useCompanyActionCard(symbol)` hook
4. 在 CompanyPool.tsx 的展开行中新增 MiniActionCard 子组件
5. 编写测试

---

## P1-B：关键变量监控

### 1. 设计目标

在风控面板中增加**"关键变量监控"表格**，展示当前主题（AI 算力/半导体链）的 5-8 个可能改变整体判断的外部关键变量，每个变量标注当前状态、触发方向和操作建议。

### 2. 设计原理

**为什么关键变量比内部指标更重要？**

当前风控面板的四个 RiskCard（因子拥挤度、指标触发预警、产业链集中度、权重分布健康度）都是基于目标池自身数据计算的**内部指标**。但真正影响投资决策的往往是**外部变量**——政策变化、利率走势、产能数据等。AION 的关键变量监控表格（台厂 CapEx、10Y 实际利率、HBM 封装良率、IV-HV 利差）证明了外部变量监控在投研场景中的核心价值。

### 3. 数据结构变更

**新增数据库表**（drizzle/schema.ts）：

```typescript
export const keyVariables = mysqlTable("keyVariables", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  nameEn: varchar("nameEn", { length: 100 }),
  currentStatus: text("currentStatus").notNull(),
  direction: mysqlEnum("direction", ["bullish", "bearish", "neutral"]).notNull(),
  suggestion: text("suggestion").notNull(),
  category: varchar("category", { length: 50 }),
  importance: mysqlEnum("importance", ["high", "medium", "low"]).default("medium").notNull(),
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
  isActive: int("isActive").notNull().default(1),
});
```

**种子数据**（seed.mjs 新增）：

| 变量名 | 当前状态 | 方向 | 建议 |
|--------|---------|------|------|
| 北向资金半导体板块净流入 | 连续 3 日净流入 | bullish | 维持高权重标的，关注资金流向变化 |
| 美国对华半导体出口管制 | 近期有收紧预期 | bearish | 降低上游设备类权重，关注国产替代 |
| 台积电先进制程产能利用率 | 95%（高位运行） | bullish | 利好晶圆代工和封测环节 |
| 10Y 国债收益率 | 2.85%（上行趋势） | neutral | 关注利率对成长股估值的压制 |
| AI 芯片需求增速 | 同比 +120% | bullish | 核心驱动力，维持 AI 芯片龙头高权重 |
| HBM 封装良率 | 良率持续提升至 85% | bullish | 利好封测环节，关注长电科技 |

### 4. 后端 API

```typescript
// 新增 router
keyVariables: router({
  list: publicProcedure.query(async () => {
    return getAllKeyVariables();
  }),
  update: publicProcedure
    .input(z.object({
      id: z.number(),
      currentStatus: z.string().optional(),
      direction: z.enum(["bullish", "bearish", "neutral"]).optional(),
      suggestion: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return updateKeyVariable(input);
    }),
})
```

### 5. 前端组件规格

**位置**：RiskPanel.tsx，在四个 RiskCard 下方、行为金融干预之前

**布局**：全宽表格，每行一个变量

**表格列**：
- 变量名（左对齐，加粗）
- 当前状态（灰色文字）
- 触发方向（颜色编码标签：bullish=绿、bearish=红、neutral=灰）
- 操作建议（右侧文字）

**颜色编码**：
- bullish：绿色背景标签 `bg-fang-green/10 text-fang-green`
- bearish：红色背景标签 `bg-fang-red/10 text-fang-red`
- neutral：灰色背景标签

### 6. 实现步骤

1. 在 schema.ts 中新增 `keyVariables` 表
2. 运行 `pnpm db:push` 同步数据库
3. 在 seed.mjs 中新增关键变量种子数据并执行
4. 在 db.ts 中新增 `getAllKeyVariables` 和 `updateKeyVariable` 函数
5. 在 routers.ts 中新增 `keyVariables` router
6. 在 api.ts 中新增 `useKeyVariables()` hook
7. 在 RiskPanel.tsx 中新增 KeyVariablesTable 子组件
8. 编写测试

---

## P2-A：目标池热力图

### 1. 设计目标

在态势大屏（StatsPanel）中增加一个**目标池气泡图**，用可视化方式展示 30 只股票的"健康度分布"，让用户一眼看到整个目标池的状态。

### 2. 设计原理

**为什么气泡图比条形图更好？**

当前态势大屏只有文字统计和简单的 MiniBar 条形图，缺乏一个能让用户**一眼看到整个目标池状态**的全局可视化。气泡图可以在一个视图中同时展示三个维度的信息（X=权重、Y=产业链位置、气泡大小=变更频率），信息密度远高于条形图。

### 3. 数据来源

**需要新增后端接口：**

```typescript
// 新增 router: companies.heatmapData
companies.heatmapData: publicProcedure.query(async () => {
  // 返回每家公司的：symbol, name, weight, chainPosition, changeCount（最近变更次数）
  return getCompanyHeatmapData();
})
```

**需要新增 db.ts 查询函数：**

```typescript
export async function getCompanyHeatmapData() {
  // 1. 查询所有活跃公司
  // 2. 统计每家公司在 changeLogs 中的出现次数
  // 3. 返回合并数据
}
```

### 4. 前端组件规格

**位置**：StatsPanel.tsx，在"产业链分布"和"指标分类"之间插入

**技术选型**：使用项目已有的 `recharts` 库（ScatterChart 组件），通过 `client/src/components/ui/chart.tsx` 的 ChartContainer 封装

**图表规格：**
- X 轴：权重（1-10），标签"权重"
- Y 轴：产业链位置（上游=3、中游=2、下游=1），标签"产业链"
- 气泡大小：变更频率（0-N 次），最小 8px，最大 24px
- 气泡颜色：产业链位置（上游=#00D4AA、中游=#3B82F6、下游=#F59E0B）
- Tooltip：悬停显示公司名、权重、变更次数

**尺寸**：宽度 100%（侧边栏宽度），高度 180px

### 5. 实现步骤

1. 在 db.ts 中新增 `getCompanyHeatmapData` 函数
2. 在 routers.ts 中新增 `companies.heatmapData` 接口
3. 在 api.ts 中新增 `useCompanyHeatmap()` hook
4. 在 StatsPanel.tsx 中新增 PortfolioHeatmap 子组件（使用 recharts ScatterChart）
5. 编写测试

---

## P2-B：推理可视化

### 1. 设计目标

将证据链详情页的"推理过程"从纯文本升级为**因果链流程图**，用节点和箭头可视化展示"消息 → 实体 → 影响路径 → 受影响公司"的完整因果链。

### 2. 设计原理

**为什么流程图比文本更好？**

当前推理过程是一段纯文本，用箭头符号分隔步骤。对于简单的因果链（如"消息 → 1 家公司"）文本足够，但对于复杂的因果链（如"消息 → 3 个实体 → 5 家公司"）文本难以展示因果关系的分支和汇聚。可视化推理图能让用户**一眼看到因果链的结构**。

### 3. 技术方案

**方案选择**：使用纯 CSS + HTML 实现简化版因果链流程图（不引入 D3.js 或其他重型库），保持项目轻量。

**流程图结构**：

```
[消息输入] → [识别实体 A] → [影响公司 X (W+2)]
                            → [影响公司 Y (W-1)]
             [识别实体 B] → [影响公司 Z (W+1)]
```

**节点类型：**
- **源节点**（蓝色）：消息输入
- **实体节点**（青色）：识别到的实体
- **公司节点**（绿/红色）：受影响的公司 + 权重变化

### 4. 前端组件规格

**组件名**：`CausalFlowChart`（新增）

**位置**：EvidenceDetail.tsx，替换现有的纯文本推理过程区域

**布局**：水平流程图，从左到右展示因果链

**节点样式：**
- 源节点：`bg-fang-cyan/10 border-fang-cyan/30`，显示消息摘要
- 实体节点：`bg-fang-amber/10 border-fang-amber/30`，显示实体名称
- 公司节点：方向为 up 时 `bg-fang-green/10 border-fang-green/30`，down 时 `bg-fang-red/10 border-fang-red/30`

**连线**：使用 CSS `::after` 伪元素绘制水平和垂直连线

**降级方案**：当因果链过于复杂（实体 > 5 或公司 > 8）时，降级为现有的文本模式

### 5. 实现步骤

1. 新增 `CausalFlowChart` 组件
2. 在 EvidenceDetail.tsx 中替换推理过程区域
3. 处理降级逻辑（复杂因果链回退文本模式）
4. 编写测试

---

## 实现顺序与依赖关系

```
P0-A（六维因子网格）  ← 纯前端，无依赖
P0-B（情景推演）      ← 修改 LLM prompt + 前端
P1-A（迷你行动卡）    ← 新增后端接口 + 前端
P1-B（关键变量监控）  ← 新增数据库表 + 后端 + 前端 + 种子数据
P2-A（目标池热力图）  ← 新增后端接口 + recharts 可视化
P2-B（推理可视化）    ← 纯前端组件
```

**建议实现顺序**：P0-A → P0-B → P1-B（先建表） → P1-A → P2-A → P2-B

---

## 风险与注意事项

1. **P0-B 情景推演**：LLM 输出的概率数字不应被视为精确预测，前端需要加上免责声明
2. **P1-A 迷你行动卡**：批量查询 30 家公司的 actionCard 数据可能有性能问题，建议使用批量查询接口而非逐个查询
3. **P1-B 关键变量**：初始版本为手动维护，后续可通过 AI 分析历史证据链自动提取
4. **P2-A 热力图**：侧边栏宽度有限（w-80 = 320px），气泡图需要精心调整尺寸
5. **P2-B 推理可视化**：纯 CSS 方案在复杂因果链下可能布局混乱，需要设置降级阈值
