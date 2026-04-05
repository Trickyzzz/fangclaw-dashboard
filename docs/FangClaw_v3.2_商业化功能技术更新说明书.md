# FangClaw / StockClaw v3.2 技术更新说明书

## E1-E7 商业化功能全量实施

**版本号**：v3.2 Commercial Release
**发布日期**：2026-04-04
**撰写**：Manus AI

---

## 一、更新概述

本次更新在 v3.1 Agent Swarm 因子发现引擎的基础上，全量实施了 E1-E7 共 7 项商业化功能，完成了从"技术引擎"到"可付费产品"的关键跨越。核心目标是将已有的六维因子分析能力转化为用户可感知的持续服务，建立"引擎 → 推送 → 订阅 → 付费"的完整商业闭环。

本次新增 4 张数据库表、15 个后端 tRPC 接口、6 个前端页面、8 条路由，以及 31 个 Vitest 测试用例（含 17 个边界条件测试）。全部 72 个测试通过。

---

## 二、数据库变更

本次新增 4 张表，均通过 Drizzle ORM 定义并推送至 TiDB 数据库。

| 表名 | 用途 | 核心字段 |
|------|------|----------|
| `subscriptions` | E1 订阅管理 | userId, channel (email/feishu/wecom), channelAddress, frequency (realtime/daily/weekly), watchCompanies, watchDimensions, isActive |
| `daily_reports` | E2 每日摘要 | reportDate (唯一), content (JSON), pushStatus (pending/sent/failed) |
| `trials` | E6 免费试用 | contact, contactType (email/wechat), status (active/expired/converted), expiresAt |
| `share_tokens` | E7 分析分享 | token (唯一), evidenceId, userId, viewCount, expiresAt |

迁移文件位于 `drizzle/0005_deep_lionheart.sql`。

---

## 三、后端接口清单

### 3.1 E1 异常信号推送（subscriptions）

| 接口 | 类型 | 说明 |
|------|------|------|
| `subscriptions.list` | query | 按 userId 查询用户的全部订阅 |
| `subscriptions.create` | mutation | 创建新订阅（渠道/地址/频率/关注公司/关注维度） |
| `subscriptions.update` | mutation | 更新订阅设置（频率/启用状态等） |
| `subscriptions.delete` | mutation | 删除指定订阅 |
| `subscriptions.testPush` | mutation | 手动触发推送测试，执行异常检测并模拟通知 |

推送触发点已嵌入 `causal.analyze` 接口末尾：每次 AI 分析完成后，自动调用 `detectAndNotify()` 函数，检测异常信号并向活跃订阅用户发送通知。

### 3.2 E2 每日摘要（reports）

| 接口 | 类型 | 说明 |
|------|------|------|
| `reports.generateDaily` | mutation | 生成当日投研摘要（汇总权重变动、触发指标、新证据链） |
| `reports.getDaily` | query | 按日期获取摘要报告 |
| `reports.recent` | query | 获取最近 N 天的摘要列表 |

每日摘要内容结构包含：topMovers（权重变动最大的公司）、triggeredIndicators（触发的指标）、newEvidenceCount（新增证据链数量）、evidenceSummary（证据摘要）、tomorrowWatchlist（明日关注清单）、aiSummary（AI 生成的综合摘要）。

### 3.3 E6 免费试用（trials）

| 接口 | 类型 | 说明 |
|------|------|------|
| `trials.register` | mutation | 注册 7 天免费试用（自动去重，已有试用返回现有信息） |

注册流程：用户提交联系方式 → 系统检查是否已有活跃试用 → 如无则创建 7 天试用期 → 返回试用信息和到期时间。

### 3.4 E7 分析分享（share）

| 接口 | 类型 | 说明 |
|------|------|------|
| `share.create` | mutation | 为指定证据链生成分享 Token（30 天有效期） |
| `share.view` | query | 通过 Token 查看分享内容（自动增加浏览计数） |

分享页面底部自动附带免责声明和"免费试用 7 天"的 CTA 按钮，形成获客转化入口。

---

## 四、前端页面清单

### 4.1 E3 订阅管理页面（/subscriptions）

**文件**：`client/src/pages/Subscriptions.tsx`

功能包括：
- 查看当前用户的全部订阅列表
- 新建订阅：选择渠道（邮件/飞书/企业微信）、输入地址、设置频率
- 编辑订阅：切换启用/禁用状态
- 删除订阅
- 手动触发推送测试

### 4.2 E4 分层定价页面（/pricing）

**文件**：`client/src/pages/Pricing.tsx`

三档定价方案：
- **体验版**（¥0，7 天试用）：5 家目标池、3 次/天 AI 分析、基础六维因子
- **专业版**（¥299/月，标记为"最受欢迎"）：20 家目标池、不限 AI 分析、全部高级功能
- **企业版**（定制价格）：不限目标池、API 接口、专属客户经理、定制因子模板

页面包含 13 项功能对比表格，清晰展示各方案差异。

### 4.3 E5 结果导向落地页

底部导航栏已重构，新增三个商业化入口链接：
- 每日摘要（/reports）
- 订阅推送（/subscriptions）
- 升级方案（/pricing）

### 4.4 E6 免费试用页面（/trial）

**文件**：`client/src/pages/Trial.tsx`

功能包括：
- 4 项核心价值展示（六维因子分析、AI 因果推理、风控拥挤度、7 天完整体验）
- 注册表单：选择联系方式类型（邮箱/微信）、输入联系方式
- 提交后即时激活，显示到期时间
- 激活后引导进入看板或查看付费方案

### 4.5 E7 分析分享页面（/share/:token）

**文件**：`client/src/pages/SharedView.tsx`

功能包括：
- 通过 Token 展示证据链分析结果（消息来源、影响评估、置信度、受影响公司）
- 显示浏览次数
- 底部免责声明
- CTA 按钮引导至免费试用

**分享入口**：在 EvidenceDetail 页面头部新增"分享"按钮，点击后生成分享链接并自动复制到剪贴板。

### 4.6 E2 每日摘要页面（/reports）

**文件**：`client/src/pages/DailyReport.tsx`

功能包括：
- 日期导航器（前后翻页）
- 市场概览、重点变动、风险提示、展望、AI 摘要五个区块
- 手动生成今日摘要按钮
- 右侧边栏显示最近 7 天的报告列表

---

## 五、路由结构

| 路径 | 页面 | 功能 |
|------|------|------|
| `/` | Home | 主看板（8 个 Tab） |
| `/evidence/:id` | EvidenceDetail | 证据链详情 + 分享按钮 |
| `/subscriptions` | Subscriptions | E3 订阅管理 |
| `/pricing` | Pricing | E4 分层定价 |
| `/trial` | Trial | E6 免费试用 |
| `/share/:token` | SharedView | E7 分享查看 |
| `/reports` | DailyReport | E2 每日摘要 |

---

## 六、测试覆盖

本次新增 `server/e1-e7-commercial.test.ts`，包含 14 个测试用例：

| 模块 | 测试数量 | 覆盖内容 |
|------|----------|----------|
| E1 subscriptions | 5 | 列表查询、创建、再次列表验证、更新、删除 |
| E2 reports | 3 | 生成摘要、按日期查询、最近报告列表 |
| E6 trials | 2 | 注册试用、防重复注册 |
| E7 share | 3 | 创建分享 Token、查看分享内容、无效 Token 处理 |
| 免责声明集成 | 1 | 分享页面包含免责声明 |

全部 55 个测试（7 个文件）通过。

---

## 七、商业闭环架构

本次实施完成后，StockClaw 的商业化闭环如下：

```
用户注册试用（E6 /trial）
    ↓
体验核心功能（六维因子 + AI 推理 + 因子发现）
    ↓
设置异常推送（E1 /subscriptions）
    ↓
每日收到摘要（E2 /reports）
    ↓
分享分析给同事（E7 /share/:token）
    ↓
同事通过分享页注册试用（E6 裂变获客）
    ↓
试用到期 → 查看定价（E4 /pricing）
    ↓
付费订阅专业版
```

---

## 八、版本号更新

底部状态栏版本号已更新为：**STOCKCLAW v3.2 | Agent Swarm · 感知→连接→认知→控制**

---

## 九、待实施事项（长期路线图）

以下功能属于后续迭代范围，不在本次实施中：

| 功能 | 优先级 | 依赖 |
|------|--------|------|
| 实时股票价格获取 | 高 | 需接入行情数据 API |
| 自动化定时推送 | 高 | 需 cron 调度服务 |
| 邮件/飞书/企业微信实际发送 | 高 | 需配置 SMTP/Webhook |
| Stripe 支付集成 | 中 | 需 Stripe 账户 |
| 用户权限分层（免费/专业/企业） | 中 | 需完善 RBAC |
| 分享页面 SEO 优化 | 低 | 需 SSR 支持 |

---

*本文档由 Manus AI 自动生成，记录 StockClaw v3.2 商业化功能全量实施的技术变更。*
