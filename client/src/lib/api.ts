/**
 * FangClaw API 适配层
 * 将 tRPC 返回的 DB 字段名映射为前端组件使用的字段名
 */
import { trpc } from "@/lib/trpc";

// 前端类型定义（保持 snake_case 兼容现有组件）
export interface Company {
  symbol: string;
  name: string;
  weight: number;
  sector: string;
  chain_position: "上游" | "中游" | "下游";
  added_at: string;
  last_change: string | null;
  tags: string[];
  latest_price?: number | null;
  price_change?: number | null;
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

export interface ChangeLogEntry {
  id: number;
  timestamp: number;
  action: string;
  message?: string | null;
  symbol?: string | null;
  name?: string | null;
  old_weight?: number | null;
  new_weight?: number | null;
  reason?: string | null;
  evidence_id: string | null;
}

export interface SecFilingFeedItem {
  symbol: string;
  companyName: string;
  cik: string;
  formType: string;
  filedAt: string;
  description: string;
  accessionNumber: string;
  url: string;
}

export interface CninfoAnnouncementFeedItem {
  symbol: string;
  companyName: string;
  title: string;
  publishedAt: string;
  announcementId: string;
  pdfUrl: string;
  url: string;
}

export interface MarketNewsFeedItem {
  id: string;
  title: string;
  summary: string;
  source: "wallstreetcn";
  sourceLabel: string;
  publishedAt: string;
  url: string;
  symbols: string[];
}

export interface IfindRealtimeQuote {
  symbol: string;
  time: string | null;
  open: number | null;
  high: number | null;
  low: number | null;
  latest: number | null;
}

export interface IngestionStatusSnapshot {
  running: boolean;
  lastRunAt: string | null;
  scannedCount: number;
  dedupedCount: number;
  observedCount: number;
  appliedCount: number;
  lastError: string | null;
}

export interface SystemReadiness {
  mode: "realtime" | "demo";
  databaseConfigured: boolean;
  databaseConnected: boolean;
  dataInitialized: boolean;
  llmConfigured: boolean;
  oauthConfigured: boolean;
  ingestion: IngestionStatusSnapshot;
  missing: string[];
}

// 保留静态主题和锚点数据（这些不需要从 DB 获取）
export const THEME_INFO = {
  theme: "AI算力/半导体链",
  theme_en: "AI Computing / Semiconductor Chain",
  description: "聚焦AI算力基础设施及半导体产业链的投研跟踪",
  description_en: "Focused tracking on AI computing infrastructure and semiconductor supply chain",
  geo_scope: ["A股", "H股"],
};

export const ANCHORS = [
  { name: "NVIDIA", ticker: "NVDA.US", role: "全球AI芯片龙头，算力需求风向标" },
  { name: "台积电", ticker: "TSM.US", role: "先进制程代工垄断者，产能瓶颈指标" },
  { name: "ASML", ticker: "ASML.US", role: "光刻机垄断供应商，设备交付周期指标" },
];

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

// ========== tRPC Hooks ==========

export function useCompanies() {
  const query = trpc.companies.list.useQuery();
  const companies: Company[] = (query.data ?? []).map((c: any) => ({
    symbol: c.symbol,
    name: c.name,
    weight: c.weight,
    sector: c.sector ?? "",
    chain_position: c.chainPosition as "上游" | "中游" | "下游",
    added_at: c.addedAt ? new Date(c.addedAt).toISOString().slice(0, 10) : "",
    last_change: c.lastChange ? new Date(c.lastChange).toISOString().slice(0, 10) : null,
    tags: (c.tags ?? []) as string[],
    latest_price: c.latestPrice,
    price_change: c.priceChange,
  }));
  return { companies, isLoading: query.isLoading, error: query.error, refetch: query.refetch };
}

export function useCompany(symbol: string) {
  const query = trpc.companies.getBySymbol.useQuery(
    { symbol },
    { enabled: !!symbol }
  );
  const raw = query.data as any;
  const company: Company | null = raw ? {
    symbol: raw.symbol,
    name: raw.name,
    weight: raw.weight,
    sector: raw.sector ?? "",
    chain_position: raw.chainPosition as "上游" | "中游" | "下游",
    added_at: raw.addedAt ? new Date(raw.addedAt).toISOString().slice(0, 10) : "",
    last_change: raw.lastChange ? new Date(raw.lastChange).toISOString().slice(0, 10) : null,
    tags: (raw.tags ?? []) as string[],
    latest_price: raw.latestPrice,
    price_change: raw.priceChange,
  } : null;
  return { company, isLoading: query.isLoading, error: query.error, refetch: query.refetch };
}

export function useCompanyStats() {
  return trpc.companies.stats.useQuery();
}

export function useIndicators() {
  const query = trpc.indicators.list.useQuery();
  const indicators: Indicator[] = (query.data ?? []).map((i: any) => ({
    id: i.id,
    category: i.category,
    name: i.name,
    description: i.description ?? "",
    data_sources: (i.dataSources ?? []) as string[],
    threshold: i.threshold ?? "",
    example: i.example ?? "",
    last_status: i.lastStatus as "normal" | "triggered" | "warning",
    last_triggered: i.lastTriggeredAt ? new Date(i.lastTriggeredAt).toISOString() : null,
  }));
  return { indicators, isLoading: query.isLoading, error: query.error, refetch: query.refetch };
}

export function useChangeLogs(limit?: number) {
  const query = trpc.changeLogs.list.useQuery(limit ? { limit } : undefined);
  const logs: ChangeLogEntry[] = (query.data ?? []).map(l => ({
    id: l.id,
    timestamp: l.timestamp,
    action: l.action,
    message: l.message,
    symbol: l.symbol,
    name: l.name,
    old_weight: l.oldWeight,
    new_weight: l.newWeight,
    reason: l.reason,
    evidence_id: l.evidenceId,
  }));
  return { logs, isLoading: query.isLoading, error: query.error, refetch: query.refetch };
}

export function useSecRecentFilings(limit = 5) {
  const query = trpc.dataSources.secRecentFilings.useQuery({ limit });
  return {
    filings: (query.data ?? []) as SecFilingFeedItem[],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useCninfoRecentAnnouncements(limit = 5) {
  const query = trpc.dataSources.cninfoRecentAnnouncements.useQuery({ limit });
  return {
    announcements: (query.data ?? []) as CninfoAnnouncementFeedItem[],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useMarketNews(limit = 6, channel: "a-stock-channel" | "global-channel" = "a-stock-channel") {
  const query = trpc.dataSources.marketNews.useQuery({ limit, channel });
  return {
    news: (query.data ?? []) as MarketNewsFeedItem[],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useIfindRealtimeQuotes(codes: string[]) {
  const query = trpc.dataSources.ifindRealtimeQuotes.useQuery(
    { codes },
    { enabled: codes.length > 0, retry: false }
  );
  return {
    quotes: (query.data ?? []) as IfindRealtimeQuote[],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useIngestionStatus() {
  const query = trpc.system.ingestion.status.useQuery(undefined, {
    refetchInterval: 15000,
  });
  return {
    ingestionStatus: (query.data ?? null) as IngestionStatusSnapshot | null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useSystemReadiness() {
  const query = trpc.system.readiness.useQuery(undefined, {
    refetchInterval: 15000,
  });
  return {
    readiness: (query.data ?? null) as SystemReadiness | null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export interface EvidenceChain {
  id: number;
  evidenceId: string;
  sourceMessage: string;
  sourceType: string | null;
  sourceUrl: string | null;
  sourceTimestamp: number | null;
  analysis: {
    entities: string[];
    relatedIndicators: number[];
    impactAssessment: string;
    confidence: number;
    reasoning: string;
    scenarios?: {
      name: string;
      nameEn: string;
      probability: number;
      description: string;
      trigger: string;
      poolImpact: string;
    }[];
  } | null;
  impacts: {
    symbol: string;
    name: string;
    oldWeight: number;
    newWeight: number;
    direction: "up" | "down" | "neutral";
    reason: string;
  }[] | null;
  verificationQuestions: string[] | null;
  createdAt: Date;
}

export function useEvidence(evidenceId: string) {
  const query = trpc.evidence.get.useQuery(
    { evidenceId },
    { enabled: !!evidenceId }
  );
  return {
    evidence: query.data as EvidenceChain | null | undefined,
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useRecentEvidence() {
  const query = trpc.evidence.recent.useQuery();
  return {
    evidenceList: (query.data ?? []) as EvidenceChain[],
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useCausalAnalysis() {
  return trpc.causal.analyze.useMutation();
}

// ========== v3.0: 因子发现模式 ==========

export function useFactorDiscovery() {
  return trpc.causal.discover.useMutation();
}

// ========== v3.0: 异常信号检测 ==========

export interface AnomalySignal {
  type: string;
  severity: "high" | "medium" | "low";
  symbol?: string;
  name?: string;
  detail: string;
}

export function useAnomalies() {
  const query = trpc.companies.anomalies.useQuery();
  return {
    anomalies: (query.data ?? []) as AnomalySignal[],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

// ========== v3.0: 因子模板 ==========

export function useFactorTemplates() {
  const query = trpc.factorTemplates.list.useQuery();
  return {
    templates: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}

// ========== v3.0: 拥挤度 ==========

export function useCrowding() {
  const query = trpc.risk.crowding.useQuery();
  return {
    crowding: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

// ========== v3.0: 因子热力矩阵 ==========

export function useFactorHeatmap() {
  const query = trpc.indicators.heatmap.useQuery();
  return {
    heatmap: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}

// ========== v3.0: 因子回测 ==========

export function useBacktest(evidenceId: string) {
  const query = trpc.evidence.backtest.useQuery(
    { evidenceId },
    { enabled: !!evidenceId }
  );
  return {
    backtest: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}

// ========== v3.0: 免责声明 ==========

export function useDisclaimer() {
  const query = trpc.disclaimer.get.useQuery();
  return {
    disclaimer: query.data,
    isLoading: query.isLoading,
  };
}

export function getWatchOwnerKey() {
  const storageKey = "fangclaw_watch_owner_v1";
  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;
  const created = `owner_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  window.localStorage.setItem(storageKey, created);
  return created;
}

export function useWatchlist(ownerKey: string) {
  const listQuery = trpc.watchlist.list.useQuery(
    { ownerKey },
    { enabled: !!ownerKey }
  );
  const addMut = trpc.watchlist.add.useMutation();
  const removeMut = trpc.watchlist.remove.useMutation();
  return {
    symbols: (listQuery.data ?? []) as string[],
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    refetch: listQuery.refetch,
    add: addMut,
    remove: removeMut,
  };
}
