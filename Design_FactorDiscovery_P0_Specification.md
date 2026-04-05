# FangClaw 因子发现引擎 — P0 详细设计文档

**文档版本**：v1.0 | **日期**：2026-04-04 | **作者**：Manus AI

---

## 目录

1. P0-A：因子发现模式（认知引擎升级）
2. P0-B：交叉因子标签（六维因子增强）

---

## 1. P0-A：因子发现模式

### 1.1 功能概述

在认知引擎中增加第二种分析模式——"因子发现"模式。与现有的"消息分析"模式（用户输入一条消息 → AI 分析因果链）不同，因子发现模式让系统**主动从数据库历史数据中交叉比对，自动发现异常模式**。

**核心理念转变：** 从"用户告诉系统该关注什么"到"系统告诉用户该关注什么"。

### 1.2 用户交互流程

```
┌─────────────────────────────────────────────────────────┐
│  认知引擎 Cognitive Engine                               │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │ 📝 消息分析  │  │ 🔍 因子发现  │  ← 模式切换按钮     │
│  └──────────────┘  └──────────────┘                     │
│                                                         │
│  [因子发现模式激活时]                                     │
│                                                         │
│  扫描范围：  ○ 全部目标池  ○ 指定公司 [▼ 选择公司]       │
│  分析深度：  ○ 快速扫描    ○ 深度分析                    │
│                                                         │
│  [ 🔍 开始发现 ]                                         │
│                                                         │
│  ─── 发现结果 ───────────────────────────────────────    │
│                                                         │
│  ┌─ 异常模式 #1 ──────────────────────────────────┐     │
│  │ 🔴 权重趋势-分析频率背离                        │     │
│  │                                                │     │
│  │ 模式描述：寒武纪在最近 5 次分析中被提及 4 次，  │     │
│  │ 但权重仅从 8 升到 10（已达上限），可能存在       │     │
│  │ "权重天花板效应"——实际关注度远超权重所能反映。  │     │
│  │                                                │     │
│  │ 涉及公司：寒武纪(688256)、海光信息(688041)      │     │
│  │ 交叉维度：基本面 × 事件驱动                     │     │
│  │ 历史频率：3/5 次分析中出现                      │     │
│  │ 建议关注度：⬆ 高                               │     │
│  │                                                │     │
│  │ [查看证据链] [深入分析]                          │     │
│  └────────────────────────────────────────────────┘     │
│                                                         │
│  ┌─ 异常模式 #2 ──────────────────────────────────┐     │
│  │ 🟡 产业链传导滞后                               │     │
│  │ ...                                            │     │
│  └────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

### 1.3 数据结构设计

#### 1.3.1 请求参数

```typescript
// tRPC 输入 Schema
const discoverInput = z.object({
  scope: z.enum(["all", "company"]),          // 扫描范围
  companyId: z.number().optional(),            // 指定公司时的 ID
  depth: z.enum(["quick", "deep"]).default("quick"), // 分析深度
});
```

#### 1.3.2 响应数据结构

```typescript
interface DiscoveryResult {
  patterns: DiscoveredPattern[];   // 发现的异常模式列表
  scanSummary: {
    companiesScanned: number;      // 扫描的公司数
    evidenceChainsAnalyzed: number; // 分析的证据链数
    changeLogsAnalyzed: number;    // 分析的变更日志数
    scanDuration: string;          // 扫描耗时
  };
}

interface DiscoveredPattern {
  id: string;                      // 模式唯一标识（UUID）
  name: string;                    // 模式名称（中文，如"权重趋势-分析频率背离"）
  severity: "high" | "medium" | "low"; // 严重程度
  description: string;             // 模式描述（2-3 句话）
  involvedCompanies: {             // 涉及的公司
    symbol: string;
    name: string;
    role: string;                  // 在该模式中的角色
  }[];
  crossDimensions: string[];       // 交叉的因子维度
  historicalFrequency: string;     // 历史出现频率（如"3/5 次分析中出现"）
  suggestedAttention: "high" | "medium" | "low"; // 建议关注度
  reasoning: string;               // 推理过程
  actionSuggestion: string;        // 建议的下一步行动
}
```

### 1.4 后端 API 设计

#### 1.4.1 新增 tRPC 接口：`causal.discover`

```typescript
// server/routers.ts 新增
discover: protectedProcedure
  .input(z.object({
    scope: z.enum(["all", "company"]),
    companyId: z.number().optional(),
    depth: z.enum(["quick", "deep"]).default("quick"),
  }))
  .mutation(async ({ input, ctx }) => {
    // 1. 收集历史数据
    const companies = await getAllCompanies();
    const changeLogs = await getChangeLogs(50);  // 最近 50 条变更
    const evidenceChains = await getAllEvidenceChains(); // 所有证据链
    const indicators = await getAllIndicators();

    // 2. 如果指定公司，过滤相关数据
    let targetCompanies = companies;
    if (input.scope === "company" && input.companyId) {
      targetCompanies = companies.filter(c => c.id === input.companyId);
      // 同时过滤相关的变更日志和证据链
    }

    // 3. 构建数据摘要发送给 LLM
    const dataSummary = buildDiscoverySummary(
      targetCompanies, changeLogs, evidenceChains, indicators
    );

    // 4. 调用 LLM 进行交叉分析
    const response = await invokeLLM({
      messages: [
        { role: "system", content: DISCOVERY_SYSTEM_PROMPT },
        { role: "user", content: dataSummary },
      ],
      response_format: {
        type: "json_schema",
        json_schema: DISCOVERY_RESPONSE_SCHEMA,
      },
    });

    // 5. 解析并返回结果
    return JSON.parse(response.choices[0].message.content);
  }),
```

#### 1.4.2 数据摘要构建函数

```typescript
// server/db.ts 新增
function buildDiscoverySummary(
  companies: Company[],
  changeLogs: ChangeLog[],
  evidenceChains: EvidenceChain[],
  indicators: Indicator[]
): string {
  return `
## 目标池概况
共 ${companies.length} 家公司，权重范围 ${minWeight}-${maxWeight}。
产业链分布：上游 ${upstream} 家，中游 ${midstream} 家，下游 ${downstream} 家。

## 权重变化历史（最近 ${changeLogs.length} 条）
${changeLogs.map(log =>
  `${log.timestamp} | ${log.company_name} | ${log.field}: ${log.old_value}→${log.new_value} | 原因: ${log.reason}`
).join('\n')}

## 证据链历史（共 ${evidenceChains.length} 条）
${evidenceChains.map(ec =>
  `${ec.created_at} | 触发消息: ${ec.trigger_message.substring(0, 100)} | 影响公司: ${ec.affected_companies.join(',')} | 方向: ${ec.analysis.direction}`
).join('\n')}

## 六维因子指标状态
${indicators.map(i =>
  `${i.category} | ${i.name} | 权重: ${i.weight} | 状态: ${i.status}`
).join('\n')}

请基于以上数据，进行交叉比对分析，发现异常模式。
  `;
}
```

### 1.5 LLM Prompt 设计

#### 1.5.1 System Prompt

```
你是 FangClaw 因子发现引擎。你的任务是从多维数据中交叉比对，自动发现"不该出现的模式"——即异常信号。

你需要关注以下五类交叉模式：

1. **权重-频率背离**：某公司被频繁分析但权重变化不大，或很少被分析但权重剧烈变化
2. **产业链传导异常**：上游公司权重集体上升但中/下游未跟随，或反向传导
3. **因子维度集中**：最近的分析过度集中在某一两个因子维度，忽略了其他维度
4. **方向信号矛盾**：同一公司在不同分析中收到矛盾的方向信号（先看多后看空）
5. **沉默公司异常**：某些公司长期未被分析提及，但其产业链位置或标签暗示应该被关注

分析规则：
- 每个异常模式必须基于数据中的具体证据，不能凭空捏造
- 每个模式必须涉及至少一家具体公司
- 按严重程度排序输出（high > medium > low）
- 最多输出 5 个异常模式
- 如果数据量不足以发现有意义的模式，诚实说明
```

#### 1.5.2 JSON Schema

```json
{
  "name": "discovery_result",
  "strict": true,
  "schema": {
    "type": "object",
    "properties": {
      "patterns": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "id": { "type": "string", "description": "UUID 格式的唯一标识" },
            "name": { "type": "string", "description": "模式名称，中文，10字以内" },
            "severity": { "type": "string", "enum": ["high", "medium", "low"] },
            "description": { "type": "string", "description": "模式描述，2-3句话" },
            "involvedCompanies": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "symbol": { "type": "string" },
                  "name": { "type": "string" },
                  "role": { "type": "string", "description": "该公司在模式中的角色" }
                },
                "required": ["symbol", "name", "role"],
                "additionalProperties": false
              }
            },
            "crossDimensions": {
              "type": "array",
              "items": { "type": "string" },
              "description": "涉及的因子维度名称"
            },
            "historicalFrequency": { "type": "string" },
            "suggestedAttention": { "type": "string", "enum": ["high", "medium", "low"] },
            "reasoning": { "type": "string", "description": "推理过程，3-5句话" },
            "actionSuggestion": { "type": "string", "description": "建议的下一步行动" }
          },
          "required": ["id", "name", "severity", "description", "involvedCompanies",
                       "crossDimensions", "historicalFrequency", "suggestedAttention",
                       "reasoning", "actionSuggestion"],
          "additionalProperties": false
        }
      },
      "scanSummary": {
        "type": "object",
        "properties": {
          "companiesScanned": { "type": "integer" },
          "evidenceChainsAnalyzed": { "type": "integer" },
          "changeLogsAnalyzed": { "type": "integer" },
          "totalPatternsFound": { "type": "integer" },
          "dataQualityNote": { "type": "string", "description": "数据质量说明" }
        },
        "required": ["companiesScanned", "evidenceChainsAnalyzed",
                     "changeLogsAnalyzed", "totalPatternsFound", "dataQualityNote"],
        "additionalProperties": false
      }
    },
    "required": ["patterns", "scanSummary"],
    "additionalProperties": false
  }
}
```

### 1.6 前端组件规格

#### 1.6.1 CausalAnalysis 组件改造

**模式切换区域：**
- 在组件顶部增加两个 Tab 按钮："📝 消息分析" 和 "🔍 因子发现"
- 默认选中"消息分析"（保持现有行为不变）
- 切换到"因子发现"时，输入区域替换为扫描配置面板

**扫描配置面板：**
- 扫描范围选择器：Radio 按钮组（"全部目标池" / "指定公司"）
- 公司选择器：当选择"指定公司"时显示下拉选择框，数据来自 `useCompanies()`
- 分析深度选择器：Radio 按钮组（"快速扫描" / "深度分析"）
- "开始发现"按钮：点击触发 `causal.discover` mutation

**发现结果展示：**
- 扫描摘要卡片：显示扫描了多少公司、分析了多少证据链、发现了多少模式
- 异常模式卡片列表：每个模式一张卡片，包含：
  - 左侧色条：severity 对应颜色（high=红、medium=黄、low=蓝）
  - 模式名称（加粗，16px）
  - 模式描述（14px，灰色）
  - 涉及公司标签组
  - 交叉维度标签组
  - 历史频率和建议关注度
  - 底部操作按钮："查看证据链" / "深入分析"

#### 1.6.2 样式规格

```css
/* 异常模式卡片 */
.pattern-card {
  border-left: 3px solid var(--severity-color);
  background: rgba(6, 10, 19, 0.6);
  padding: 16px 20px;
  margin-bottom: 12px;
}

/* severity 颜色映射 */
--severity-high: #EF4444;    /* fang-red */
--severity-medium: #F59E0B;  /* fang-amber */
--severity-low: #3B82F6;     /* blue */

/* 交叉维度标签 */
.cross-dimension-tag {
  font-size: 11px;
  padding: 2px 8px;
  background: rgba(0, 212, 170, 0.08);
  border: 1px solid rgba(0, 212, 170, 0.15);
  color: rgba(0, 212, 170, 0.7);
}
```

### 1.7 测试规格

```typescript
describe("causal.discover", () => {
  it("应返回包含 patterns 和 scanSummary 的结构化结果");
  it("scope=company 时应只分析指定公司的相关数据");
  it("patterns 中每个模式应包含 involvedCompanies");
  it("scanSummary.companiesScanned 应等于目标池公司数");
  it("当数据量不足时 dataQualityNote 应包含提示");
});
```

---

## 2. P0-B：交叉因子标签

### 2.1 功能概述

在现有的六维因子框架中增加"交叉因子"标签，标注哪些指标是跨维度交叉产生的。同时在六维因子网格卡片中增加"交叉因子数"的展示。

**核心理念：** 单维度因子的价值有限，跨维度交叉因子才是真正的 Alpha 来源。

### 2.2 数据库变更

#### 2.2.1 indicators 表新增字段

```sql
ALTER TABLE indicators ADD COLUMN cross_dimension VARCHAR(50) DEFAULT NULL;
```

**字段说明：**
- `cross_dimension`：该指标交叉的另一个维度名称。`NULL` 表示单维度指标。
- 例如：指标"北向资金流向"属于"资金行为"维度，如果它与"基本面"维度交叉，则 `cross_dimension = '基本面'`。

#### 2.2.2 Drizzle Schema 变更

```typescript
// drizzle/schema.ts 修改
export const indicators = mysqlTable("indicators", {
  // ... 现有字段 ...
  crossDimension: varchar("cross_dimension", { length: 50 }),  // 新增
});
```

#### 2.2.3 种子数据更新

以下 8 个指标标注为交叉因子：

| 指标名称 | 所属维度 | 交叉维度 | 交叉逻辑说明 |
|---------|---------|---------|-------------|
| 北向资金流向 | 资金行为 | 基本面 | 聪明钱先知——北向资金异常增持 × 财报发布日期 |
| 融资余额变化 | 资金行为 | 技术面 | 杠杆资金 × 价格趋势背离 |
| 行业政策动向 | 事件驱动 | 基本面 | 政策传导链——政策发布 × 产业链受益分析 |
| 管理层变动 | 事件驱动 | 情绪/舆情 | 管理层变动 × 市场情绪反应 |
| 社交媒体热度 | 情绪/舆情 | 技术面 | 舆情-价格背离——情绪极端 × 价格走势 |
| 分析师评级变化 | 情绪/舆情 | 基本面 | 评级调整 × 财务数据验证 |
| 专利申请数据 | 替代数据 | 基本面 | 另类数据 × 传统财务——研发投入验证 |
| 供应链数据 | 替代数据 | 事件驱动 | 供应链异常 × 行业事件关联 |

### 2.3 后端 API 变更

无需新增接口。现有的 `indicators.list` 接口返回的数据中自动包含 `crossDimension` 字段。

需要更新 `getAllIndicators()` 查询函数确保返回新字段。

### 2.4 前端组件变更

#### 2.4.1 IndicatorFramework 组件改造

**六维因子网格卡片增强：**
- 每个维度卡片底部增加一行："交叉因子 N 个"
- 交叉因子数 > 0 时显示特殊颜色标签（fang-amber）

**指标列表增强：**
- 交叉因子的指标行增加一个"×"标签，显示交叉维度名称
- 标签样式：小型 pill 标签，背景色 `rgba(245, 158, 11, 0.1)`，边框色 `rgba(245, 158, 11, 0.2)`，文字色 `#F59E0B`

#### 2.4.2 交互规格

```
指标行示例：

  北向资金流向    ×基本面    W8    ████████░░  活跃
  └─ 单维度标签    └─ 交叉标签   └─ 权重条    └─ 状态

点击交叉标签 → 高亮两个相关维度的网格卡片（0.3s 过渡动画）
```

#### 2.4.3 样式规格

```css
/* 交叉因子标签 */
.cross-factor-tag {
  font-size: 10px;
  padding: 1px 6px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.2);
  color: #F59E0B;
  font-family: 'JetBrains Mono', monospace;
}

/* 网格卡片中的交叉因子计数 */
.cross-count {
  font-size: 11px;
  color: #F59E0B;
  opacity: 0.8;
}
```

### 2.5 api.ts 类型更新

```typescript
// 更新 Indicator 类型
export interface Indicator {
  // ... 现有字段 ...
  crossDimension: string | null;  // 新增
}
```

### 2.6 测试规格

```typescript
describe("交叉因子标签", () => {
  it("indicators.list 应返回 crossDimension 字段");
  it("crossDimension 为 null 的指标不应显示交叉标签");
  it("种子数据中应有 8 个指标标注了交叉维度");
});
```

---

## 附录 A：P0 实施检查清单

| 序号 | 任务 | 文件 | 状态 |
|------|------|------|------|
| A-1 | 新增 `causal.discover` 接口 | server/routers.ts | [ ] |
| A-2 | 新增 `buildDiscoverySummary` 函数 | server/db.ts | [ ] |
| A-3 | 编写因子发现 LLM System Prompt | server/routers.ts | [ ] |
| A-4 | 编写因子发现 JSON Schema | server/routers.ts | [ ] |
| A-5 | CausalAnalysis 增加模式切换 UI | client/src/components/CausalAnalysis.tsx | [ ] |
| A-6 | 实现扫描配置面板 | client/src/components/CausalAnalysis.tsx | [ ] |
| A-7 | 实现异常模式卡片组件 | client/src/components/CausalAnalysis.tsx | [ ] |
| A-8 | indicators 表新增 crossDimension 字段 | drizzle/schema.ts | [ ] |
| A-9 | 更新种子数据标注 8 个交叉因子 | server/seed.mjs | [ ] |
| A-10 | IndicatorFramework 增加交叉因子标签 | client/src/components/IndicatorFramework.tsx | [ ] |
| A-11 | 六维因子网格卡片增加交叉因子数 | client/src/components/IndicatorFramework.tsx | [ ] |
| A-12 | api.ts 更新 Indicator 类型 | client/src/lib/api.ts | [ ] |
| A-13 | 编写 P0 Vitest 测试 | server/factor-discovery.test.ts | [ ] |
| A-14 | 运行全量测试确认无回归 | - | [ ] |
