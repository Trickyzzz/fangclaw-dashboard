// FangClaw 数据层 — 嵌入式静态数据（后续可替换为 API 调用）

export interface Company {
  symbol: string;
  name: string;
  market: string;
  weight: number;
  sector: string;
  chain_position: "上游" | "中游" | "下游";
  added_at: string;
  last_change: string | null;
  tags: string[];
}

export interface Indicator {
  id: number;
  category: string;
  name: string;
  description: string;
  data_sources: string[];
  threshold: string;
  example: string;
  last_status: "normal" | "triggered" | "warning";
  last_triggered: string | null;
}

export interface Anchor {
  name: string;
  ticker: string;
  role: string;
}

export interface ChangeLogEntry {
  timestamp: string;
  type: string;
  action: string;
  message?: string;
  symbol?: string;
  name?: string;
  old_weight?: number | null;
  new_weight?: number | null;
  reason?: string;
  evidence_id: string | null;
}

export const THEME_INFO = {
  theme: "AI算力/半导体链",
  theme_en: "AI Computing / Semiconductor Chain",
  description: "聚焦AI算力基础设施及半导体产业链的投研跟踪",
  description_en: "Focused tracking on AI computing infrastructure and semiconductor supply chain",
  geo_scope: ["A股", "H股"],
};

export const ANCHORS: Anchor[] = [
  { name: "NVIDIA", ticker: "NVDA.US", role: "全球AI芯片龙头，算力需求风向标" },
  { name: "台积电", ticker: "TSM.US", role: "先进制程代工垄断者，产能瓶颈指标" },
  { name: "ASML", ticker: "ASML.US", role: "光刻机垄断供应商，设备交付周期指标" },
];

export const COMPANIES: Company[] = [
  { symbol: "002049", name: "紫光国微", market: "A股", weight: 9, sector: "IC设计", chain_position: "上游", added_at: "2026-04-03", last_change: null, tags: ["FPGA", "特种芯片", "国产替代"] },
  { symbol: "688981", name: "中芯国际", market: "A股", weight: 10, sector: "晶圆代工", chain_position: "中游", added_at: "2026-04-03", last_change: "2026-04-03", tags: ["先进制程", "国产替代", "产能扩张"] },
  { symbol: "600584", name: "长电科技", market: "A股", weight: 9, sector: "封测", chain_position: "中游", added_at: "2026-04-03", last_change: null, tags: ["HBM封装", "先进封装", "Chiplet"] },
  { symbol: "002371", name: "北方华创", market: "A股", weight: 9, sector: "半导体设备", chain_position: "上游", added_at: "2026-04-03", last_change: null, tags: ["刻蚀", "薄膜沉积", "国产替代"] },
  { symbol: "688012", name: "中微公司", market: "A股", weight: 8, sector: "半导体设备", chain_position: "上游", added_at: "2026-04-03", last_change: null, tags: ["刻蚀设备", "MOCVD"] },
  { symbol: "688396", name: "华峰测控", market: "A股", weight: 7, sector: "半导体设备", chain_position: "上游", added_at: "2026-04-03", last_change: null, tags: ["测试设备", "模拟芯片测试"] },
  { symbol: "300661", name: "圣邦股份", market: "A股", weight: 7, sector: "IC设计", chain_position: "上游", added_at: "2026-04-03", last_change: null, tags: ["模拟芯片", "电源管理"] },
  { symbol: "603986", name: "兆易创新", market: "A股", weight: 8, sector: "IC设计", chain_position: "上游", added_at: "2026-04-03", last_change: null, tags: ["存储芯片", "MCU", "DRAM"] },
  { symbol: "688256", name: "寒武纪", market: "A股", weight: 9, sector: "AI芯片", chain_position: "上游", added_at: "2026-04-03", last_change: null, tags: ["AI推理芯片", "训练芯片", "国产GPU"] },
  { symbol: "688041", name: "海光信息", market: "A股", weight: 9, sector: "AI芯片/CPU", chain_position: "上游", added_at: "2026-04-03", last_change: null, tags: ["国产CPU", "DCU加速卡", "信创"] },
  { symbol: "688111", name: "金山办公", market: "A股", weight: 6, sector: "AI应用", chain_position: "下游", added_at: "2026-04-03", last_change: null, tags: ["AI办公", "WPS AI", "大模型应用"] },
  { symbol: "002230", name: "科大讯飞", market: "A股", weight: 7, sector: "AI应用", chain_position: "下游", added_at: "2026-04-03", last_change: null, tags: ["语音AI", "星火大模型", "教育AI"] },
  { symbol: "000977", name: "浪潮信息", market: "A股", weight: 8, sector: "AI服务器", chain_position: "中游", added_at: "2026-04-03", last_change: null, tags: ["AI服务器", "算力基础设施"] },
  { symbol: "600588", name: "用友网络", market: "A股", weight: 5, sector: "企业软件", chain_position: "下游", added_at: "2026-04-03", last_change: null, tags: ["企业AI", "ERP", "SaaS"] },
  { symbol: "688561", name: "奇安信", market: "A股", weight: 6, sector: "网络安全", chain_position: "下游", added_at: "2026-04-03", last_change: null, tags: ["AI安全", "数据安全", "信创安全"] },
  { symbol: "688036", name: "传音控股", market: "A股", weight: 5, sector: "消费电子", chain_position: "下游", added_at: "2026-04-03", last_change: null, tags: ["手机AI", "新兴市场", "端侧AI"] },
  { symbol: "002415", name: "海康威视", market: "A股", weight: 7, sector: "AI视觉", chain_position: "下游", added_at: "2026-04-03", last_change: null, tags: ["AI视觉", "智能物联", "机器人"] },
  { symbol: "300474", name: "景嘉微", market: "A股", weight: 7, sector: "GPU", chain_position: "上游", added_at: "2026-04-03", last_change: null, tags: ["国产GPU", "军用芯片", "图形处理"] },
  { symbol: "688008", name: "澜起科技", market: "A股", weight: 8, sector: "接口芯片", chain_position: "上游", added_at: "2026-04-03", last_change: null, tags: ["DDR5", "内存接口", "互联芯片"] },
  { symbol: "300782", name: "卓胜微", market: "A股", weight: 5, sector: "射频芯片", chain_position: "上游", added_at: "2026-04-03", last_change: null, tags: ["射频前端", "滤波器", "5G"] },
  { symbol: "688521", name: "芯原股份", market: "A股", weight: 6, sector: "IP授权", chain_position: "上游", added_at: "2026-04-03", last_change: null, tags: ["芯片IP", "GPU IP", "NPU IP"] },
  { symbol: "688120", name: "华海清科", market: "A股", weight: 7, sector: "半导体设备", chain_position: "上游", added_at: "2026-04-03", last_change: null, tags: ["CMP设备", "国产替代"] },
  { symbol: "300223", name: "北京君正", market: "A股", weight: 6, sector: "IC设计", chain_position: "上游", added_at: "2026-04-03", last_change: null, tags: ["存储芯片", "ISSI", "车规芯片"] },
  { symbol: "688072", name: "拓荆科技", market: "A股", weight: 7, sector: "半导体设备", chain_position: "上游", added_at: "2026-04-03", last_change: null, tags: ["薄膜沉积", "PECVD", "ALD"] },
  { symbol: "688200", name: "华兴源创", market: "A股", weight: 5, sector: "半导体设备", chain_position: "上游", added_at: "2026-04-03", last_change: null, tags: ["检测设备", "面板检测", "半导体检测"] },
  { symbol: "300496", name: "中科创达", market: "A股", weight: 6, sector: "AI软件", chain_position: "中游", added_at: "2026-04-03", last_change: null, tags: ["智能OS", "边缘AI", "汽车智能化"] },
  { symbol: "688047", name: "龙芯中科", market: "A股", weight: 6, sector: "CPU", chain_position: "上游", added_at: "2026-04-03", last_change: null, tags: ["国产CPU", "LoongArch", "信创"] },
  { symbol: "688082", name: "盛美上海", market: "A股", weight: 7, sector: "半导体设备", chain_position: "上游", added_at: "2026-04-03", last_change: null, tags: ["清洗设备", "电镀设备", "先进封装"] },
  { symbol: "002185", name: "华天科技", market: "A股", weight: 7, sector: "封测", chain_position: "中游", added_at: "2026-04-03", last_change: null, tags: ["先进封装", "SiP", "FC-BGA"] },
  { symbol: "688608", name: "恒玄科技", market: "A股", weight: 5, sector: "IC设计", chain_position: "上游", added_at: "2026-04-03", last_change: null, tags: ["智能音频SoC", "BLE", "端侧AI"] },
];

export const INDICATORS: Indicator[] = [
  { id: 1, category: "宏观/政策", name: "产业政策超预期", description: "与AI算力/半导体直接相关的国家或地方产业政策出台或调整", data_sources: ["rss-local", "exa-search"], threshold: "新政策发布或现有政策重大调整（补贴、税收、准入）", example: "国务院发布AI算力基础设施专项补贴政策", last_status: "normal", last_triggered: null },
  { id: 2, category: "宏观/政策", name: "信贷/流动性转向", description: "央行货币政策工具调整，影响市场整体流动性和科技板块估值", data_sources: ["rss-local", "akshare-local"], threshold: "降准/降息/MLF/LPR调整，或公开市场操作规模显著变化", example: "央行宣布定向降准50bp支持科技创新企业", last_status: "normal", last_triggered: null },
  { id: 3, category: "宏观/政策", name: "地缘政治/出口管制", description: "影响半导体供应链或市场准入的国际政治事件", data_sources: ["exa-search", "rss-local"], threshold: "制裁/出口管制/实体清单更新/外交冲突升级", example: "美国商务部更新实体清单，新增先进封装设备限制", last_status: "normal", last_triggered: null },
  { id: 4, category: "宏观/政策", name: "关税/贸易壁垒变化", description: "进出口关税调整或贸易壁垒变化，影响半导体产业链成本", data_sources: ["exa-search", "rss-local"], threshold: "关税税率变动超过5个百分点或新增反倾销/反补贴调查", example: "欧盟对中国成熟制程芯片启动反补贴调查", last_status: "normal", last_triggered: null },
  { id: 5, category: "中观/行业", name: "AI服务器渗透率拐点", description: "AI服务器在数据中心的渗透率出现加速或减速信号", data_sources: ["exa-search", "rss-local"], threshold: "季度渗透率环比变化超过3个百分点，或头部CSP资本开支指引调整", example: "IDC报告显示全球AI服务器渗透率突破35%，环比+5pp", last_status: "normal", last_triggered: null },
  { id: 6, category: "中观/行业", name: "上游原材料/零部件价格异动", description: "HBM、DRAM晶圆、先进封装基板等关键原材料价格大幅波动", data_sources: ["akshare-local", "exa-search"], threshold: "周涨跌幅超过10%或连续5日单向波动", example: "HBM3e晶圆合约价单周上涨15%", last_status: "normal", last_triggered: null },
  { id: 7, category: "中观/行业", name: "下游大客户需求信号", description: "来自头部云厂商、互联网公司的算力采购或资本开支信号", data_sources: ["rss-local", "exa-search"], threshold: "大客户公开招标/订单公告/资本开支指引上调", example: "字节跳动发布2026年AI算力采购计划，规模同比翻倍", last_status: "normal", last_triggered: null },
  { id: 8, category: "中观/行业", name: "行业产能出清/扩张", description: "竞争对手产能变化（退出、停产、扩产），影响供给侧格局", data_sources: ["rss-local", "exa-search"], threshold: "主要竞争对手停产/破产/大幅裁员，或新产线投产公告", example: "某二线封测厂宣布关闭两条HBM封装产线", last_status: "normal", last_triggered: null },
  { id: 9, category: "微观/公司", name: "核心高管变动", description: "公司池中公司的CEO/CTO/CFO等核心高管任免或核心技术人员离职", data_sources: ["akshare-local", "rss-local"], threshold: "C-level高管变动或核心技术团队批量离职（≥3人）", example: "公司CTO因个人原因辞职，由外部空降新CTO", last_status: "normal", last_triggered: null },
  { id: 10, category: "微观/公司", name: "财报业绩超预期/不及预期", description: "季度或年度财报核心指标与市场一致预期的偏差", data_sources: ["akshare-local", "rss-local"], threshold: "营收或净利润实际值与一致预期偏差超过15%（SUE > 2 或 SUE < -2）", example: "长电科技Q1净利润同比+45%，超市场一致预期22%", last_status: "normal", last_triggered: null },
  { id: 11, category: "微观/公司", name: "大股东/高管增减持", description: "公司池中公司的重要股东或高管的股份增减持行为", data_sources: ["akshare-local"], threshold: "单次增减持金额超过1000万元或累计超过总股本1%", example: "公司实控人通过大宗交易减持2%股份", last_status: "normal", last_triggered: null },
  { id: 12, category: "微观/公司", name: "重大合同/订单公告", description: "公司池中公司签署的重大销售合同或采购订单", data_sources: ["akshare-local", "rss-local"], threshold: "合同金额超过上年营收10%或涉及战略性客户", example: "公司公告中标某大型云厂商AI服务器封测订单，金额12亿元", last_status: "normal", last_triggered: null },
  { id: 13, category: "微观/公司", name: "技术突破/专利事件", description: "公司池中公司的重大技术突破、专利获批或专利诉讼", data_sources: ["rss-local", "exa-search"], threshold: "核心技术路线突破/关键专利获批/重大专利侵权诉讼", example: "公司宣布HBM4封装良率突破90%，领先行业平均水平", last_status: "normal", last_triggered: null },
  { id: 14, category: "因子/量价", name: "异常放量", description: "公司池中股票出现成交量异常放大", data_sources: ["akshare-local"], threshold: "日成交量超过20日均量的3倍", example: "某股票今日成交量达到20日均量的4.2倍", last_status: "normal", last_triggered: null },
  { id: 15, category: "因子/量价", name: "北向资金异动", description: "北向资金对公司池中股票的持仓出现显著变化", data_sources: ["akshare-local"], threshold: "单日净买入/净卖出超过5000万元或连续3日同向操作", example: "北向资金连续5日净买入某股票，累计金额3.2亿元", last_status: "normal", last_triggered: null },
  { id: 16, category: "因子/量价", name: "技术形态突破", description: "公司池中股票的关键技术指标出现突破信号", data_sources: ["akshare-local"], threshold: "股价突破60日均线/RSI进入超买超卖区/MACD金叉死叉", example: "某股票MACD在零轴上方形成金叉，同时RSI从超卖区回升", last_status: "normal", last_triggered: null },
  { id: 17, category: "因子/量价", name: "板块资金流向异动", description: "半导体/AI算力相关板块的整体资金流向出现显著变化", data_sources: ["akshare-local"], threshold: "板块单日净流入/流出超过20亿元或连续3日同向", example: "半导体板块今日净流入35亿元，为近30日最高", last_status: "normal", last_triggered: null },
  { id: 18, category: "事件/催化", name: "锚点公司重大事件", description: "NVIDIA/台积电/ASML等锚点公司发生重大事件，可能传导至A股/H股", data_sources: ["exa-search", "rss-local"], threshold: "锚点公司财报/产品发布/指引调整/重大合作", example: "NVIDIA发布新一代B300 GPU，性能较上代提升3倍", last_status: "normal", last_triggered: null },
  { id: 19, category: "事件/催化", name: "行业展会/峰会", description: "半导体/AI领域重要展会或峰会期间的重大发布", data_sources: ["exa-search", "rss-local"], threshold: "CES/MWC/Computex/Hot Chips/GTC等重要展会期间的产品发布或合作公告", example: "Computex 2026上多家厂商发布基于NVIDIA B300的AI服务器", last_status: "normal", last_triggered: null },
  { id: 20, category: "事件/催化", name: "监管/合规事件", description: "公司池中公司面临的监管调查、处罚或合规风险", data_sources: ["akshare-local", "rss-local"], threshold: "证监会立案调查/交易所问询函/重大诉讼/环保处罚", example: "公司收到交易所关于年报的问询函，涉及关联交易", last_status: "normal", last_triggered: null },
];

export const CHANGE_LOG: ChangeLogEntry[] = [
  { timestamp: "2026-04-03T09:30:00+08:00", type: "system", action: "init", message: "FangClaw 系统初始化完成，公司池已加载 30 家公司", evidence_id: null },
  { timestamp: "2026-04-03T09:31:00+08:00", type: "pool_update", action: "add", symbol: "688981", name: "中芯国际", old_weight: null, new_weight: 10, reason: "初始公司池 — 国内晶圆代工龙头，AI算力产业链核心环节", evidence_id: "EC-20260403-INIT" },
  { timestamp: "2026-04-03T09:31:00+08:00", type: "pool_update", action: "add", symbol: "600584", name: "长电科技", old_weight: null, new_weight: 9, reason: "初始公司池 — HBM先进封装领军企业，受益AI算力扩张", evidence_id: "EC-20260403-INIT" },
  { timestamp: "2026-04-03T09:31:00+08:00", type: "pool_update", action: "add", symbol: "688256", name: "寒武纪", old_weight: null, new_weight: 9, reason: "初始公司池 — 国产AI芯片龙头，训练+推理双线布局", evidence_id: "EC-20260403-INIT" },
];

// Derived statistics
export function getStats() {
  const totalCompanies = COMPANIES.length;
  const avgWeight = +(COMPANIES.reduce((s, c) => s + c.weight, 0) / totalCompanies).toFixed(1);
  const chainDistribution = {
    upstream: COMPANIES.filter(c => c.chain_position === "上游").length,
    midstream: COMPANIES.filter(c => c.chain_position === "中游").length,
    downstream: COMPANIES.filter(c => c.chain_position === "下游").length,
  };
  const sectorDistribution: Record<string, number> = {};
  COMPANIES.forEach(c => {
    sectorDistribution[c.sector] = (sectorDistribution[c.sector] || 0) + 1;
  });
  const indicatorsByCategory: Record<string, number> = {};
  INDICATORS.forEach(i => {
    indicatorsByCategory[i.category] = (indicatorsByCategory[i.category] || 0) + 1;
  });
  return { totalCompanies, avgWeight, chainDistribution, sectorDistribution, indicatorsByCategory };
}

// Category colors mapping
export const CATEGORY_COLORS: Record<string, string> = {
  "宏观/政策": "#00D4AA",
  "中观/行业": "#3B82F6",
  "微观/公司": "#F59E0B",
  "因子/量价": "#EF4444",
  "事件/催化": "#A855F7",
};

export const CHAIN_COLORS: Record<string, string> = {
  "上游": "#00D4AA",
  "中游": "#3B82F6",
  "下游": "#F59E0B",
};
