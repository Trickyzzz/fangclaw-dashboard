# FangClaw 全栈升级 - 因果闭环 Demo

## Phase 1: 升级全栈 + 数据库
- [x] 执行 webdev_add_feature("web-db-user") 升级
- [x] 创建数据库表：companies, indicators, change_logs, evidence_chains
- [x] 种子数据：将 30 家公司和 20 个指标写入数据库

## Phase 2: 后端 API
- [x] GET /api/companies - 获取公司池（支持筛选排序）
- [x] GET /api/indicators - 获取指标框架
- [x] GET /api/changelog - 获取变更日志
- [x] POST /api/analyze - 消息分析入口（因果闭环核心）

## Phase 3: AI 因果推理引擎
- [x] 消息解析：提取实体（公司/行业/事件类型）
- [x] 因子匹配：将消息映射到 20 指标中的相关因子
- [x] 影响评估：AI 判断对公司池中哪些公司产生影响
- [x] 权重调整：根据影响方向和强度自动调整权重
- [x] 证据链生成：记录完整的推理过程
- [x] 线下验证清单生成（3个验证问题）

## Phase 4: YahooFinance 行情
- [ ] 接入 get_stock_chart API 获取实时价格
- [ ] 在公司池中展示最新价格和涨跌幅

## Phase 5: 前端改造
- [x] 所有数据从 API 获取（替代硬编码）
- [x] 新增"因果分析面板"：用户输入消息 → AI分析 → 实时看到公司池变动
- [x] 实时刷新变更日志
- [x] StatusBar 实时数据
- [x] StatsPanel 实时统计
- [x] CompanyPool API 集成
- [x] IndicatorFramework API 集成
- [x] ChangeLog API 集成

## Phase 6: 测试交付
- [x] Vitest 单元测试（13个测试全部通过）
- [x] 保存 checkpoint 并交付

## 待实现功能（长期规划，不阻塞当前交付）
- [ ] 实时股票价格获取（YahooFinance 集成）
- [ ] 自动化调度（定时新闻抓取 cron job）
- [ ] 推送通知集成（飞书/企业微信）
- [x] 证据链详情页面

## 补充测试
- [x] causal.analyze 成功路径测试（mock LLM，验证 DB 更新）

## 证据链详情页
- [x] 创建 EvidenceDetail 页面组件（展示完整分析过程）
- [x] 在 App.tsx 中注册 /evidence/:id 路由
- [x] 从因果分析面板和变更日志中添加跳转链接
- [x] 编写证据链详情页相关测试

## 布局修复 & 使用文档
- [x] 修复公司池列表中间黑色空白过宽问题
- [x] 生成网站使用文档（中英双语，说明信息来源和使用方法）

## v2.2 布局优化 & PPT 逻辑对齐
- [x] 全局字体增大（标题/正文/数据字体均放大，行高增大）
- [x] Tab 标签重命名对齐 PPT 四层架构（态势大屏/目标池/六维因子/认知引擎/证据链/风控面板）
- [x] 左侧边栏优化：增大字体，信息更清晰
- [x] StatusBar 优化：增大字体和间距
- [x] CompanyPool 优化：增大字体，增加六维因子简要展示
- [x] IndicatorFramework 重构为"六维因子"视图（基本面/技术面/资金行为/事件驱动/情绪/替代数据）
- [x] 因果分析 Tab 重命名为"认知引擎"并优化布局
- [x] 变更日志 Tab 重命名为"证据链"
- [x] 新增"风控面板"Tab（因子拥挤度/行为金融干预提示）
- [x] 态势概览重构为"战场态势"大屏视图

## v2.3 P0/P1/P2 功能升级
### 设计文档
- [x] 撰写 P0/P1/P2 详细设计文档

### P0 - 六维因子网格卡片
- [x] 重构 IndicatorFramework 顶部为 2×3 网格卡片
- [x] 每个卡片显示维度名称、触发数/总数、健康度评分、迷你条形图
- [x] 点击卡片筛选该维度下的指标列表

### P0 - 情景推演模块
- [x] 修改 causal.analyze LLM prompt 增加 scenarios 字段
- [x] 修改 JSON Schema 增加 base/bull/bear 三种情景
- [x] 前端 CausalAnalysis 组件增加情景推演卡片展示
- [x] 证据链详情页增加情景推演区块

### P1 - 迷你行动卡
- [x] 后端新增 companies.latestAnalysis 接口
- [x] CompanyPool 展开行增加 AI 评级、方向信号、因子触发数
- [x] 展开行增加跳转到证据链详情页

### P1 - 关键变量监控
- [x] 新增 keyVariables 数据库表
- [x] 后端新增 keyVariables CRUD 接口
- [x] Seed 初始关键变量数据
- [x] RiskPanel 增加关键变量监控表格

### P2 - 目标池热力图
- [x] 前端直接使用 useCompanies 数据渲染气泡图（无需额外后端接口）
- [x] StatsPanel 增加 Chart.js 气泡图可视化

### P2 - 推理可视化
- [x] 证据链详情页推理过程改为因果链流程图
- [x] 节点标注事件/实体→影响路径→受影响公司

## v3.0 因子发现引擎全量实施
### P0-A 因子发现模式
- [x] 后端新增 causal.discover 接口（LLM 主动扫描）
- [x] 前端新增 FactorDiscovery 组件（主动发现模式）
- [x] Home.tsx 增加"因子发现"Tab

### P0-B 交叉因子标签
- [x] indicators 表新增 crossDimension 字段
- [x] 种子数据更新交叉因子标签
- [x] 后端 detectAnomalies 包含交叉维度异常检测

### P1-C 拥挤度动态计算
- [x] 后端新增 risk.crowding 动态计算接口
- [x] calculateCrowding 函数实现权重/指标/方向一致性三维拥挤度

### P1-B 异常信号标记
- [x] 后端新增 companies.anomalies 接口
- [x] detectAnomalies 函数实现权重异动/多重触发/交叉维度异常检测

### P1-A 十大因子模板
- [x] 新增 factorTemplates 数据库表
- [x] 后端新增 factorTemplates.list 接口
- [x] Seed 十大因子模板数据（动量反转/估值修复/事件驱动等）

### P2-B 因子热力矩阵
- [x] 后端新增 indicators.heatmap 接口
- [x] getFactorHeatmap 函数实现 6×6 维度交叉矩阵
- [x] 前端新增 FactorHeatmap 组件 + "因子热力"Tab

### P2-A 因子回测模拟
- [x] 后端新增 evidence.backtest 接口
- [x] runSimpleBacktest 函数实现历史回测模拟

### 总结
- [x] 编写全量 Vitest 测试（41 个测试全部通过）
- [x] 撰写 v3.0 总变更日志文档（已整合到 v3.1 技术更新说明书）
- [x] 保存检查点 (version: a54ad680)

### 学术验证改进建议执行
- [x] R2 因子质量验证：causal.analyze Prompt 增加经济学逻辑检验
- [x] R3 因子生命周期：indicators 表新增 firstTriggeredAt/triggerCount 字段
- [x] R4 A股本土化 Prompt 增强：增加北向资金、涨跌停、T+1 等特殊规则
- [x] R7 免责声明组件：前端增加合规免责声明 + disclaimer.get 接口

### 技术更新说明书
- [x] 撰写 v3.1 技术更新说明书（中英双语，FangClaw_v3.1_技术更新说明书.md）

### Agent Swarm 时代思想重构
- [x] 撰写 Agent Swarm 时代 StockClaw 思想重构文档
- [x] 撰写 OpenClaw 启发分析与可落地执行方案
- [x] 后端 Agent Swarm 架构改进：Prompt 增加宏观体制判断/反对论点/非显而易见关联
- [x] 前端 CausalAnalysis 增加反对论点/宏观体制/非显而易见关联展示
- [x] 前端 FactorDiscovery 增加 counterArgument/nonObviousReason 展示
- [x] 撰写 Agent Swarm 技术更新说明书（已整合到 v3.1 技术更新说明书）

### AI-Trader 开源项目研究与改进
- [x] 深入研究 AI-Trader 开源项目架构
- [x] 撰写 AI-Trader 启发分析与改进建议文档（已整合到思想重构文档）
- [x] 撰写修正文档（已整合到思想重构文档）
- [x] 撰写改进文档（已整合到思想重构文档）
- [x] 执行可落地的代码改进（Prompt 增强 + 标准化字段 + 免责声明）

## E1 异常信号推送功能（已合并到 E1-E7 全量实施）

## E1-E7 商业化功能全量实施

### E1 异常信号推送
- [x] E1-1 新增 subscriptions 数据库表
- [x] E1-2 实现 detectAndNotify() 异常检测+推送函数
- [x] E1-3 实现 notifySubscribers() 多渠道推送函数（模拟推送，日志记录）
- [x] E1-4 新增 subscriptions CRUD tRPC 接口（list/create/update/delete/testPush）
- [x] E1-5 在 causal.analyze 末尾嵌入推送触发

### E2 每日摘要自动生成
- [x] E2-1 实现 generateDailySummary() 摘要生成函数
- [x] E2-2 新增 reports tRPC 接口（generateDaily/getDaily/recent）
- [x] E2-3 前端新增 DailyReport 页面（/reports）

### E3 订阅管理界面
- [x] E3-1 前端新增 Subscriptions 页面（/subscriptions）
- [x] E3-2 底部导航栏增加订阅入口

### E4 分层定价页面
- [x] E4-1 前端新增 Pricing 页面（/pricing，体验版/专业版/企业版三档）

### E5 结果导向落地页
- [x] E5-1 底部导航栏重构为商业化入口（每日摘要/订阅推送/升级方案）

### E6 免费试用入口
- [x] E6-1 新增 trials 数据库表
- [x] E6-2 后端新增 trials.register tRPC 接口
- [x] E6-3 前端新增 Trial 页面（/trial）

### E7 分析分享社交功能
- [x] E7-1 新增 shareTokens 数据库表
- [x] E7-2 后端新增 share.create + share.view tRPC 接口
- [x] E7-3 前端新增 SharedView 页面（/share/:token）
- [x] E7-4 EvidenceDetail 页面增加分享按钮

### 集成与测试
- [x] 路由集成（7 条新路由）+ 导航入口更新
- [x] 编写 E1-E7 全量 Vitest 测试（31 个测试全部通过）
- [x] 撰写 v3.2 商业化功能技术更新说明书
- [x] 保存检查点 v3.2 (version: b1c24cb7)

### 完整性补充
- [x] trials.remove 软删除接口
- [x] updateStatus 失败路径测试
- [x] 全部 72 个测试通过

### 实施缺口补齐
- [x] E1: 在 causal.discover 末尾嵌入 detectAndNotify 触发
- [x] E5: 新增独立结果导向落地页组件（/landing，价值主张/案例结果/CTA）
- [x] E6: 完善 trials CRUD（新增 updateStatus/expireAll 管理接口）
- [x] 补充边界条件测试（17 个测试全部通过）

## v3.3 可视化增强 & 交互优化（基于战略分析落地）

### 蜂群共识可视化（战略三落地）
- [x] 认知引擎分析结果增加“Agent投票矩阵”可视化（六维因子雷达图 + 方向投票）
- [x] 用图形化方式展示6个Agent的判断方向和置信度，替代纯文字推理过程
- [x] 分析结果顶部增加可视化摘要仪表盘（方向/置信度/影响范围一目了然）

### 分析结果简化 & 可视化（用户要求：减少文字堆砌）
- [x] 重构分析结果展示：用可视化卡片替代大段文字
- [x] 公司影响用可交互的权重变化卡片展示
- [x] 推理过程用可展开/折叠的流程节点替代纯文本

### 公司信息更新
- [x] 底部栏品牌信息更新为“乐石智能”
- [x] Landing/SharedView/Trial页面品牌信息同步更新
- [x] 后端 LLM Schema 增加 dimensionScores 字段
- [x] 测试用例更新适配新字段（72个测试全部通过）

## v3.4 可交互案例体验 & 视觉优化

### 视觉优化
- [x] 整合六维因子雷达图和Agent投票矩阵到统一分析结果视图
- [x] 优化统一视图的视觉呈现（布局/配色/交互）
- [x] 可视化卡片增加“查看完整分析报告”入口（跳转证据链详情页）

### 可交互预置案例
- [x] 前端预置案例数据（宇树科技上市→理工光科影响，点击后自动填充并调用 causal.analyze 接口）
- [x] 前端认知引擎增加“案例体验”入口按钮
- [x] 用户点击后自动填充案例消息并触发分析

### 案例指南文档
- [x] 研究宇树科技上市与理工光科的关联背景
- [x] 截取真实网站操作截图（10张截图）
- [x] 撰写图文并茂的案例操作指南文档（15页PDF）
