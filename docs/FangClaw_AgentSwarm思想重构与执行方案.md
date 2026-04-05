# FangClaw → StockClaw：Agent Swarm 时代的思想重构与可落地执行方案

**文档版本**：v1.0 | **日期**：2026-04-04 | **作者**：Manus AI

---

## 一、文档背景与目的

本文档综合了三份核心输入材料——AI-Trader 开源项目（HKUDS/AI-Trader，GitHub 12.1k Stars）的架构分析、OpenClaw 范式定义（腾讯云技术百科收录）、以及 Agentic Engineering 时代七大战略启发（涵盖 Public 券商 AI Agent、KPMG 2026 Q1 调查、Goldman Sachs CIO 预测、Moody's 非显而易见关联、CFA Institute Agentic AI 工作流标准、花旗银行认知债务概念等权威来源），对 FangClaw 项目进行系统性的思想重构，并提出可在现有代码框架内直接落地的执行方案。

本文档的核心主张是：**FangClaw 不应仅仅是一个"可解释动态投研看板"，而应重新定位为 Agent Swarm 时代的"非显而易见关联发现引擎"（Non-Obvious Correlation Discovery Engine）**，在保持现有技术架构的基础上，通过理念升级和增量改进，实现从"被动分析工具"到"主动认知增强平台"的跃迁。

---

## 二、思想重构：从 FangClaw 到 StockClaw 的范式跃迁

### 2.1 旧范式：FangClaw 作为"投研看板"

FangClaw 当前的产品定位是"可解释动态投研看板"，核心工作流为：用户输入消息 → AI 因果推理 → 更新公司池权重 → 生成证据链 → 返回情景推演。这个模式的本质是**被动响应式分析**——系统等待用户提问，然后给出答案。

这个定位在产品初期是合理的，但在 Agent Swarm Intelligence 时代，它面临三个根本性局限。第一，**信息延迟**：用户必须先发现值得分析的信息，然后才能输入系统，这意味着系统永远比市场慢一步。第二，**认知瓶颈**：用户只能分析自己想到的问题，而最有价值的发现往往是"你不知道你不知道的"（unknown unknowns）。第三，**规模天花板**：系统的分析产出完全取决于用户的输入频率，无法自主扩展分析覆盖面。

### 2.2 新范式：StockClaw 作为"Agent Swarm 认知增强引擎"

基于 AI-Trader 的 Agent Swarm Intelligence 架构和 Moody's 提出的"非显而易见关联"概念，StockClaw 的新范式应包含以下核心理念转变：

| 维度 | 旧范式（FangClaw） | 新范式（StockClaw） |
|------|-------------------|-------------------|
| 驱动模式 | 用户输入驱动（被动） | Agent 蜂群自主发现（主动） |
| 分析单元 | 单条消息 → 单次分析 | 多源数据交叉 → 持续发现 |
| 价值主张 | "帮你分析这条消息的影响" | "发现你看不到的关联" |
| 信号质量 | 单一 LLM 判断 | 多 Agent 共识投票 |
| 用户角色 | 信息输入者 + 结果接收者 | 认知增强的决策者 |
| 产品定位 | 投研看板 | 非显而易见关联发现引擎 |

### 2.3 Agent Swarm 五层架构

参考 AI-Trader 的 Agent Swarm Intelligence 设计和 CFA Institute 发布的 Agentic AI 金融工作流标准，StockClaw 的 Agent 协同架构应分为五个层级：

**Level 1 — 采集蜂群**：6 个数据维度的采集 Agent 各自独立运行，持续从财报、新闻、行业动态、政策文件、资金流向、市场情绪六大数据源采集信息。这是 StockClaw 的核心壁垒——数据血脉（Data Lineage）。即使竞争对手使用相同的 LLM，没有相同的数据采集管道，输出结果就是不同的。

**Level 2 — 分析蜂群**：交叉比对 Agent 在 6 个维度之间做 C(6,2)=15 种交叉组合分析，自动发现候选因子。这对应 Gu, Kelly & Xiu (2020) 在 *The Review of Financial Studies* 上证明的"非线性交互效应"——多源交叉推理是单一数据源分析无法替代的。

**Level 3 — 验证蜂群**：统计检验 Agent + 经济学逻辑 Agent + 回测 Agent 对每个候选因子进行独立投票。只有多数 Agent "同意"的因子才进入下一层。这是防止过拟合的核心机制——学术文献反复警告，在 15 种交叉组合中很容易产生虚假相关。

**Level 4 — 共识层**：汇总所有 Agent 的投票结果，计算综合置信度，并标注支持和反对的 Agent 意见。这体现了花旗银行提出的"认知增强而非认知替代"理念——用户不仅看到结论，还看到推理过程和分歧。

**Level 5 — 执行建议层**：用自然语言输出给用户，附带置信度、反对意见和免责声明。保持"投研看板"定位，不做交易执行，把最终决策权留给用户。

### 2.4 与 OpenClaw 生态的关系

AI-Trader 项目已经定义了 OpenClaw compatible 的 Agent 标准。StockClaw 在 OpenClaw 时代的定位不应该是"另一个 OpenClaw 平台"，而应该是**"OpenClaw 生态中最强的中国市场 Agent 集群"**。这意味着 StockClaw 的 Agent 可以同时服务于两个市场：自有平台面向中国投资者，同时作为"中国市场专家 Agent"接入全球 OpenClaw 平台。

StockClaw 与通用 OpenClaw 范式的核心差异在于四个方面：数据源层面，通用 OpenClaw 主要使用公开市场数据（价格、订单簿），而 StockClaw 使用 6 大异构数据源交叉比对；Agent 类型层面，通用 OpenClaw 是通用交易 Agent（买卖信号），而 StockClaw 是专业化分析 Agent 矩阵（15 个 Agent 各司其职）；市场层面，通用 OpenClaw 主要面向美股和加密货币，而 StockClaw 专注 A 股 + 港股 + 中国特色数据（北向资金、政策市、涨跌停）；模式层面，通用 OpenClaw 的 Agent 之间是竞争关系（谁的信号更准），而 StockClaw 的 Agent 之间是协作关系（交叉验证，蜂群共识）。

---

## 三、AI-Trader 开源项目启发分析

### 3.1 AI-Trader 核心架构解析

AI-Trader（GitHub 12.1k Stars，2k Forks）是香港大学 HKUDS 团队开发的 Agent Swarm Intelligence 交易平台，其核心特征包括：OpenClaw compatible 的 Agent 信号发布与交易市场、跟单交易（Copy Trading）功能、多市场支持（US Stock, A-Share, Crypto, Polymarket, Forex, Options, Futures）、三种信号类型（Strategies / Operations / Discussions）、积分系统（发布信号 +10 分，被采纳 +1 分/follower）、以及 Paper Trading（$100k 模拟资金）。

### 3.2 对 StockClaw 的六条启发

**启发 A：信号分层机制值得借鉴**。AI-Trader 将信号分为 Strategies（策略讨论）、Operations（买卖操作）和 Discussions（社区讨论）三类。StockClaw 可以借鉴这个分层思路，将系统输出分为"因子发现"（发现异常模式）、"因子验证"（经过回测验证的因子）和"风险预警"（因子衰减或拥挤度警告）三个层级，让用户清楚每条信息的可信度和用途。

**启发 B：积分/信誉系统可用于因子质量追踪**。AI-Trader 的积分系统（发布信号 +10，被采纳 +1/follower）本质上是一个信号质量的市场化评价机制。StockClaw 虽然不是开放平台，但可以为每个因子建立"信誉分"——基于历史准确率、分析一致性回测结果和用户反馈，动态调整因子的展示优先级和置信度权重。

**启发 C：Paper Trading 模式可转化为"因子模拟验证"**。AI-Trader 提供 $100k 模拟资金的 Paper Trading 功能。StockClaw 不做交易执行，但可以借鉴这个思路，提供"因子模拟验证"功能——用户选择一个因子，系统用历史数据模拟"如果按这个因子操作，过去 N 个月的分析方向准确率是多少"。这就是 P2-A 设计文档中的"分析一致性回测"。

**启发 D：Financial Events Dashboard 验证了"一站式信息聚合"的价值**。AI-Trader 在 2026 年 3 月新增了 Financial Events Dashboard（ai4trade.ai/financial-events），将所有关键信息汇聚到一个面板。StockClaw 的首页已经实现了类似的设计（公司池 + 六维因子 + 变更日志 + 态势概览），但可以进一步增强——将因子发现结果、异常信号和因子衰减预警也整合到首页的信息流中。

**启发 E：SKILL.md 自注册机制启示了"可扩展 Agent 协议"的可能性**。AI-Trader 的 Agent 注册方式极其简洁——只需告诉 Agent "Read https://ai4trade.ai/SKILL.md and register"。这种自描述、自注册的协议设计，为 StockClaw 未来开放第三方 Agent 接入提供了参考模式。虽然当前阶段不需要实现，但应在架构设计中预留扩展点。

**启发 F：PostgreSQL 迁移验证了数据持久化的重要性**。AI-Trader 近期从轻量级数据库迁移到 PostgreSQL（Migrate backend to PostgreSQL and harden compatibility #175），说明随着数据量增长，数据库选型至关重要。StockClaw 当前使用 TiDB/MySQL，已经是生产级数据库，这个选择是正确的。

### 3.3 可行性总评

| 启发 | 可落地性 | 实施路径 | 预估工时 |
|------|---------|---------|---------|
| A：信号分层 | 高度可行 | 在因子发现结果中增加"类型"字段（discovery/verified/warning） | 30 min |
| B：因子信誉分 | 可行（简化版） | 在 indicators 表增加 accuracyScore 字段，基于回测结果更新 | 2 h |
| C：因子模拟验证 | 高度可行 | 即 P2-A 分析一致性回测，已在 v3.0 后端实现 | 已完成 |
| D：首页信息流增强 | 高度可行 | 在首页增加"最新发现"和"异常预警"卡片 | 1.5 h |
| E：可扩展 Agent 协议 | 未来路线图 | 当前阶段仅预留接口扩展点 | 0 |
| F：数据库选型 | 已满足 | 当前 TiDB/MySQL 已是生产级 | 0 |

---

## 四、Agentic Engineering 七大战略启发的落地分析

### 4.1 启发一：从"AI 辅助交易"到"Agent 替你交易"

**原始启发**：纽约券商 Public 已推出 AI 交易 Agent，投资者可用自然语言编程交易策略。KPMG 2026 Q1 调查显示 54% 的企业已部署 AI Agent。

**对 StockClaw 的落地分析**：StockClaw 的定位是"投研看板"而非"自动交易"，这个定位在当前阶段是正确的——合规风险、技术复杂度和用户信任都需要时间积累。但可以在现有框架内增加一个"自然语言意图表达"功能：用户不再只是输入一条消息让系统分析，而是可以描述一个监控意图（如"当北向资金连续 3 天流入且新闻情绪从负转正时，提醒我"），系统将其转化为监控规则并持续运行。

**可落地改进**：在认知引擎中增加"监控意图"模式——用户用自然语言描述关注条件，系统将其解析为结构化的监控规则，存入数据库，当条件满足时在首页展示提醒。这本质上是 P0-A 因子发现模式的"用户定制版"。

**实施难度**：中等。需要新增一个 `monitoringRules` 数据库表和对应的 tRPC 接口，以及前端的规则管理 UI。预估工时 4-5 小时。**建议列入第二阶段路线图**，当前阶段优先完成 v3.0 因子发现引擎的基础功能。

### 4.2 启发二：OpenClaw 生态与 Agent 信号市场

**原始启发**：AI-Trader 已创建 OpenClaw compatible 的 Agent 交易信号市场。腾讯云技术百科收录了 OpenClaw 作为"金融基础设施的范式革命"。

**对 StockClaw 的落地分析**：当前阶段 StockClaw 应走"封闭模式"——自己做 Agent 集群，自己提供分析信号。原因有三：第一，产品尚未经过市场验证，过早开放平台会分散精力；第二，中国市场的合规环境对"信号交易市场"有严格限制；第三，核心壁垒（数据血脉 + 交叉推理能力）需要先在封闭环境中打磨成熟。

**可落地改进**：在架构层面预留 OpenClaw 兼容性。具体来说，在 `server/routers.ts` 中为每个分析接口的返回值增加标准化的 `signalType`（discovery/verified/warning）和 `confidence` 字段，使未来对接 OpenClaw 生态时只需增加一个适配层，而非重构核心逻辑。

**实施难度**：低。仅需在现有接口返回值中增加 2 个字段。预估工时 30 分钟。**建议立即执行**。

### 4.3 启发三：微软 Qlib + RD-Agent 自动化因子研发

**原始启发**：微软 Qlib 是 AI 导向的量化投资开源平台，RD-Agent 是 LLM 驱动的自主因子研发 Agent。

**对 StockClaw 的落地分析**：Qlib 和 RD-Agent 是 Python 生态的量化工具，而 StockClaw 是 TypeScript/Node.js 技术栈的 Web 应用。直接集成 Qlib 需要引入 Python 后端服务，这会显著增加系统复杂度。但 Qlib 的核心思想——"自动化因子发现 + 回测 + 优化"——已经在 StockClaw 的 v3.0 设计中体现（`causal.discover` + `evidence.backtest` + 因子衰减监控）。

**可落地改进**：不直接集成 Qlib，但借鉴其因子研发流程设计 StockClaw 的因子生命周期管理。具体来说，在因子发现结果中增加"因子状态"字段（candidate → validated → active → decaying → retired），并在 UI 中用不同颜色标注。这已经在 v3.0 后端的 `factorTemplates` 表中实现了 `status` 字段。

**实施难度**：低。后端已实现，仅需在前端因子模板列表中展示状态标签。预估工时 30 分钟。**建议立即执行**。

### 4.4 启发四：CFA Institute Agentic AI 金融工作流标准

**原始启发**：CFA Institute 发布了 Agentic AI 金融工作流标准案例，给出了"获取标的 → 拉取财务数据 → 判断经济体制 → 计算体制特定指标 → 数据验证 → 生成评分评估"的标准流程。

**对 StockClaw 的落地分析**：StockClaw 的现有工作流与 CFA 标准高度吻合。目标池（获取标的）→ 六维因子框架（拉取多维数据）→ AI 因果推理（判断因果关系）→ 证据链（数据验证）→ 情景推演（生成评估）。但 CFA 标准中有一个 StockClaw 尚未实现的关键环节——**"判断经济体制"**（扩张/收缩/滞胀/衰退）。

**可落地改进**：在因子发现的 System Prompt 中增加"宏观经济体制判断"维度。具体来说，要求 LLM 在分析时先判断当前宏观环境属于哪种体制（扩张期/收缩期/政策转向期/流动性收紧期），然后基于体制特征调整因子权重。例如，在政策转向期，政策维度的因子权重应自动提升。

**实施难度**：低。仅需修改 System Prompt，增加约 200 字的体制判断规则。预估工时 20 分钟。**建议立即执行**。

### 4.5 启发五：Moody's "非显而易见关联"

**原始启发**：Moody's 分析报告指出，AI Agent 的杀手应用是"检测非显而易见的关联（non-obvious correlations）"。使用 Research Assistant 的用户消费了多 60% 的研究内容，任务完成时间缩短 30%。

**对 StockClaw 的落地分析**：这是 StockClaw 最核心的价值主张验证。StockClaw 的交叉比对矩阵（6 维度 × 15 种组合）正是在做"非显而易见关联"的发现。但当前系统在 UI 层面没有突出这个价值——用户看到的是"六维因子框架"和"证据链"，而非"我们帮你发现了什么别人看不到的关联"。

**可落地改进**：在因子发现结果和因子热力矩阵中，将"非显而易见关联"作为核心叙事。具体来说：（1）因子发现结果的标题从"异常模式"改为"非显而易见关联发现"；（2）因子热力矩阵的标题从"维度共振矩阵"改为"非显而易见关联热力图"；（3）在每个交叉因子的描述中增加"为什么这个关联不是显而易见的"解释。

**实施难度**：低。仅需修改前端文案和 Prompt 中的输出要求。预估工时 30 分钟。**建议立即执行**。

### 4.6 启发六：Open Cloud 三层架构

**原始启发**：OpenBB 构建了金融 AI 开放工作空间（本地部署 + 自带模型 + 连接所有数据）。QuantConnect 推出了 Mia Agentic AI 助手。NautilusTrader 提供纳秒级精度交易引擎。

**对 StockClaw 的落地分析**：StockClaw 当前是 SaaS 模式（云端部署），不需要立即支持本地部署。但"连接所有数据"的理念值得借鉴——当前系统的数据完全来自 AI 分析引擎的输出，没有直接接入外部数据 API（如 Tushare、AKShare 等 A 股数据接口）。

**可落地改进**：在架构层面预留"外部数据源接入"能力。具体来说，在 `server/db.ts` 中定义一个 `DataSourceAdapter` 接口，当前的 AI 分析引擎作为默认实现，未来可以增加 Tushare、AKShare 等数据源适配器。这不需要立即实现外部数据接入，只是在代码中预留扩展点。

**实施难度**：低。仅需定义接口类型，不需要实际实现。预估工时 20 分钟。**建议列入第二阶段路线图**。

### 4.7 启发七：认知增强而非认知替代

**原始启发**：花旗银行提出"认知债务（Cognitive Debt）"概念——当 AI 接管越来越多决策时，人类投资者面临失去判断力的风险。CFA Institute 指出深度学习模型缺乏可解释性，容易产生"幻觉"。

**对 StockClaw 的落地分析**：这是 StockClaw 最重要的差异化方向。在 OpenClaw 生态中，大量 Agent 会走"全自动黑箱"路线。StockClaw 反其道而行之，走"透明增强"路线，反而能赢得最有价值的客户群——那些想理解市场的投资者。

**可落地改进**：在现有框架内强化四个"认知增强"设计。第一，**透明推理链**：在每个分析结果中展示完整的推理过程（已在证据链系统中实现）。第二，**反对意见展示**：在因子发现结果中，不仅展示"发现了什么"，还展示"为什么这个发现可能是错的"（需要在 Prompt 中增加"反对论点"要求）。第三，**置信度分级**：将所有分析结果按置信度分为高/中/低三级，用不同颜色标注（需要在前端增加条件样式）。第四，**免责声明**：在所有 AI 分析结果底部统一展示免责声明（已在 v3.0 后端实现 `system.disclaimer` 接口）。

**实施难度**：中等。反对意见展示需要修改 Prompt 和前端组件，置信度分级需要修改前端样式。预估工时 2 小时。**建议立即执行**。

---

## 五、综合可落地执行方案

### 5.1 立即执行清单（本次迭代）

以下改进项可在现有代码框架内直接执行，不需要新增外部依赖或架构变更：

| 序号 | 执行项 | 来源 | 涉及文件 | 预估工时 |
|------|-------|------|---------|---------|
| E1 | 在 System Prompt 中增加"宏观经济体制判断"维度 | 启发四（CFA） | `server/routers.ts` | 20 min |
| E2 | 在 System Prompt 中增加"反对论点"输出要求 | 启发七（认知增强） | `server/routers.ts` | 20 min |
| E3 | 将因子发现结果标题改为"非显而易见关联发现" | 启发五（Moody's） | 前端组件 | 15 min |
| E4 | 在分析接口返回值中增加 signalType 和 confidence 标准化字段 | 启发二（OpenClaw） | `server/routers.ts` | 30 min |
| E5 | 在前端因子模板列表中展示因子状态标签 | 启发三（Qlib） | 前端组件 | 30 min |
| E6 | 在因子发现 Prompt 中增加"为什么这个关联不是显而易见的"解释要求 | 启发五（Moody's） | `server/routers.ts` | 15 min |
| E7 | 在分析结果中增加置信度分级颜色标注 | 启发七（认知增强） | 前端组件 | 30 min |

**立即执行合计预估工时**：约 2.5 小时

### 5.2 第二阶段路线图（下一迭代）

| 序号 | 执行项 | 来源 | 预估工时 |
|------|-------|------|---------|
| F1 | 实现"监控意图"模式（自然语言 → 监控规则） | 启发一（Public） | 4-5 h |
| F2 | 首页信息流增强（最新发现 + 异常预警卡片） | 启发 D（AI-Trader） | 1.5 h |
| F3 | 因子信誉分系统（基于回测结果动态更新） | 启发 B（AI-Trader） | 2 h |
| F4 | 预留外部数据源接入接口 | 启发六（Open Cloud） | 20 min |

### 5.3 长期路线图（未来 3-6 个月）

| 阶段 | 目标 | 参考对象 |
|------|------|---------|
| Phase 1（当前） | 信号引擎：Agent 集群采集 + 交叉比对 + 因子发现 | StockClaw v3.0 |
| Phase 2（Q3 2026） | 开放平台：允许第三方创建 Agent，信号交易市场 | AI-Trader/OpenClaw |
| Phase 3（Q4 2026） | 执行闭环：对接券商 API，自然语言 → 监控 → 提醒 | Public, QuantConnect |
| Phase 4（2027 H1） | 数据主权：本地部署 + 私有模型 + 私有数据 | OpenBB |
| Phase 5（2027 H2） | 生态系统：Agent 开发者生态 + 数据供应商生态 | App Store 模式 |

---

## 六、商业模式演进路径

基于 AI-Trader 的模式和 Agentic Engineering 时代的趋势，StockClaw 的商业模式应分三层演进：

**第一层：卖工具（SaaS）**——当前阶段。StockClaw 作为一个产品，用户按月付费使用。优点是简单直接，可快速验证产品市场契合度。缺点是增长有上限，用户获取成本高。金价提醒文章的启发在此处尤为重要：通过"免费基础功能 + 付费高级功能"的分层模式，降低用户获取成本。免费层提供基础的公司池浏览和变更日志，付费层提供 AI 因果推理、因子发现和证据链分析。

**第二层：卖信号（Signal-as-a-Service）**——Phase 2 阶段。StockClaw 的 Agent 产出的分析信号，按信号收费或按使用量计费。优点是与用户价值直接挂钩。缺点是合规风险（需明确定位为"信息服务"而非"投资顾问"）。

**第三层：收税（Platform Tax）**——Phase 5 阶段。StockClaw 成为一个 Agent 信号市场，任何开发者都可以发布 Agent，用户订阅，StockClaw 对每笔交易抽成。优点是网络效应，赢者通吃。缺点是需要规模，冷启动难。

---

## 七、核心护城河演化

| 阶段 | 核心护城河 | 不可复制性 |
|------|-----------|-----------|
| Phase 1 | 数据采集能力（6 大异构数据源的采集 Agent） | 高——数据血脉是独有的 |
| Phase 2 | 网络效应（Agent 越多 → 信号越丰富 → 用户越多） | 极高——先发优势 + 数据飞轮 |
| Phase 3 | 执行能力 + 合规资质 | 高——合规牌照是硬壁垒 |
| Phase 4 | 数据主权方案 + 企业级安全 | 中——技术可复制但信任难建立 |
| Phase 5 | 生态锁定（开发者 + 数据供应商 + 用户） | 极高——生态一旦形成极难颠覆 |

---

## 八、与之前分析文档的关系

本文档是对以下三份分析文档的整合与升级：

| 文档 | 核心内容 | 与本文档的关系 |
|------|---------|--------------|
| 学术验证启发与改进建议分析 | 8 项改进建议 + 24 个可执行单元 | 本文档的 E1-E7 是对其中 R1-R8 的补充和深化 |
| 金价提醒启发与付费获客执行方案 | 付费分层 + 提醒机制 + 获客策略 | 本文档第六节商业模式演进路径的基础 |
| 本文档 | Agent Swarm 思想重构 + 综合执行方案 | 统领性文档，整合所有启发为统一的战略框架 |

---

## 九、总结

StockClaw 在 Agent Swarm 时代的核心战略可以用一句话概括：

> **不做最聪明的单个 Agent，做中国市场最强的 Agent 蜂群 + 最透明的认知增强平台。用数据血脉做壁垒，用蜂群共识做质量，用透明推理做差异化，用"非显而易见关联发现"做价值主张。**

当前阶段（Phase 1）的重点是：完成 v3.0 因子发现引擎的全量实施，同时将 Agent Swarm 的理念融入现有架构——不是推倒重来，而是在现有代码框架内通过 Prompt 增强、字段标准化、UI 叙事调整和认知增强设计，让系统从"投研看板"自然演进为"非显而易见关联发现引擎"。

本文档提出的 7 项立即执行改进（约 2.5 小时）+ 4 项第二阶段改进（约 8 小时），加上之前学术验证分析文档的 24 个可执行单元（约 18.5 小时），构成了 StockClaw v3.0 的完整实施蓝图。

---

## 参考来源

[1]: Public 券商 AI 交易 Agent. AdvisorHub, 2026. https://www.advisorhub.com/new-york-brokerage-public-pitches-stock-trading-ai-agents/

[2]: KPMG 2026 Q1 AI Pulse Survey. https://kpmg.com/us/en/media/news/q1-ai-pulse2026.html

[3]: Goldman Sachs CIO Marco Argenti AI 预测. https://www.goldmansachs.com/insights/articles/what-to-expect-from-ai-in-2026-personal-agents-mega-alliances

[4]: AI-Trader (HKUDS). GitHub. https://github.com/HKUDS/AI-Trader

[5]: OpenClaw 腾讯云技术百科. https://www.tencentcloud.com/techpedia/140952

[6]: Microsoft Qlib. GitHub. https://github.com/microsoft/qlib

[7]: CFA Institute Agentic AI for Finance. https://rpc.cfainstitute.org/research/the-automation-ahead-content-series/agentic-ai-for-finance

[8]: Moody's Agentic AI in Financial Services. https://www.moodys.com/web/en/us/creditview/blog/agentic-ai-in-financial-services.html

[9]: OpenBB. https://openbb.co/

[10]: QuantConnect. https://www.quantconnect.com/

[11]: NautilusTrader. https://nautilustrader.io/

[12]: Citi AI in Investment Management. https://www.citigroup.com/global/insights/ai-in-investment-management

[13]: McKinsey 2025 Global AI Survey. https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai
