# FangClaw / StockClaw v3.1 技术更新说明书

# FangClaw / StockClaw v3.1 Technical Update Specification

**文档版本 / Document Version**：v3.1.0 | **日期 / Date**：2026-04-04 | **作者 / Author**：Manus AI

---

## 一、更新概述 / Update Overview

本次迭代是 FangClaw 项目自创建以来最大规模的功能升级，涵盖 **v3.0 因子发现引擎全量实施**（7 个功能模块）、**学术验证改进建议执行**（4 项）、以及 **Agent Swarm 思想重构落地**（7 项增强）。系统从"可解释动态投研看板"正式升级为 **StockClaw — Agent Swarm 时代的非显而易见关联发现引擎**。

This iteration represents the largest functional upgrade since the FangClaw project's inception, covering **v3.0 Factor Discovery Engine full implementation** (7 modules), **Academic Validation improvement execution** (4 items), and **Agent Swarm architectural enhancement** (7 items). The system has been officially upgraded from an "Explainable Dynamic Investment Research Dashboard" to **StockClaw — A Non-Obvious Correlation Discovery Engine for the Agent Swarm Era**.

---

## 二、版本变更摘要 / Version Change Summary

| 维度 / Dimension | v2.3（上一版本） | v3.1（当前版本） |
|---|---|---|
| 后端接口数 / API Endpoints | 11 | 18（+7） |
| 数据库表数 / Database Tables | 5 | 6（+1 factorTemplates） |
| 前端 Tab 数 / Frontend Tabs | 7 | 9（+2 因子发现 + 因子热力） |
| Vitest 测试数 / Tests | 30 | 41（+11） |
| System Prompt 字数 / Prompt Length | ~800 字 | ~2,200 字（+175%） |
| LLM 返回字段数 / LLM Output Fields | 9 | 13（+4 新字段） |
| 版本标识 / Version Tag | FANGCLAW v2.3 | STOCKCLAW v3.1 Agent Swarm |

---

## 三、数据库变更 / Database Changes

### 3.1 indicators 表新增字段 / New Columns in `indicators` Table

| 字段名 / Column | 类型 / Type | 说明 / Description |
|---|---|---|
| `crossDimension` | varchar(50), nullable | 交叉因子的第二个维度标签。例如指标属于"基本面"维度但同时与"资金行为"维度交叉，则此字段值为"资金行为"。用于 P0-B 交叉因子标签和 P2-B 因子热力矩阵的维度交叉计算。 |
| `firstTriggeredAt` | bigint, nullable | 该指标首次被触发的 Unix 时间戳（毫秒）。用于因子生命周期管理——追踪因子从"发现"到"活跃"的时间线。 |
| `triggerCount` | int, default 0 | 该指标被触发的累计次数。用于因子生命周期管理——高频触发的因子可能正在衰减（拥挤度上升），低频触发的因子可能是新发现的非显而易见关联。 |

### 3.2 新增 factorTemplates 表 / New `factorTemplates` Table

该表存储十大因子模板，作为因子发现引擎的"知识库"。每个模板定义了一种经过学术验证的因子模式，包含信号定义、适用市场、历史胜率等元数据。

| 字段名 / Column | 类型 / Type | 说明 / Description |
|---|---|---|
| `id` | int, PK, auto-increment | 主键 |
| `code` | varchar(20), unique | 因子模板代码（如 MOM_REV, VAL_REP） |
| `name` | varchar(100) | 中文名称 |
| `nameEn` | varchar(100), nullable | 英文名称 |
| `category` | varchar(50) | 主维度分类 |
| `crossCategory` | varchar(50), nullable | 交叉维度分类 |
| `description` | text, nullable | 详细描述 |
| `signalDefinition` | text, nullable | 信号触发条件定义 |
| `dataSources` | json, nullable | 数据来源列表 |
| `applicableMarkets` | json, nullable | 适用市场列表 |
| `historicalWinRate` | int, nullable | 历史胜率（0-100） |
| `status` | varchar(20), default 'active' | 因子状态（active/candidate/retired） |
| `createdAt` / `updatedAt` | timestamp | 时间戳 |

### 3.3 种子数据 / Seed Data

通过 `server/seed-v3.mjs` 脚本插入以下数据：

**交叉因子标签更新**：为 20 个指标中的 8 个添加了 `crossDimension` 标签，标注其与第二个维度的交叉关系。例如"北向资金异动"（资金行为维度）同时与"情绪"维度交叉。

**十大因子模板**：插入 10 个经过学术验证的因子模板，覆盖动量反转、估值修复、事件驱动、资金共振、情绪极值、替代数据领先、政策脉冲、产业链传导、流动性溢价、交叉维度共振等经典因子模式。每个模板包含信号定义、适用市场（A 股/港股/美股）和历史胜率参考值。

---

## 四、后端接口变更 / Backend API Changes

### 4.1 新增接口清单 / New Endpoints

| 接口路径 / Endpoint | 类型 / Type | 说明 / Description |
|---|---|---|
| `causal.discover` | mutation | **P0-A 因子发现模式**。系统主动扫描目标池状态，基于因子模板库和当前指标触发情况，发现非显而易见关联和潜在因子信号。返回发现的信号列表、目标池健康度评估、趋势总结、关注列表和风险预警。 |
| `companies.anomalies` | query | **P1-B 异常信号检测**。扫描目标池中的异常模式：权重异动（权重 ≥ 9 或 ≤ 2）、多重触发（同一公司关联多个已触发指标）、交叉维度异常（不同维度的指标同时触发）。 |
| `risk.crowding` | query | **P1-C 拥挤度动态计算**。实时计算因子拥挤度，分三个维度：权重集中度（基于基尼系数）、指标触发集中度（触发率）、方向一致性（所有公司权重变化方向的一致程度）。 |
| `factorTemplates.list` | query | **P1-A 十大因子模板**。返回所有活跃的因子模板列表，包含名称、分类、信号定义、历史胜率等元数据。 |
| `indicators.heatmap` | query | **P2-B 因子热力矩阵**。计算 6×6 维度交叉矩阵，每个单元格的值基于该维度组合下的指标触发率。用于可视化跨维度因子共振强度。 |
| `evidence.backtest` | query | **P2-A 因子回测模拟**。对指定证据链进行历史回测模拟，计算分析一致性得分、历史匹配度和回测结论。 |
| `disclaimer.get` | query | **R7 免责声明**。返回中英文免责声明文本。 |

### 4.2 现有接口增强 / Enhanced Endpoints

**`causal.analyze`（核心因果分析引擎）**

本次迭代对核心分析引擎进行了全面增强：

**System Prompt 增强（+175%）**：新增 5 个 Prompt 模块——A 股本土化规则（涨跌停/T+1/北向资金/大基金/融资融券/限售股解禁/政策敏感性/板块轮动）、经济学逻辑检验（因果方向/传导路径/时间尺度/反身性四重检验）、宏观经济体制判断（扩张/收缩/政策转向/流动性收紧/滞胀五种体制）、反对论点要求（Devil's Advocate 机制）、非显而易见关联发现规则。

**LLM 返回值新增 4 个字段**：

| 字段 / Field | 类型 / Type | 说明 / Description |
|---|---|---|
| `counterArgument` | string | 反对论点——为什么这个分析可能是错的。来源于花旗银行"认知债务"概念的启发，目的是帮助用户保持独立判断力。 |
| `macroRegime` | enum | 宏观经济体制判断（expansion/contraction/policy_pivot/liquidity_squeeze/stagflation）。来源于 CFA Institute Agentic AI 工作流标准。 |
| `nonObviousInsight` | string | 非显而易见的关联发现。来源于 Moody's 分析报告中"non-obvious correlations"概念。 |
| `confidenceLevel` | enum | 置信度分级（high ≥ 75 / medium ≥ 45 / low < 45）。用于前端颜色标注和信号分层。 |

**接口返回值新增 2 个标准化字段**（OpenClaw compatible）：

| 字段 / Field | 值 / Value | 说明 / Description |
|---|---|---|
| `signalType` | "analysis" | 信号类型标识，用于未来对接 OpenClaw 生态。 |
| `disclaimer` | string | 免责声明文本，确保每个分析结果都附带合规声明。 |

### 4.3 后端辅助函数新增 / New Database Helper Functions

在 `server/db.ts` 中新增以下辅助函数：

| 函数名 / Function | 说明 / Description |
|---|---|
| `updateIndicatorStatusV3(id, status)` | v3.0 版本的指标状态更新，同时更新 `firstTriggeredAt`（首次触发时间）和 `triggerCount`（累计触发次数）。 |
| `getAllFactorTemplates()` | 获取所有因子模板，按 ID 排序。 |
| `detectAnomalies()` | 异常信号检测——扫描权重异动、多重触发和交叉维度异常三种模式。 |
| `calculateCrowding()` | 拥挤度动态计算——基于基尼系数计算权重集中度，基于触发率计算指标集中度，基于方向一致性计算行为集中度。 |
| `getFactorHeatmap()` | 因子热力矩阵——计算 6×6 维度交叉矩阵，每个单元格基于该维度组合下的指标触发率。 |
| `backtestEvidence(evidenceId)` | 因子回测模拟——对指定证据链进行历史一致性分析和模拟回测。 |
| `buildDiscoverySummary()` | 构建因子发现上下文——汇总目标池快照、指标状态、因子模板和最近分析活动，作为因子发现 LLM 的输入。 |

---

## 五、前端变更 / Frontend Changes

### 5.1 新增组件 / New Components

**FactorDiscovery.tsx（因子发现模式）**

P0-A 因子发现模式的前端组件。提供"一键扫描"按钮，调用 `causal.discover` 接口，展示发现的信号列表。每个信号卡片包含：信号名称（中英文）、严重程度标签（高/中/低，颜色编码）、置信度百分比、信号描述、受影响的公司代码列表、建议操作、反对论点（红色警示区域）、非显而易见关联解释（蓝色信息区域）。底部展示目标池健康度评估、趋势总结和风险预警。

**FactorHeatmap.tsx（因子热力矩阵）**

P2-B 因子热力矩阵的前端组件。展示 6×6 维度交叉矩阵，每个单元格用颜色深度表示该维度组合下的指标触发率。对角线单元格表示单一维度的内部触发率，非对角线单元格表示两个维度之间的交叉触发强度。颜色从浅绿（低触发率）到深红（高触发率）渐变。

**FactorTemplatesSection（因子模板库入口）**

集成在 IndicatorFramework 组件底部的因子模板展示区域。可折叠/展开，展示十大因子模板的名称、分类、历史胜率（颜色编码：≥60% 绿色、≥45% 黄色、<45% 灰色）、信号定义等信息。

### 5.2 现有组件增强 / Enhanced Components

**Home.tsx**

新增两个 Tab："因子发现"（Discover，集成 FactorDiscovery 组件）和"因子热力"（Heatmap，集成 FactorHeatmap 组件）。底部版本号从 `FANGCLAW v2.3` 更新为 `STOCKCLAW v3.1 | Agent Swarm`。底部 THEME 标签更新为 `THEME: Agent Swarm / 非显而易见关联`。

**CausalAnalysis.tsx（认知引擎）**

新增三个展示区域：反对论点区域（红色边框，展示 `counterArgument` 字段，标题为"反对论点 / Devil's Advocate"）、宏观体制判断标签（展示 `macroRegime` 字段，中文翻译为扩张期/收缩期/政策转向期/流动性收紧期/滞胀期）、非显而易见关联发现区域（蓝色边框，展示 `nonObviousInsight` 字段）。底部新增免责声明文本。

**CompanyPool.tsx（目标池）**

集成异常信号标记功能。调用 `companies.anomalies` 接口，在存在异常的公司行上展示橙色 AlertTriangle 图标。点击展开可查看异常详情（异常类型、严重程度、详细描述）。

**RiskPanel.tsx（风控面板）**

拥挤度计算从静态硬编码改为调用 `risk.crowding` 实时接口。展示三维拥挤度分解：权重集中度（基尼系数）、指标触发集中度（触发率）、方向一致性（行为集中度）。

**EvidenceDetail.tsx（证据链详情页）**

新增"因子回测模拟"区块（BacktestSection）。调用 `evidence.backtest` 接口，展示分析一致性得分、历史匹配度和回测结论。一致性得分用颜色编码（≥70% 绿色、≥40% 黄色、<40% 红色）。

**IndicatorFramework.tsx（六维因子框架）**

底部新增因子模板库入口（FactorTemplatesSection），可折叠展示十大因子模板。

### 5.3 新增 Hooks / New API Hooks

在 `client/src/lib/api.ts` 中新增以下 hooks：

| Hook 名称 / Hook Name | 说明 / Description |
|---|---|
| `useAnomalies()` | 获取目标池异常信号列表 |
| `useCrowding()` | 获取实时拥挤度数据 |
| `useFactorHeatmap()` | 获取因子热力矩阵数据 |
| `useBacktest(evidenceId)` | 获取指定证据链的回测结果 |

---

## 六、Agent Swarm 思想重构落地 / Agent Swarm Architectural Enhancement

### 6.1 理念升级 / Conceptual Upgrade

本次迭代将 FangClaw 的产品定位从"可解释动态投研看板"升级为 **StockClaw — Agent Swarm 时代的非显而易见关联发现引擎**。这一升级基于三份核心输入材料的综合分析：AI-Trader 开源项目（HKUDS/AI-Trader）、OpenClaw 范式定义、以及 Agentic Engineering 时代七大战略启发。

### 6.2 已落地的 7 项增强 / 7 Implemented Enhancements

| 编号 / ID | 增强项 / Enhancement | 来源 / Source | 实施位置 / Location |
|---|---|---|---|
| E1 | 宏观经济体制判断 | CFA Institute Agentic AI 标准 | `server/routers.ts` System Prompt |
| E2 | 反对论点（Devil's Advocate） | 花旗银行"认知债务"概念 | `server/routers.ts` System Prompt + 前端展示 |
| E3 | "非显而易见关联发现"叙事 | Moody's 分析报告 | 前端组件标题和描述 |
| E4 | signalType + confidence 标准化 | OpenClaw compatible 设计 | `server/routers.ts` 返回值 |
| E5 | 因子状态标签展示 | 微软 Qlib 因子生命周期 | 前端 FactorTemplateCard |
| E6 | 非显而易见关联解释要求 | Moody's "non-obvious correlations" | `server/routers.ts` Prompt + 前端展示 |
| E7 | 置信度分级颜色标注 | 认知增强设计 | 前端 CausalAnalysis + FactorDiscovery |

### 6.3 配套文档 / Supporting Documents

| 文档名称 / Document | 说明 / Description |
|---|---|
| `FangClaw_AgentSwarm思想重构与执行方案.md` | 完整的思想重构文档，包含 Agent Swarm 五层架构定义、AI-Trader 启发分析、七大战略启发落地方案、商业模式演进路径和核心护城河分析。 |
| `FangClaw_学术验证启发与改进建议分析.md` | 学术验证文档的启发分析，包含 8 项改进建议和 24 个可执行单元。 |
| `FangClaw_金价提醒启发与付费获客执行方案.md` | 金价提醒文章的启发分析，包含付费分层策略和获客方案。 |

---

## 七、测试覆盖 / Test Coverage

### 7.1 测试结果 / Test Results

全部 **41 个测试**通过，6 个测试文件：

| 测试文件 / Test File | 测试数 / Tests | 说明 / Description |
|---|---|---|
| `server/v3-features.test.ts` | 10 | v3.0 新增接口测试：因子模板、异常检测、拥挤度、热力矩阵、回测、免责声明 |
| `server/fangclaw.test.ts` | 12 | 核心功能测试：公司池、指标、变更日志、证据链 |
| `server/p012.test.ts` | 9 | P0/P1/P2 功能测试 |
| `server/evidence.test.ts` | 5 | 证据链详情测试 |
| `server/causal.test.ts` | 4 | 因果分析引擎测试 |
| `server/auth.logout.test.ts` | 1 | 认证登出测试 |

### 7.2 新增测试项 / New Test Cases

v3-features.test.ts 新增的 10 个测试覆盖以下场景：

- 因子模板列表返回正确数据结构（包含 id, name, code, category 等字段）
- 异常检测返回数组格式且每条包含 type, severity, detail 字段
- 拥挤度计算返回 overall + breakdown 结构（权重/指标/方向三维分解）
- 因子热力矩阵返回 dimensions + matrix 结构（6×6 矩阵）
- 因子回测对有效证据链返回一致性得分和结论
- 因子回测对无效证据链返回 null
- 免责声明返回中英文文本

---

## 八、已知限制与未来路线图 / Known Limitations & Roadmap

### 8.1 已知限制 / Known Limitations

**数据源限制**：当前系统的所有分析数据来自 AI 模型的推理输出，尚未接入实时市场数据 API（如 Tushare、AKShare）。因子发现和回测结果基于模拟数据，不代表真实市场表现。

**单一 LLM 限制**：当前使用单一 LLM 进行分析，尚未实现真正的"多 Agent 投票"机制。Agent Swarm 五层架构中的 Level 3（验证蜂群）和 Level 4（共识层）仍为设计阶段。

**回测精度限制**：`evidence.backtest` 接口的回测结果基于简化的模拟算法，而非真实的历史价格数据回测。

### 8.2 第二阶段路线图 / Phase 2 Roadmap

| 优先级 / Priority | 功能 / Feature | 预估工时 / Est. Hours |
|---|---|---|
| P0 | 监控意图模式（自然语言 → 监控规则） | 4-5 h |
| P0 | 首页信息流增强（最新发现 + 异常预警卡片） | 1.5 h |
| P1 | 因子信誉分系统（基于回测结果动态更新） | 2 h |
| P1 | 外部数据源接入接口预留 | 0.5 h |
| P2 | 实时股票价格获取（YahooFinance 集成） | 3 h |
| P2 | 推送通知集成（飞书/企业微信） | 2 h |

---

## 九、文件变更清单 / Changed Files

### 后端 / Backend

| 文件 / File | 变更类型 / Change Type | 说明 / Description |
|---|---|---|
| `drizzle/schema.ts` | 修改 | 新增 factorTemplates 表；indicators 表新增 3 个字段 |
| `drizzle/0004_loose_lionheart.sql` | 新增 | 数据库迁移脚本 |
| `server/db.ts` | 修改 | 新增 7 个辅助函数 |
| `server/routers.ts` | 重写 | 新增 7 个接口 + 5 个 Prompt 模块 + 4 个 LLM 返回字段 |
| `server/seed-v3.mjs` | 新增 | v3.0 种子数据脚本 |
| `server/v3-features.test.ts` | 新增 | v3.0 功能测试（10 个测试用例） |

### 前端 / Frontend

| 文件 / File | 变更类型 / Change Type | 说明 / Description |
|---|---|---|
| `client/src/pages/Home.tsx` | 修改 | 新增 2 个 Tab + 版本号更新 |
| `client/src/components/FactorDiscovery.tsx` | 新增 | 因子发现模式组件 |
| `client/src/components/FactorHeatmap.tsx` | 新增 | 因子热力矩阵组件 |
| `client/src/components/CausalAnalysis.tsx` | 修改 | 新增反对论点/宏观体制/非显而易见关联展示 |
| `client/src/components/CompanyPool.tsx` | 修改 | 集成异常信号标记 |
| `client/src/components/RiskPanel.tsx` | 修改 | 拥挤度改为实时接口 |
| `client/src/components/IndicatorFramework.tsx` | 修改 | 新增因子模板库入口 |
| `client/src/pages/EvidenceDetail.tsx` | 修改 | 新增回测区块 |
| `client/src/lib/api.ts` | 修改 | 新增 4 个 hooks |

### 文档 / Documents

| 文件 / File | 说明 / Description |
|---|---|
| `FangClaw_AgentSwarm思想重构与执行方案.md` | Agent Swarm 思想重构与可落地执行方案 |
| `FangClaw_学术验证启发与改进建议分析.md` | 学术验证启发分析 |
| `FangClaw_金价提醒启发与付费获客执行方案.md` | 金价提醒启发与付费获客方案 |
| `FangClaw_v3.1_技术更新说明书.md` | 本文档 |

---

## 十、部署注意事项 / Deployment Notes

1. **数据库迁移**：部署前需执行 `pnpm db:push` 以应用 schema 变更（新增 factorTemplates 表和 indicators 表的 3 个新字段）。
2. **种子数据**：首次部署后需执行 `node server/seed-v3.mjs` 以插入因子模板数据和交叉因子标签。
3. **无破坏性变更**：所有新增字段均为 nullable 或有默认值，不会影响现有数据。
4. **无新增环境变量**：本次迭代不需要新增任何环境变量或密钥。

---

**文档结束 / End of Document**
