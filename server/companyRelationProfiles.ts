export type CompanyRelationProfile = {
  symbol: string;
  aliases: string[];
  customers: string[];
  suppliers: string[];
  competitors: string[];
  anchors: string[];
  themes: string[];
};

export const COMPANY_RELATION_PROFILES: CompanyRelationProfile[] = [
  {
    symbol: "688256",
    aliases: ["寒武纪", "Cambricon", "国产AI芯片", "国产算力芯片"],
    customers: ["字节跳动", "阿里云", "腾讯云", "百度智能云", "运营商"],
    suppliers: ["台积电", "中芯国际", "先进封装", "HBM"],
    competitors: ["英伟达", "NVIDIA", "海光信息", "摩尔线程", "华为昇腾"],
    anchors: ["NVDA", "NVIDIA", "TSM", "台积电"],
    themes: ["AI芯片", "算力", "国产替代", "半导体"],
  },
  {
    symbol: "300557",
    aliases: ["理工光科", "光纤传感", "机器人传感"],
    customers: ["宇树科技", "Unitree", "机器人厂商", "工业机器人"],
    suppliers: ["光纤器件", "传感器"],
    competitors: [],
    anchors: ["宇树科技", "Unitree"],
    themes: ["机器人", "传感", "智能制造"],
  },
  {
    symbol: "000977",
    aliases: ["浪潮信息", "AI服务器", "服务器整机"],
    customers: ["云厂商", "字节跳动", "阿里云", "腾讯云", "百度智能云"],
    suppliers: ["英伟达", "NVIDIA", "HBM", "台积电"],
    competitors: ["工业富联", "中科曙光"],
    anchors: ["NVDA", "NVIDIA"],
    themes: ["AI服务器", "算力", "数据中心"],
  },
  {
    symbol: "688981",
    aliases: ["中芯国际", "SMIC", "晶圆代工"],
    customers: ["国产芯片公司", "寒武纪", "海光信息"],
    suppliers: ["ASML", "光刻机", "半导体设备"],
    competitors: ["台积电", "TSM", "三星代工"],
    anchors: ["TSM", "台积电", "ASML"],
    themes: ["晶圆代工", "国产替代", "半导体"],
  },
  {
    symbol: "NVDA",
    aliases: ["NVIDIA", "英伟达", "GPU", "Blackwell"],
    customers: ["微软", "Meta", "Google", "Amazon", "字节跳动", "云厂商"],
    suppliers: ["台积电", "TSM", "SK海力士", "HBM"],
    competitors: ["AMD", "谷歌TPU", "华为昇腾"],
    anchors: ["TSM", "台积电"],
    themes: ["GPU", "AI芯片", "算力"],
  },
  {
    symbol: "TSM",
    aliases: ["台积电", "TSMC", "先进制程", "晶圆代工"],
    customers: ["NVIDIA", "英伟达", "Apple", "AMD", "高通"],
    suppliers: ["ASML", "光刻机"],
    competitors: ["三星代工", "中芯国际"],
    anchors: ["ASML", "NVDA", "NVIDIA"],
    themes: ["晶圆代工", "先进制程", "半导体"],
  },
  {
    symbol: "ASML",
    aliases: ["ASML", "阿斯麦", "光刻机", "EUV"],
    customers: ["台积电", "TSM", "三星", "英特尔", "中芯国际"],
    suppliers: [],
    competitors: [],
    anchors: ["TSM", "台积电"],
    themes: ["光刻机", "半导体设备", "先进制程"],
  },
];

export function getRelationProfile(symbol: string) {
  const normalized = symbol.trim().toUpperCase();
  return COMPANY_RELATION_PROFILES.find(profile => profile.symbol.toUpperCase() === normalized) ?? null;
}

export function relationTokensFor(symbol: string) {
  const profile = getRelationProfile(symbol);
  if (!profile) return [];
  return [
    ...profile.aliases,
    ...profile.customers,
    ...profile.suppliers,
    ...profile.competitors,
    ...profile.anchors,
    ...profile.themes,
  ];
}

export function ecosystemRelationTokensFor(symbol: string) {
  const profile = getRelationProfile(symbol);
  if (!profile) return [];
  return [
    ...profile.customers,
    ...profile.suppliers,
    ...profile.competitors,
    ...profile.anchors,
  ];
}
