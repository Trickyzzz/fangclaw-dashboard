# FangClaw 可解释动态投研看板 — 使用指南

# FangClaw Explainable Dynamic Research Dashboard — User Guide

---

**版本 Version:** 2.0  
**更新日期 Updated:** 2026-04-04  
**作者 Author:** 翔阳智航低空科技（深圳）有限公司

---

## 1. 系统概述 | System Overview

FangClaw 是一套面向 AI 算力/半导体产业链的**可解释动态投研看板**。它将市场消息、新闻事件和数据信号通过 AI 因果推理引擎进行分析，自动更新公司池权重，并生成完整的证据链和线下验证清单，帮助投资者做出有据可查的决策。

FangClaw is an **Explainable Dynamic Research Dashboard** designed for the AI computing / semiconductor supply chain. It uses an AI causal reasoning engine to analyze market messages, news events, and data signals, automatically updating company pool weights and generating complete evidence chains with offline verification checklists to support evidence-based investment decisions.

系统的核心理念是"**因果闭环**"——每一次权重调整都有明确的消息来源、推理过程和验证清单，确保投研决策的可追溯性和可解释性。

The core philosophy is the "**Causal Loop**"—every weight adjustment has a clear message source, reasoning process, and verification checklist, ensuring traceability and explainability of research decisions.

---

## 2. 主界面布局 | Main Interface Layout

FangClaw 主界面采用三栏式布局，信息密度高且层次分明。

The main interface uses a three-column layout with high information density and clear hierarchy.

| 区域 Area | 位置 Position | 功能 Function |
|---|---|---|
| 左侧边栏 Left Sidebar | 屏幕左侧 | 展示任务简报、锚定公司、统计概览、产业链分布和指标分类 |
| 中央主区域 Central Area | 屏幕中间 | 包含 5 个功能 Tab：公司池、指标框架、因果分析、变更日志、态势概览 |
| 右侧边栏 Right Sidebar | 屏幕右侧（桌面端） | 实时变更日志流，展示最新的系统操作记录 |

### 2.1 顶部状态栏 | Top Status Bar

顶部状态栏实时展示系统运行状态，包括：

The top status bar displays real-time system status, including:

- **指标状态统计**：显示当前处于"正常"和"触发"状态的指标数量。当某个指标被 AI 分析触发时，"TRIGGERED"计数会增加，提示投资者关注相关领域的变化。
- **跟踪目标数**：当前公司池中活跃跟踪的公司总数。
- **锚定公司快捷入口**：右上角显示核心锚定公司（如 NVIDIA、台积电、ASML）的快捷标签。
- **系统时间**：当前日期和时间。

---

## 3. 五大功能模块 | Five Core Modules

### 3.1 公司池 | Company Pool

公司池是 FangClaw 的核心数据实体，展示当前跟踪的所有半导体/AI 算力产业链公司。

The Company Pool is the core data entity of FangClaw, displaying all semiconductor/AI computing supply chain companies currently being tracked.

**信息字段说明 Field Descriptions:**

| 字段 Field | 说明 Description |
|---|---|
| 序号 Index | 按当前排序规则的排列序号 |
| 股票代码 Symbol | A 股代码（如 688256）或美股代码（如 NVDA） |
| 公司名称 Name | 公司简称 |
| 产业链位置 Chain Position | 上游（设备/材料）、中游（制造/封测）、下游（应用/终端） |
| 行业细分 Sector | 公司所属细分领域（如 AI 芯片、光刻机、封测等） |
| 权重 Weight | 1-10 分，反映 AI 对该公司当前投研关注度的综合评分 |

**权重含义 Weight Meaning:**

权重是 FangClaw 最核心的指标，代表 AI 引擎基于最新市场信息对该公司的**综合关注度评分**。权重越高，表示近期该公司受到的正面信号越多，值得投资者重点关注。

Weight is the most critical metric in FangClaw, representing the AI engine's **comprehensive attention score** for a company based on the latest market information. A higher weight indicates more positive signals received recently, warranting closer investor attention.

| 权重范围 Weight Range | 含义 Meaning | 颜色 Color |
|---|---|---|
| 9-10 | 高度关注：近期有重大正面信号 | 绿色 Green |
| 7-8 | 中度关注：有积极信号但需验证 | 蓝色 Blue |
| 1-6 | 常规跟踪：暂无显著变化 | 灰色 Gray |

**数据来源 Data Source:** 公司池数据来自系统初始化时预设的 30 家 AI 算力/半导体产业链核心公司，涵盖 A 股和美股。权重由 AI 因果分析引擎根据输入的市场消息自动调整。

**筛选与排序 Filtering & Sorting:** 支持按产业链位置（上游/中游/下游）筛选，以及按权重或名称排序。点击公司行可展开查看详细标签和时间信息。

---

### 3.2 指标框架 | Indicator Framework

指标框架定义了 FangClaw 监控的 20 个关键指标，分为四个层级。

The Indicator Framework defines the 20 key indicators monitored by FangClaw, organized into four levels.

| 层级 Level | 说明 Description | 示例 Examples |
|---|---|---|
| 宏观 Macro | 影响整个行业的宏观经济和政策因素 | 全球半导体销售额、AI 算力需求指数、贸易政策变化、利率环境 |
| 中观 Meso | 产业链层面的结构性变化 | 晶圆代工产能利用率、先进封装需求、设备交付周期、HBM 供需 |
| 微观 Micro | 公司层面的经营数据和事件 | 关键客户订单、产品良率、研发突破、管理层变动、财报数据 |
| 因子 Factor | 量化交易因子和技术指标 | 北向资金流向、融资融券余额、期权隐含波动率、行业轮动信号 |

**指标状态 Indicator Status:**

每个指标有两种状态——"**正常 Normal**"和"**触发 Triggered**"。当 AI 分析引擎判断某条市场消息与特定指标相关时，该指标状态会自动变为"触发"，提示投资者该领域出现了值得关注的变化。

Each indicator has two states—"**Normal**" and "**Triggered**". When the AI analysis engine determines that a market message is related to a specific indicator, the indicator status automatically changes to "Triggered", alerting investors to noteworthy changes in that area.

**数据来源 Data Source:** 指标定义来自投研团队的专业经验，阈值和触发条件由系统预设。指标状态由 AI 因果分析引擎根据输入消息自动更新。

---

### 3.3 因果分析 | Causal Analysis

因果分析是 FangClaw 的核心功能模块，实现了从"消息输入"到"权重更新"的完整因果闭环。

Causal Analysis is the core functional module of FangClaw, implementing the complete causal loop from "message input" to "weight update".

**使用流程 Workflow:**

1. **输入消息**：在文本框中输入一条市场消息、新闻标题或数据信号。也可以点击"示例消息"选择预设的示例。
2. **AI 分析**：点击"开始分析"按钮，AI 引擎将自动执行以下步骤：
   - 识别消息中涉及的实体（公司、技术、政策等）
   - 匹配当前公司池中受影响的公司
   - 评估影响方向（正面/负面/中性）和程度
   - 判断触发了哪些监控指标
   - 计算权重调整建议（-3 到 +3）
   - 生成 3 个线下验证问题
3. **查看结果**：分析完成后，页面将展示完整的分析结果，包括：
   - **分析摘要**：一句话总结消息影响
   - **置信度**：AI 对本次分析的确信程度（0-100%）
   - **识别实体**：从消息中提取的关键实体
   - **触发指标**：本次分析触发的监控指标
   - **公司池影响**：受影响公司的权重变化详情
   - **推理过程**：AI 的因果推理链条
   - **线下验证清单**：3 个需要人工验证的问题
4. **跳转详情**：点击分析结果中的证据链 ID（如 EC-20260404-XXXX），可跳转到证据链详情页查看完整记录。

**数据来源 Data Source:** 分析结果由 AI 大语言模型（LLM）基于当前公司池和指标框架的上下文生成。权重调整会实时写入数据库，所有操作均有完整的证据链记录。

---

### 3.4 变更日志 | Change Log

变更日志记录了系统中所有的操作和变更，是 FangClaw 可解释性的重要组成部分。

The Change Log records all operations and changes in the system, serving as a crucial component of FangClaw's explainability.

**日志类型 Log Types:**

| 类型 Type | 标签 Badge | 说明 Description |
|---|---|---|
| INIT | 蓝色 Cyan | 系统初始化事件（如公司池加载） |
| ADD | 绿色 Green | 新增公司或指标 |
| WEIGHT | 黄色 Amber | 公司权重调整，显示调整前后的权重值 |
| ANALYSIS | 蓝色 Cyan | AI 分析完成的总结性记录 |

**证据链链接 Evidence Chain Links:** 每条与 AI 分析相关的日志都附带一个可点击的证据链 ID（如 `Evidence: EC-20260404-XXXX`）。点击该链接可跳转到证据链详情页，查看完整的分析过程和推理链条。

---

### 3.5 态势概览 | Overview

态势概览在移动端提供左侧边栏的统计信息，包括跟踪目标数、平均权重、产业链分布和指标分类统计。

The Overview provides the left sidebar statistics on mobile devices, including tracking targets, average weight, chain distribution, and indicator category statistics.

---

## 4. 证据链详情页 | Evidence Chain Detail Page

证据链详情页是 FangClaw 可解释性的核心页面，完整展示一次 AI 因果分析的全部过程和结果。

The Evidence Chain Detail Page is the core explainability page of FangClaw, fully displaying the entire process and results of an AI causal analysis.

**访问方式 Access Methods:**

- 从变更日志中点击证据链 ID 链接
- 从因果分析结果中点击证据链 ID 链接
- 直接访问 URL：`/evidence/{evidence-id}`

**页面内容 Page Content:**

证据链详情页包含六个区域，按分析流程从上到下排列：

The detail page contains six sections, arranged from top to bottom following the analysis flow:

| 区域 Section | 内容 Content |
|---|---|
| 消息来源 Source Message | 原始输入消息的完整文本、来源类型和原文链接 |
| 分析概要 Analysis Summary | 整体影响评估、置信度进度条、识别实体标签、触发指标标签 |
| 推理过程 Reasoning Chain | AI 的因果推理步骤，以时间线形式展示推理链条 |
| 公司池影响 Company Impacts | 每家受影响公司的权重变化详情和影响原因 |
| 线下验证清单 Verification Checklist | 3 个需要人工线下验证的问题，帮助投资者确认 AI 分析的准确性 |
| 关联变更日志 Related Change Logs | 与本次分析相关的所有系统变更记录 |

---

## 5. 左侧边栏 | Left Sidebar

左侧边栏提供系统的全局视图和快速统计。

The left sidebar provides a global system view and quick statistics.

| 区域 Area | 说明 Description |
|---|---|
| 任务简报 Mission Brief | 当前投研主题（AI 算力/半导体链）和市场分类（A 股/H 股） |
| 锚定公司 Anchor Companies | 产业链核心标的（NVIDIA、台积电、ASML），附带简要描述和关注指标 |
| 统计面板 Stats Panel | 跟踪目标总数和平均权重 |
| 产业链分布 Chain Distribution | 上游/中游/下游公司数量的可视化柱状图 |
| 指标分类 Indicator Categories | 宏观/中观/微观/因子四类指标数量的可视化柱状图 |

---

## 6. 信息来源与可信度 | Data Sources & Reliability

FangClaw 的数据和分析结果来自以下来源，用户应了解各类信息的可信度级别。

FangClaw's data and analysis results come from the following sources. Users should understand the reliability level of each type of information.

| 数据类型 Data Type | 来源 Source | 可信度 Reliability | 说明 Notes |
|---|---|---|---|
| 公司基础信息 Company Info | 系统预设 Pre-configured | 高 High | 股票代码、公司名称、产业链位置等基础信息由系统初始化时预设 |
| 指标定义 Indicator Definitions | 投研团队 Research Team | 高 High | 20 个指标的定义、阈值和分类由专业投研团队设计 |
| AI 分析结果 AI Analysis | AI 大模型 LLM | 中 Medium | AI 基于上下文生成的分析结果，需结合线下验证清单进行人工确认 |
| 权重调整 Weight Adjustments | AI 自动计算 AI Auto | 中 Medium | 权重变化由 AI 分析驱动，每次调整幅度限制在 -3 到 +3 之间 |
| 证据链 Evidence Chains | 系统自动记录 Auto-recorded | 高 High | 完整记录分析过程，确保可追溯性 |

> **重要提示 Important Notice:** FangClaw 的 AI 分析结果仅供参考，不构成投资建议。所有分析结果都附带线下验证清单，建议用户在做出投资决策前完成人工验证。
>
> FangClaw's AI analysis results are for reference only and do not constitute investment advice. All analysis results include offline verification checklists, and users are advised to complete manual verification before making investment decisions.

---

## 7. 常见问题 | FAQ

**Q1: 权重是如何计算的？How is the weight calculated?**

权重由 AI 因果分析引擎根据输入的市场消息自动调整。每次分析可对受影响公司的权重进行 -3 到 +3 的调整，最终权重范围限制在 1-10 之间。权重反映的是近期市场信号对该公司的综合影响评估。

**Q2: 为什么某些指标显示"触发"状态？Why do some indicators show "Triggered" status?**

当 AI 分析引擎判断某条市场消息与特定指标相关时，该指标状态会自动变为"触发"。这意味着该领域出现了值得关注的变化，投资者应密切关注相关公司的动态。

**Q3: 证据链 ID 的格式是什么？What is the format of the Evidence Chain ID?**

证据链 ID 格式为 `EC-YYYYMMDD-XXXX`，其中 `YYYYMMDD` 是分析日期，`XXXX` 是随机后缀。每个 ID 唯一标识一次完整的 AI 因果分析过程。

**Q4: 如何验证 AI 分析的准确性？How to verify the accuracy of AI analysis?**

每次 AI 分析都会生成 3 个线下验证问题。建议投资者通过以下方式验证：查阅原始新闻来源、对比公司公告、咨询行业专家、观察市场反应。

**Q5: 系统支持哪些市场？Which markets does the system support?**

当前版本聚焦 AI 算力/半导体产业链，覆盖 A 股（上交所、深交所）和美股（NASDAQ、NYSE）的 30 家核心公司。

---

*FangClaw v2.0 — 让每一次投研决策都有据可查*

*FangClaw v2.0 — Making every research decision traceable and explainable*
