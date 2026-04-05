import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

// P0-B: 交叉因子标签 - 标注跨维度的指标
const crossDimensionUpdates = [
  { id: 5,  crossDimension: "宏观/政策" },   // AI算力需求指数 → 中观/行业 × 宏观/政策
  { id: 8,  crossDimension: "因子/量价" },   // 封测/CoWoS产能 → 中观/行业 × 因子/量价（供需影响价格）
  { id: 12, crossDimension: "因子/量价" },   // 大股东增减持 → 微观/公司 × 因子/量价
  { id: 13, crossDimension: "因子/量价" },   // 机构持仓变动 → 微观/公司 × 因子/量价
  { id: 17, crossDimension: "微观/公司" },   // 资金流向因子 → 因子/量价 × 微观/公司
  { id: 18, crossDimension: "中观/行业" },   // 重大合同/订单 → 事件/催化 × 中观/行业
  { id: 19, crossDimension: "微观/公司" },   // 并购重组 → 事件/催化 × 微观/公司
  { id: 20, crossDimension: "中观/行业" },   // 技术突破 → 事件/催化 × 中观/行业
];

// P1-A: 十大因子模板
const factorTemplatesData = [
  {
    code: "F01",
    name: "北向资金先知",
    nameEn: "Northbound Capital Oracle",
    category: "资金行为",
    crossCategory: "微观/公司",
    description: "北向资金连续净买入某公司超过5日，且累计金额超过5亿元。北向资金被视为A股市场的'聪明钱'，其持续流入往往领先于股价表现。",
    signalDefinition: "北向资金连续5日净买入同一标的，累计金额≥5亿元",
    dataSources: JSON.stringify(["沪深交易所","东方财富","Wind"]),
    applicableMarkets: JSON.stringify(["A股"]),
    historicalWinRate: 68.5,
    avgDurationDays: 15,
    priority: 10,
  },
  {
    code: "F02",
    name: "产能周期拐点",
    nameEn: "Capacity Cycle Inflection",
    category: "中观/行业",
    crossCategory: "因子/量价",
    description: "半导体产能利用率从底部回升超过10个百分点，或先进制程产能利用率突破90%。产能周期拐点通常领先于业绩拐点1-2个季度。",
    signalDefinition: "产能利用率环比回升≥10pp，或先进制程利用率>90%",
    dataSources: JSON.stringify(["TrendForce","DigiTimes","公司财报"]),
    applicableMarkets: JSON.stringify(["A股","美股","港股"]),
    historicalWinRate: 72.0,
    avgDurationDays: 60,
    priority: 9,
  },
  {
    code: "F03",
    name: "政策催化共振",
    nameEn: "Policy Catalyst Resonance",
    category: "宏观/政策",
    crossCategory: "事件/催化",
    description: "重大产业政策发布（如大基金投资、税收优惠、出口管制变化）与行业基本面改善同时发生，形成政策-基本面共振。",
    signalDefinition: "政策事件发布后5个交易日内，相关公司营收/订单数据同步改善",
    dataSources: JSON.stringify(["国务院","工信部","公司公告"]),
    applicableMarkets: JSON.stringify(["A股"]),
    historicalWinRate: 65.0,
    avgDurationDays: 30,
    priority: 9,
  },
  {
    code: "F04",
    name: "量价背离预警",
    nameEn: "Volume-Price Divergence Alert",
    category: "因子/量价",
    crossCategory: null,
    description: "股价创新高但成交量持续萎缩（顶背离），或股价创新低但成交量放大（底背离）。量价背离是经典的趋势反转信号。",
    signalDefinition: "股价创20日新高/低，但成交量低于/高于20日均量50%",
    dataSources: JSON.stringify(["AKShare","东方财富"]),
    applicableMarkets: JSON.stringify(["A股","美股","港股"]),
    historicalWinRate: 58.0,
    avgDurationDays: 10,
    priority: 7,
  },
  {
    code: "F05",
    name: "业绩超预期扩散",
    nameEn: "Earnings Surprise Diffusion",
    category: "微观/公司",
    crossCategory: "中观/行业",
    description: "产业链中某环节龙头业绩大幅超预期，信号向上下游扩散。例如台积电业绩超预期→设备商/封测商订单增长预期提升。",
    signalDefinition: "龙头公司营收超一致预期≥15%，且产业链上下游公司数量≥3家",
    dataSources: JSON.stringify(["公司财报","Wind一致预期","Bloomberg"]),
    applicableMarkets: JSON.stringify(["A股","美股","港股"]),
    historicalWinRate: 70.0,
    avgDurationDays: 45,
    priority: 8,
  },
  {
    code: "F06",
    name: "北向-融资背离",
    nameEn: "Northbound-Margin Divergence",
    category: "资金行为",
    crossCategory: "因子/量价",
    description: "北向资金持续流入但融资余额持续下降（或反之），反映外资与内资散户的方向分歧。历史上北向资金方向的胜率更高。",
    signalDefinition: "北向资金5日净流入>0 且 融资余额5日变化<-5%（或反之）",
    dataSources: JSON.stringify(["沪深交易所","东方财富","Wind"]),
    applicableMarkets: JSON.stringify(["A股"]),
    historicalWinRate: 63.0,
    avgDurationDays: 20,
    priority: 8,
  },
  {
    code: "F07",
    name: "制裁升级链式反应",
    nameEn: "Sanction Escalation Chain Reaction",
    category: "事件/催化",
    crossCategory: "宏观/政策",
    description: "美国对中国半导体产业新增出口管制或实体清单，触发国产替代逻辑。受制裁公司的国产替代供应商通常获得超额收益。",
    signalDefinition: "BIS新增出口管制规则或实体清单更新，涉及目标池公司",
    dataSources: JSON.stringify(["BIS官网","路透社","新华社"]),
    applicableMarkets: JSON.stringify(["A股","美股"]),
    historicalWinRate: 60.0,
    avgDurationDays: 20,
    priority: 8,
  },
  {
    code: "F08",
    name: "存储价格周期信号",
    nameEn: "Memory Price Cycle Signal",
    category: "中观/行业",
    crossCategory: "因子/量价",
    description: "DRAM/NAND合约价连续2个季度上涨超15%，标志存储周期进入上行阶段。存储周期是半导体行业最强的周期性因子。",
    signalDefinition: "DRAM/NAND合约价连续2Q环比涨幅≥15%",
    dataSources: JSON.stringify(["DRAMeXchange","TrendForce"]),
    applicableMarkets: JSON.stringify(["A股","美股","港股"]),
    historicalWinRate: 75.0,
    avgDurationDays: 90,
    priority: 7,
  },
  {
    code: "F09",
    name: "高管集体增持",
    nameEn: "Management Collective Buying",
    category: "微观/公司",
    crossCategory: "资金行为",
    description: "公司高管团队（≥3人）在30天内集体增持，且增持金额合计超过1000万元。高管集体增持是最强的内部人信号之一。",
    signalDefinition: "30天内≥3名高管增持，合计金额≥1000万元",
    dataSources: JSON.stringify(["巨潮资讯","港交所","SEC"]),
    applicableMarkets: JSON.stringify(["A股","港股","美股"]),
    historicalWinRate: 66.0,
    avgDurationDays: 30,
    priority: 7,
  },
  {
    code: "F10",
    name: "AI应用爆发扩散",
    nameEn: "AI Application Breakout Diffusion",
    category: "事件/催化",
    crossCategory: "中观/行业",
    description: "重大AI应用产品发布或用户量爆发（如ChatGPT、Sora等），触发算力需求预期上调，利好上游芯片和中游服务器。",
    signalDefinition: "AI应用产品发布后7天内，相关算力概念股涨幅超过10%",
    dataSources: JSON.stringify(["行业媒体","公司公告","社交媒体"]),
    applicableMarkets: JSON.stringify(["A股","美股"]),
    historicalWinRate: 62.0,
    avgDurationDays: 15,
    priority: 8,
  },
];

async function seedV3() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  // 1. Update crossDimension for existing indicators
  console.log("Updating crossDimension for indicators...");
  for (const upd of crossDimensionUpdates) {
    await conn.execute(
      `UPDATE indicators SET crossDimension = ? WHERE id = ?`,
      [upd.crossDimension, upd.id]
    );
  }
  console.log(`  ✓ ${crossDimensionUpdates.length} indicators updated with crossDimension`);

  // 2. Seed factor templates
  console.log("Seeding factor templates...");
  for (const ft of factorTemplatesData) {
    await conn.execute(
      `INSERT INTO factorTemplates (code, name, nameEn, category, crossCategory, description, signalDefinition, dataSources, applicableMarkets, historicalWinRate, avgDurationDays, priority, isActive)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE name=VALUES(name), nameEn=VALUES(nameEn), category=VALUES(category),
       crossCategory=VALUES(crossCategory), description=VALUES(description), signalDefinition=VALUES(signalDefinition),
       dataSources=VALUES(dataSources), applicableMarkets=VALUES(applicableMarkets),
       historicalWinRate=VALUES(historicalWinRate), avgDurationDays=VALUES(avgDurationDays), priority=VALUES(priority)`,
      [ft.code, ft.name, ft.nameEn, ft.category, ft.crossCategory, ft.description, ft.signalDefinition,
       ft.dataSources, ft.applicableMarkets, ft.historicalWinRate, ft.avgDurationDays, ft.priority]
    );
  }
  console.log(`  ✓ ${factorTemplatesData.length} factor templates seeded`);

  await conn.end();
  console.log("\n✅ v3.0 seed complete!");
  process.exit(0);
}

seedV3().catch(e => { console.error(e); process.exit(1); });
