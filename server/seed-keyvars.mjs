import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL);

const KEY_VARS = [
  {
    name: "美联储利率决议",
    nameEn: "Fed Funds Rate",
    category: "宏观政策",
    currentValue: "降息25bp至4.25-4.50%",
    triggerCondition: "利率变动 > 25bp 或政策转向",
    signal: "Bullish",
    impactNote: "降息利好科技股估值扩张，可降低AI企业融资成本，利好半导体资本开支",
    source: "Federal Reserve / FOMC",
  },
  {
    name: "10Y 美债利率",
    nameEn: "10Y Treasury Yield",
    category: "宏观政策",
    currentValue: "4.35%",
    triggerCondition: "突破4.5%或跌破4.0%",
    signal: "Bearish",
    impactNote: "利率处于高位，压制成长股估值，半导体板块承压",
    source: "U.S. Treasury / Bloomberg",
  },
  {
    name: "NVIDIA 数据中心收入",
    nameEn: "NVDA Data Center Revenue",
    category: "行业龙头",
    currentValue: "Q4 FY25: $356亿 (+93% YoY)",
    triggerCondition: "季度环比增速 < 10%",
    signal: "Bullish",
    impactNote: "AI算力需求持续爆发，带动整个半导体产业链上游需求",
    source: "NVIDIA Earnings Report",
  },
  {
    name: "台积电先进制程产能利用率",
    nameEn: "TSMC Advanced Node Utilization",
    category: "供应链",
    currentValue: "N3/N5 产能利用率 > 95%",
    triggerCondition: "利用率跌破85%",
    signal: "Bullish",
    impactNote: "满产状态确认AI芯片需求强劲，利好设备和材料供应商",
    source: "TSMC Quarterly Report",
  },
  {
    name: "中国半导体出口管制",
    nameEn: "China Semiconductor Export Controls",
    category: "地缘政治",
    currentValue: "实体清单扩大，限制先进GPU出口",
    triggerCondition: "新增实体清单或技术限制升级",
    signal: "Neutral",
    impactNote: "短期利空A股半导体（供应受限），但长期利好国产替代链",
    source: "BIS / 商务部",
  },
  {
    name: "HBM 内存供需缺口",
    nameEn: "HBM Supply-Demand Gap",
    category: "供应链",
    currentValue: "2025年供需缺口约20%",
    triggerCondition: "缺口收窄至5%以下",
    signal: "Bullish",
    impactNote: "HBM持续紧缺推动存储价格上涨，利好相关封测和设备企业",
    source: "TrendForce / IDC",
  },
  {
    name: "半导体设备出货额",
    nameEn: "Semiconductor Equipment Billings",
    category: "行业周期",
    currentValue: "SEMI预测2025全球设备市场$1130亿",
    triggerCondition: "连续2个季度环比下降",
    signal: "Bullish",
    impactNote: "设备出货额创新高，确认行业处于上行周期",
    source: "SEMI / SEAJ",
  },
  {
    name: "期权 IV/HV 比值",
    nameEn: "Options IV/HV Ratio (SOX)",
    category: "市场情绪",
    currentValue: "IV/HV = 1.15（略高于均值）",
    triggerCondition: "IV/HV > 1.5 或 < 0.8",
    signal: "Neutral",
    impactNote: "隐含波动率略高于历史波动率，市场定价偏谨慎但非极端",
    source: "CBOE / Bloomberg",
  },
];

async function seed() {
  for (const v of KEY_VARS) {
    await db.execute(sql`INSERT INTO keyVariables (name, nameEn, category, currentValue, triggerCondition, signal, impactNote, source) VALUES (${v.name}, ${v.nameEn}, ${v.category}, ${v.currentValue}, ${v.triggerCondition}, ${v.signal}, ${v.impactNote}, ${v.source})`);
  }
  console.log(`Seeded ${KEY_VARS.length} key variables`);
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
