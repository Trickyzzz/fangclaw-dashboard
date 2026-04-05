# FangClaw 因子发现引擎 — P1 详细设计文档

**文档版本**：v1.0 | **日期**：2026-04-04 | **作者**：Manus AI

---

## 目录

1. P1-A：十大因子模板（因子证据网格）
2. P1-B：异常信号标记（目标池增强）
3. P1-C：因子拥挤度动态计算（风控面板增强）

---

## 1. P1-A：十大因子模板

### 1.1 功能概述

在认知引擎中增加"因子模板"功能。预定义因子发现引擎中的十大因子模板，用户可以选择一个模板，系统按照该模板的"数据源 A × 数据源 B → 异常模式"逻辑进行定向分析。

**核心理念：** 将自由格式的 AI 分析升级为结构化的因子分析框架，降低使用门槛，提高分析的可比性和可回溯性。

### 1.2 十大因子模板定义

| 编号 | 因子名称 | 数据源 A | 数据源 B | 异常模式 | 可用状态 |
|------|---------|---------|---------|---------|---------|
| F01 | 北向资金先知 | 北向资金流向 | 财报发布日期 | 聪明钱在财报前异常增持 | 🟡 模拟 |
| F02 | 应收账款异常膨胀 | 应收账款增速 | 营收增速 | 应收增速远超营收增速 | 🟡 模拟 |
| F03 | KOL 集体翻空 | 社交媒体KOL观点 | 价格走势 | KOL 集体看空但价格未跌 | 🟡 模拟 |
| F04 | 情绪-价格背离 | 新闻情绪指数 | 股价变化 | 利空消息密集但股价不跌 | 🟡 模拟 |
| F05 | 机构调仓先行 | 机构持仓变化 | 行业指数 | 机构提前调仓预示板块轮动 | 🟡 模拟 |
| F06 | 北向-融资背离 | 北向资金方向 | 融资余额方向 | 聪明钱与散户方向相反 | 🟡 模拟 |
| F07 | 政策传导链 | 政策文件 | 产业链映射 | 政策受益公司识别 | 🟢 可用 |
| F08 | 监管语气变化 | 监管文件措辞 | 历史措辞对比 | 监管态度转向信号 | 🟡 模拟 |
| F09 | 卫星数据-库存 | 卫星/物流数据 | 公司自报库存 | 自报数据与实际不符 | 🔴 需外部数据 |
| F10 | 招聘数据-增长 | 招聘网站数据 | 公司增长预期 | 招聘扩张预示业务增长 | 🔴 需外部数据 |

**可用状态说明：**
- 🟢 可用：可基于现有数据进行真实分析
- 🟡 模拟：可基于现有数据进行 LLM 模拟分析（标注"模拟分析"）
- 🔴 需外部数据：需要接入外部数据源后才能使用（灰色不可用）

### 1.3 数据结构设计

#### 1.3.1 因子模板数据结构

```typescript
interface FactorTemplate {
  id: string;              // F01-F10
  name: string;            // 因子名称
  nameEn: string;          // 英文名称
  sourceA: string;         // 数据源 A
  sourceB: string;         // 数据源 B
  anomalyPattern: string;  // 异常模式描述
  status: "available" | "simulated" | "unavailable";
  category: "资金×财报" | "舆情×价格" | "资金×行业" | "政策×产业链" | "另类×传统";
  crossDimensions: [string, string]; // 交叉的两个因子维度
}
```

#### 1.3.2 模板分析请求

```typescript
const analyzeWithTemplateInput = z.object({
  templateId: z.string(),           // F01-F10
  targetCompanyIds: z.array(z.number()).optional(), // 可选：指定分析的公司
});
```

#### 1.3.3 模板分析响应

```typescript
interface TemplateAnalysisResult {
  templateId: string;
  templateName: string;
  status: "real" | "simulated";     // 真实分析 or 模拟分析
  findings: {
    signalDetected: boolean;        // 是否检测到信号
    signalStrength: "strong" | "moderate" | "weak" | "none";
    description: string;            // 分析描述
    affectedCompanies: {
      symbol: string;
      name: string;
      signalDetail: string;         // 该公司的具体信号
    }[];
    dataSourceA_summary: string;    // 数据源 A 的数据摘要
    dataSourceB_summary: string;    // 数据源 B 的数据摘要
    crossPattern: string;           // 交叉模式描述
    historicalContext: string;      // 历史背景
    confidence: number;             // 置信度 0-100
  };
  disclaimer: string;               // 免责声明
}
```

### 1.4 后端 API 设计

#### 1.4.1 新增接口：`causal.analyzeWithTemplate`

```typescript
analyzeWithTemplate: protectedProcedure
  .input(z.object({
    templateId: z.string(),
    targetCompanyIds: z.array(z.number()).optional(),
  }))
  .mutation(async ({ input }) => {
    const template = FACTOR_TEMPLATES.find(t => t.id === input.templateId);
    if (!template) throw new TRPCError({ code: "BAD_REQUEST" });
    if (template.status === "unavailable") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "该因子模板需要外部数据源，当前不可用"
      });
    }

    // 收集相关数据
    const companies = await getAllCompanies();
    const changeLogs = await getChangeLogs(30);
    const indicators = await getAllIndicators();

    // 构建模板专用 prompt
    const prompt = buildTemplatePrompt(template, companies, changeLogs, indicators);

    const response = await invokeLLM({
      messages: [
        { role: "system", content: TEMPLATE_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_schema", json_schema: TEMPLATE_RESPONSE_SCHEMA },
    });

    const result = JSON.parse(response.choices[0].message.content);
    result.status = template.status === "available" ? "real" : "simulated";
    result.disclaimer = template.status === "simulated"
      ? "本分析基于有限历史数据的模拟推演，仅供参考，不构成投资建议。"
      : "本分析基于现有数据，仅供参考，不构成投资建议。";

    return result;
  }),
```

#### 1.4.2 模板专用 LLM Prompt 模板

每个因子模板有一个专用的 prompt 模板，以 F07（政策传导链）为例：

```
你是 FangClaw 因子分析引擎，正在执行"政策传导链"因子分析。

分析框架：
- 数据源 A（政策文件）：从最近的分析记录中提取政策相关信息
- 数据源 B（产业链映射）：目标池中 30 家公司的产业链位置和标签
- 异常模式：识别政策受益公司，特别是政策传导链中被忽略的间接受益者

目标池数据：
${companiesData}

最近变更记录：
${changeLogsData}

请分析：
1. 最近的政策/事件是否对目标池中的公司产生传导效应？
2. 是否存在被忽略的间接受益公司？
3. 政策传导的时间窗口和强度如何？
```

### 1.5 前端组件规格

#### 1.5.1 因子模板选择器

在 CausalAnalysis 组件的"消息分析"模式中，输入框上方增加一个可折叠的"因子模板"选择区域：

```
┌─────────────────────────────────────────────────────┐
│  📋 因子模板 Factor Templates          [展开/收起]   │
│                                                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ 🟡 F01  │ │ 🟡 F02  │ │ 🟡 F03  │ │ 🟡 F04  │  │
│  │ 北向资金 │ │ 应收账款 │ │ KOL翻空 │ │ 情绪背离│  │
│  │ 先知     │ │ 异常膨胀│ │         │ │         │  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ 🟡 F05  │ │ 🟡 F06  │ │ 🟢 F07  │ │ 🟡 F08  │  │
│  │ 机构调仓 │ │ 北向融资│ │ 政策传导│ │ 监管语气│  │
│  │ 先行     │ │ 背离    │ │ 链      │ │ 变化    │  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
│  ┌─────────┐ ┌─────────┐                           │
│  │ 🔴 F09  │ │ 🔴 F10  │                           │
│  │ 卫星数据 │ │ 招聘数据│  ← 灰色不可用              │
│  │ 库存     │ │ 增长    │                           │
│  └─────────┘ └─────────┘                           │
│                                                     │
│  选中模板后显示：                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │ F07 政策传导链                                 │  │
│  │ 数据源 A: 政策文件  ×  数据源 B: 产业链映射    │  │
│  │ 异常模式: 识别政策受益公司                      │  │
│  │                                               │  │
│  │ [ 🔍 执行因子分析 ]                            │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

#### 1.5.2 模板分析结果展示

```
┌─ F07 政策传导链 分析结果 ─────────────────────────┐
│                                                   │
│  状态: 🟡 模拟分析    置信度: 72/100              │
│                                                   │
│  ┌─ 信号强度 ──────────────────────────────────┐  │
│  │  ████████████████░░░░░░  MODERATE            │  │
│  └──────────────────────────────────────────────┘  │
│                                                   │
│  数据源 A (政策文件):                              │
│  最近分析中涉及半导体产业政策扶持、算力基建...     │
│                                                   │
│  数据源 B (产业链映射):                            │
│  目标池中上游 15 家、中游 8 家、下游 7 家...       │
│                                                   │
│  交叉模式发现:                                     │
│  政策传导链中，封测环节（中游）可能被低估...       │
│                                                   │
│  受影响公司:                                       │
│  • 长电科技(600584) - 封测龙头，政策间接受益       │
│  • 北方华创(002371) - 设备国产替代直接受益         │
│                                                   │
│  ⚠ 本分析基于有限历史数据的模拟推演，仅供参考      │
└───────────────────────────────────────────────────┘
```

### 1.6 测试规格

```typescript
describe("causal.analyzeWithTemplate", () => {
  it("应拒绝 status=unavailable 的模板（F09, F10）");
  it("应为 simulated 模板返回 disclaimer");
  it("返回结果应包含 signalStrength 和 affectedCompanies");
  it("templateId 不存在时应返回 BAD_REQUEST");
});
```

---

## 2. P1-B：异常信号标记

### 2.1 功能概述

在目标池公司列表的每一行增加"异常信号"图标。当系统检测到该公司存在跨维度异常模式时，显示一个警示图标。

**核心理念：** 让用户不需要逐个展开查看，就能一眼识别哪些公司存在异常。

### 2.2 异常检测规则

定义 4 类异常检测规则，基于现有数据库数据：

| 规则编号 | 规则名称 | 检测逻辑 | 数据来源 |
|---------|---------|---------|---------|
| R1 | 权重-频率背离 | 公司在最近 N 条证据链中被提及次数 ≥ 3，但权重未变化 | evidenceChains + companies |
| R2 | 方向信号矛盾 | 同一公司在最近 2 条证据链中收到相反的方向信号 | evidenceChains |
| R3 | 沉默公司 | 公司权重 ≥ 7 但在最近 10 条证据链中从未被提及 | evidenceChains + companies |
| R4 | 权重天花板 | 公司权重已达 10（上限）且最近仍被频繁提及 | evidenceChains + companies |

### 2.3 数据结构设计

#### 2.3.1 异常信号数据结构

```typescript
interface CompanyAnomaly {
  companyId: number;
  symbol: string;
  name: string;
  anomalies: {
    ruleId: string;        // R1-R4
    ruleName: string;      // 规则名称
    severity: "high" | "medium" | "low";
    description: string;   // 异常描述
    evidence: string;      // 支撑证据
  }[];
}
```

### 2.4 后端 API 设计

#### 2.4.1 新增查询函数：`detectAnomalies`

```typescript
// server/db.ts 新增
export async function detectAnomalies(): Promise<CompanyAnomaly[]> {
  const companies = await getAllCompanies();
  const evidenceChains = await getAllEvidenceChains();
  const anomalies: CompanyAnomaly[] = [];

  for (const company of companies) {
    const companyAnomalies: CompanyAnomaly["anomalies"] = [];

    // R1: 权重-频率背离
    const mentionCount = evidenceChains.filter(ec =>
      ec.analysis?.affectedCompanies?.some(
        (ac: any) => ac.symbol === company.symbol
      )
    ).length;
    // ... 检测逻辑 ...

    // R2: 方向信号矛盾
    // ... 检测逻辑 ...

    // R3: 沉默公司
    // ... 检测逻辑 ...

    // R4: 权重天花板
    // ... 检测逻辑 ...

    if (companyAnomalies.length > 0) {
      anomalies.push({
        companyId: company.id,
        symbol: company.symbol,
        name: company.name,
        anomalies: companyAnomalies,
      });
    }
  }

  return anomalies;
}
```

#### 2.4.2 新增接口：`companies.anomalies`

```typescript
anomalies: publicProcedure.query(async () => {
  return await detectAnomalies();
}),
```

### 2.5 前端组件变更

#### 2.5.1 CompanyPool 列表行增强

在每行公司名称右侧增加异常信号图标：

```
序号  代码      名称        异常    产业链   标签        权重
01    688256    寒武纪      ⚠️🔴   上游     AI芯片      ██████████ 10  ∨
                            └─ 异常信号图标
```

**图标规格：**
- 有异常时：显示 `AlertTriangle` 图标（lucide-react）
- 颜色：按最高严重度着色（high=红、medium=黄、low=蓝）
- 悬停：Tooltip 显示异常摘要
- 点击：展开异常详情卡片

#### 2.5.2 异常详情展开卡片

```
┌─ 寒武纪(688256) 异常信号 ─────────────────────────┐
│                                                   │
│  🔴 R4 权重天花板                                  │
│  权重已达上限 10，但最近 5 次分析中被提及 4 次，    │
│  实际关注度可能远超权重所能反映。                   │
│                                                   │
│  🟡 R1 权重-频率背离                               │
│  被频繁提及但权重已无上升空间。                     │
│                                                   │
└───────────────────────────────────────────────────┘
```

### 2.6 测试规格

```typescript
describe("companies.anomalies", () => {
  it("应返回包含异常信号的公司列表");
  it("每个异常应包含 ruleId、ruleName、severity、description");
  it("无异常的公司不应出现在结果中");
  it("R4 规则应检测权重=10 且频繁被提及的公司");
});
```

---

## 3. P1-C：因子拥挤度动态计算

### 3.1 功能概述

将风控面板的"因子拥挤度"从静态预设值改为**动态计算**——基于目标池中公司的权重分布和产业链集中度，实时计算赫芬达尔指数（HHI）。

### 3.2 计算逻辑

#### 3.2.1 产业链拥挤度（Chain HHI）

```
Chain HHI = Σ (chain_weight_share)²

其中 chain_weight_share = 该产业链位置的总权重 / 全部公司总权重

示例：
  上游总权重 = 120，中游总权重 = 60，下游总权重 = 40，总计 = 220
  上游份额 = 120/220 = 0.545
  中游份额 = 60/220 = 0.273
  下游份额 = 40/220 = 0.182
  HHI = 0.545² + 0.273² + 0.182² = 0.297 + 0.075 + 0.033 = 0.405

解读：
  HHI < 0.25 → 分散（绿色）
  0.25 ≤ HHI < 0.40 → 适中（黄色）
  HHI ≥ 0.40 → 集中（红色，拥挤预警）
```

#### 3.2.2 因子维度拥挤度（Factor HHI）

```
Factor HHI = Σ (dimension_trigger_share)²

其中 dimension_trigger_share = 该维度活跃指标数 / 全部活跃指标数
```

#### 3.2.3 综合拥挤度

```
Composite Crowdedness = 0.6 × Chain HHI + 0.4 × Factor HHI
```

### 3.3 数据结构设计

```typescript
interface CrowdednessResult {
  chainHHI: number;           // 产业链 HHI (0-1)
  factorHHI: number;          // 因子维度 HHI (0-1)
  composite: number;          // 综合拥挤度 (0-1)
  level: "low" | "medium" | "high"; // 拥挤等级
  chainBreakdown: {
    position: string;         // 上游/中游/下游
    totalWeight: number;      // 该位置总权重
    share: number;            // 份额
    companyCount: number;     // 公司数
  }[];
  factorBreakdown: {
    dimension: string;        // 因子维度名称
    activeCount: number;      // 活跃指标数
    totalCount: number;       // 总指标数
    share: number;            // 份额
  }[];
  alerts: string[];           // 预警信息列表
}
```

### 3.4 后端 API 设计

#### 3.4.1 新增查询函数：`calculateCrowdedness`

```typescript
// server/db.ts 新增
export async function calculateCrowdedness(): Promise<CrowdednessResult> {
  const companies = await getAllCompanies();
  const indicators = await getAllIndicators();

  // 1. 计算产业链 HHI
  const chainGroups = groupBy(companies, 'chain_position');
  const totalWeight = companies.reduce((sum, c) => sum + c.weight, 0);
  const chainBreakdown = Object.entries(chainGroups).map(([pos, comps]) => {
    const posWeight = comps.reduce((sum, c) => sum + c.weight, 0);
    return {
      position: pos,
      totalWeight: posWeight,
      share: totalWeight > 0 ? posWeight / totalWeight : 0,
      companyCount: comps.length,
    };
  });
  const chainHHI = chainBreakdown.reduce((sum, cb) => sum + cb.share ** 2, 0);

  // 2. 计算因子维度 HHI
  const dimGroups = groupBy(indicators.filter(i => i.status === '活跃'), 'category');
  const totalActive = indicators.filter(i => i.status === '活跃').length;
  const factorBreakdown = Object.entries(dimGroups).map(([dim, inds]) => ({
    dimension: dim,
    activeCount: inds.length,
    totalCount: indicators.filter(i => i.category === dim).length,
    share: totalActive > 0 ? inds.length / totalActive : 0,
  }));
  const factorHHI = factorBreakdown.reduce((sum, fb) => sum + fb.share ** 2, 0);

  // 3. 综合拥挤度
  const composite = 0.6 * chainHHI + 0.4 * factorHHI;
  const level = composite < 0.25 ? "low" : composite < 0.40 ? "medium" : "high";

  // 4. 生成预警
  const alerts: string[] = [];
  chainBreakdown.forEach(cb => {
    if (cb.share > 0.5) alerts.push(`${cb.position}权重占比 ${(cb.share*100).toFixed(0)}%，过度集中`);
  });
  if (level === "high") alerts.push("综合拥挤度过高，建议分散配置");

  return { chainHHI, factorHHI, composite, level, chainBreakdown, factorBreakdown, alerts };
}
```

#### 3.4.2 新增接口：`risk.crowdedness`

```typescript
crowdedness: publicProcedure.query(async () => {
  return await calculateCrowdedness();
}),
```

### 3.5 前端组件变更

#### 3.5.1 RiskPanel 拥挤度卡片重构

替换现有的静态 RiskCard 为动态拥挤度仪表盘：

```
┌─ 因子拥挤度 Factor Crowdedness ──────────────────┐
│                                                   │
│  综合拥挤度                                        │
│  ████████████████████░░░░░  0.405  🔴 集中         │
│                                                   │
│  产业链 HHI: 0.405    因子维度 HHI: 0.220         │
│                                                   │
│  ┌─ 产业链分布 ───────────────────────────────┐   │
│  │ 上游  ████████████████  54.5%  15家        │   │
│  │ 中游  ████████░░░░░░░░  27.3%   8家        │   │
│  │ 下游  █████░░░░░░░░░░░  18.2%   7家        │   │
│  └────────────────────────────────────────────┘   │
│                                                   │
│  ⚠ 上游权重占比 54%，过度集中                      │
│  ⚠ 综合拥挤度过高，建议分散配置                    │
└───────────────────────────────────────────────────┘
```

### 3.6 测试规格

```typescript
describe("risk.crowdedness", () => {
  it("应返回 chainHHI、factorHHI、composite 三个数值");
  it("composite 应等于 0.6*chainHHI + 0.4*factorHHI");
  it("level 应根据 composite 阈值正确分类");
  it("当某产业链占比 > 50% 时应生成预警");
  it("chainBreakdown 各 share 之和应约等于 1");
});
```

---

## 附录 B：P1 实施检查清单

| 序号 | 任务 | 文件 | 状态 |
|------|------|------|------|
| B-1 | 定义十大因子模板常量 | server/routers.ts | [ ] |
| B-2 | 新增 `causal.analyzeWithTemplate` 接口 | server/routers.ts | [ ] |
| B-3 | 编写 10 个模板专用 LLM prompt | server/routers.ts | [ ] |
| B-4 | CausalAnalysis 增加因子模板选择器 UI | client/src/components/CausalAnalysis.tsx | [ ] |
| B-5 | 实现模板分析结果展示组件 | client/src/components/CausalAnalysis.tsx | [ ] |
| B-6 | 新增 `detectAnomalies` 函数（4 条规则） | server/db.ts | [ ] |
| B-7 | 新增 `companies.anomalies` 接口 | server/routers.ts | [ ] |
| B-8 | CompanyPool 列表行增加异常信号图标 | client/src/components/CompanyPool.tsx | [ ] |
| B-9 | 实现异常详情展开卡片 | client/src/components/CompanyPool.tsx | [ ] |
| B-10 | 新增 `calculateCrowdedness` 函数 | server/db.ts | [ ] |
| B-11 | 新增 `risk.crowdedness` 接口 | server/routers.ts | [ ] |
| B-12 | 重构 RiskPanel 拥挤度卡片为动态数据 | client/src/components/RiskPanel.tsx | [ ] |
| B-13 | 编写 P1 Vitest 测试 | server/factor-p1.test.ts | [ ] |
| B-14 | 运行全量测试确认无回归 | - | [ ] |
