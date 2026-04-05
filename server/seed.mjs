import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const companiesData = [
  { symbol: "688981", name: "中芯国际", sector: "晶圆代工", chainPosition: "中游", weight: 10, tags: ["A股","半导体","晶圆代工"] },
  { symbol: "002049", name: "紫光国微", sector: "IC设计", chainPosition: "上游", weight: 9, tags: ["A股","IC设计","FPGA"] },
  { symbol: "600584", name: "长电科技", sector: "封测", chainPosition: "中游", weight: 9, tags: ["A股","封测","HBM"] },
  { symbol: "002371", name: "北方华创", sector: "半导体设备", chainPosition: "上游", weight: 9, tags: ["A股","设备","刻蚀"] },
  { symbol: "688256", name: "寒武纪", sector: "AI芯片", chainPosition: "上游", weight: 9, tags: ["A股","AI芯片","训练"] },
  { symbol: "688041", name: "海光信息", sector: "AI芯片/CPU", chainPosition: "上游", weight: 9, tags: ["A股","CPU","AI"] },
  { symbol: "688012", name: "中微公司", sector: "半导体设备", chainPosition: "上游", weight: 8, tags: ["A股","设备","刻蚀"] },
  { symbol: "603986", name: "兆易创新", sector: "IC设计", chainPosition: "上游", weight: 8, tags: ["A股","存储","MCU"] },
  { symbol: "000977", name: "浪潮信息", sector: "AI服务器", chainPosition: "中游", weight: 8, tags: ["A股","服务器","算力"] },
  { symbol: "688008", name: "澜起科技", sector: "接口芯片", chainPosition: "上游", weight: 8, tags: ["A股","DDR5","接口"] },
  { symbol: "688396", name: "华峰测控", sector: "半导体设备", chainPosition: "上游", weight: 7, tags: ["A股","测试设备"] },
  { symbol: "300661", name: "圣邦股份", sector: "IC设计", chainPosition: "上游", weight: 7, tags: ["A股","模拟芯片"] },
  { symbol: "002230", name: "科大讯飞", sector: "AI应用", chainPosition: "下游", weight: 7, tags: ["A股","AI应用","语音"] },
  { symbol: "002415", name: "海康威视", sector: "AI视觉", chainPosition: "下游", weight: 7, tags: ["A股","安防","AI视觉"] },
  { symbol: "688111", name: "金山办公", sector: "AI应用", chainPosition: "下游", weight: 7, tags: ["A股","办公","AI"] },
  { symbol: "300496", name: "中科创达", sector: "操作系统", chainPosition: "中游", weight: 6, tags: ["A股","OS","智能座舱"] },
  { symbol: "688561", name: "奇安信", sector: "网络安全", chainPosition: "下游", weight: 6, tags: ["A股","安全","AI安全"] },
  { symbol: "603501", name: "韦尔股份", sector: "CIS芯片", chainPosition: "上游", weight: 6, tags: ["A股","CIS","图像传感器"] },
  { symbol: "688036", name: "传音控股", sector: "手机终端", chainPosition: "下游", weight: 6, tags: ["A股","手机","非洲"] },
  { symbol: "002916", name: "深南电路", sector: "PCB", chainPosition: "上游", weight: 6, tags: ["A股","PCB","封装基板"] },
  { symbol: "300782", name: "卓胜微", sector: "射频芯片", chainPosition: "上游", weight: 5, tags: ["A股","射频","滤波器"] },
  { symbol: "688521", name: "芯原股份", sector: "IP授权", chainPosition: "上游", weight: 5, tags: ["A股","IP","芯片设计"] },
  { symbol: "688200", name: "华兴源创", sector: "检测设备", chainPosition: "上游", weight: 5, tags: ["A股","检测","面板"] },
  { symbol: "300223", name: "北京君正", sector: "处理器芯片", chainPosition: "上游", weight: 5, tags: ["A股","MIPS","存储"] },
  { symbol: "688981HK", name: "中芯国际(H)", sector: "晶圆代工", chainPosition: "中游", weight: 5, tags: ["H股","半导体","晶圆代工"] },
  { symbol: "NVDA", name: "NVIDIA", sector: "GPU/AI芯片", chainPosition: "上游", weight: 10, tags: ["美股","GPU","AI算力","锚点"] },
  { symbol: "TSM", name: "台积电", sector: "晶圆代工", chainPosition: "中游", weight: 9, tags: ["美股","代工","先进制程","锚点"] },
  { symbol: "ASML", name: "ASML", sector: "光刻机", chainPosition: "上游", weight: 8, tags: ["美股","光刻","设备","锚点"] },
  { symbol: "AMD", name: "AMD", sector: "CPU/GPU", chainPosition: "上游", weight: 7, tags: ["美股","CPU","GPU","AI"] },
  { symbol: "AVGO", name: "博通", sector: "网络芯片", chainPosition: "上游", weight: 7, tags: ["美股","网络","定制芯片"] },
];

const indicatorsData = [
  { id: 1, name: "央行货币政策信号", category: "宏观/政策", description: "监控央行公开市场操作、MLF/LPR调整、降准降息信号", threshold: "LPR调整或降准公告发布", example: "央行宣布降准50bp，释放长期资金约1万亿", dataSources: ["央行官网","财联社","Wind"] },
  { id: 2, name: "中美科技博弈动态", category: "宏观/政策", description: "追踪美国实体清单、出口管制、关税政策变化", threshold: "新增实体清单或出口管制规则变更", example: "美商务部将12家中国AI公司列入实体清单", dataSources: ["BIS官网","路透社","新华社"] },
  { id: 3, name: "全球半导体销售额", category: "宏观/政策", description: "SIA月度全球半导体销售数据及同比增速", threshold: "同比增速连续2月变化超10个百分点", example: "2024年3月全球半导体销售额同比+15.2%", dataSources: ["SIA","WSTS"] },
  { id: 4, name: "产业政策与补贴", category: "宏观/政策", description: "国家大基金、地方产业基金、税收优惠等政策动向", threshold: "大基金新一期成立或重大投资公告", example: "国家大基金三期成立，注册资本3440亿元", dataSources: ["国务院","工信部","财联社"] },
  { id: 5, name: "AI算力需求指数", category: "中观/行业", description: "追踪全球AI训练/推理算力需求变化，GPU供需缺口", threshold: "主要云厂商资本开支计划变更超20%", example: "微软上调2025年AI资本开支至800亿美元", dataSources: ["公司财报","IDC","TrendForce"] },
  { id: 6, name: "先进制程良率与产能", category: "中观/行业", description: "台积电/中芯国际先进制程节点良率和产能利用率", threshold: "产能利用率变化超10%或新制程节点量产", example: "台积电3nm产能利用率提升至95%", dataSources: ["公司财报","DigiTimes","TrendForce"] },
  { id: 7, name: "存储芯片价格周期", category: "中观/行业", description: "DRAM/NAND Flash合约价与现货价走势", threshold: "合约价连续2季度涨跌超15%", example: "DDR5 16GB合约价环比上涨18%", dataSources: ["DRAMeXchange","TrendForce"] },
  { id: 8, name: "封测/CoWoS产能", category: "中观/行业", description: "先进封装(CoWoS/InFO)产能扩张与订单排期", threshold: "CoWoS产能扩张计划变更或排期延长", example: "台积电CoWoS月产能从3.5万片扩至5万片", dataSources: ["DigiTimes","公司公告"] },
  { id: 9, name: "营收增速(YoY)", category: "微观/公司", description: "公司池内企业季度营收同比增速", threshold: "营收增速偏离行业均值超20个百分点", example: "寒武纪Q3营收同比+120%，远超行业均值", dataSources: ["公司财报","东方财富"] },
  { id: 10, name: "毛利率变动", category: "微观/公司", description: "公司毛利率环比/同比变化趋势", threshold: "毛利率环比变化超5个百分点", example: "中芯国际Q3毛利率从19.3%回升至22.1%", dataSources: ["公司财报","Wind"] },
  { id: 11, name: "研发费用率", category: "微观/公司", description: "研发投入占营收比重及绝对值变化", threshold: "研发费用率变化超3个百分点或绝对值变化超30%", example: "海光信息研发费用率从35%提升至42%", dataSources: ["公司财报"] },
  { id: 12, name: "大股东/高管增减持", category: "微观/公司", description: "实控人、高管、大基金等重要股东持股变动", threshold: "单次减持超总股本1%或连续增持", example: "大基金减持中芯国际H股1.5亿股", dataSources: ["港交所","巨潮资讯","SEC"] },
  { id: 13, name: "机构持仓变动", category: "微观/公司", description: "公募基金、北向资金、社保基金持仓变化", threshold: "北向资金单日净买入/卖出超5亿", example: "北向资金连续5日净买入寒武纪共12亿元", dataSources: ["东方财富","Wind","沪深交易所"] },
  { id: 14, name: "动量因子(Momentum)", category: "因子/量价", description: "过去20/60/120日收益率动量，捕捉趋势延续", threshold: "20日动量排名进入前/后10%", example: "海光信息20日动量+35%，位列全A前5%", dataSources: ["AKShare","Wind"] },
  { id: 15, name: "波动率因子(Volatility)", category: "因子/量价", description: "20日已实现波动率及隐含波动率变化", threshold: "波动率突破近60日均值2倍标准差", example: "寒武纪20日波动率从45%飙升至78%", dataSources: ["AKShare","期权数据"] },
  { id: 16, name: "换手率异动", category: "因子/量价", description: "日换手率相对近20日均值的偏离程度", threshold: "换手率超过20日均值3倍", example: "中微公司换手率12.5%，为20日均值的4.2倍", dataSources: ["AKShare","东方财富"] },
  { id: 17, name: "资金流向因子", category: "因子/量价", description: "主力资金净流入/流出及大单占比", threshold: "连续3日主力净流入/流出超1亿", example: "北方华创连续5日主力净流入共8.3亿元", dataSources: ["东方财富","同花顺"] },
  { id: 18, name: "重大合同/订单", category: "事件/催化", description: "公司中标重大项目或签署大额订单", threshold: "合同金额超过上年营收10%", example: "浪潮信息中标某运营商AI服务器集采15亿元", dataSources: ["公司公告","巨潮资讯"] },
  { id: 19, name: "并购重组/资产注入", category: "事件/催化", description: "公司发起或参与的并购重组事件", threshold: "交易金额超过市值5%或涉及核心资产", example: "韦尔股份拟收购某CIS设计公司100%股权", dataSources: ["公司公告","证监会"] },
  { id: 20, name: "技术突破/产品发布", category: "事件/催化", description: "公司发布重大新产品或实现技术突破", threshold: "产品性能达到国际先进水平或填补国内空白", example: "海光信息发布新一代DCU，性能对标A100", dataSources: ["公司公告","行业媒体"] },
];

async function seed() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log("Seeding companies...");
  for (const c of companiesData) {
    await conn.execute(
      `INSERT INTO companies (symbol, name, sector, chainPosition, weight, tags, isActive)
       VALUES (?, ?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE name=VALUES(name), sector=VALUES(sector), weight=VALUES(weight), tags=VALUES(tags)`,
      [c.symbol, c.name, c.sector, c.chainPosition, c.weight, JSON.stringify(c.tags)]
    );
  }
  console.log(`  ✓ ${companiesData.length} companies seeded`);

  console.log("Seeding indicators...");
  for (const ind of indicatorsData) {
    await conn.execute(
      `INSERT INTO indicators (id, name, category, description, threshold, \`example\`, dataSources, lastStatus)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'normal')
       ON DUPLICATE KEY UPDATE name=VALUES(name), category=VALUES(category), description=VALUES(description),
       threshold=VALUES(threshold), \`example\`=VALUES(\`example\`), dataSources=VALUES(dataSources)`,
      [ind.id, ind.name, ind.category, ind.description, ind.threshold, ind.example, JSON.stringify(ind.dataSources)]
    );
  }
  console.log(`  ✓ ${indicatorsData.length} indicators seeded`);

  console.log("Seeding initial change log...");
  const now = Date.now();
  await conn.execute(
    `INSERT INTO changeLogs (\`timestamp\`, action, message) VALUES (?, 'init', ?)`,
    [now, "FangClaw 系统初始化完成，公司池已加载 30 家公司"]
  );
  console.log("  ✓ Initial change log entry created");

  await conn.end();
  console.log("\n✅ Seed complete!");
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
