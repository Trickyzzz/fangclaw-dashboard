const WALLSTREETCN_LIVES_URL = "https://api-prod.wallstreetcn.com/apiv1/content/lives";

type WallstreetcnRawItem = {
  id?: number | string;
  title?: string;
  content_text?: string;
  content?: string;
  display_time?: number | string;
  created_at?: number | string;
  uri?: string;
};

type WallstreetcnResponse = {
  data?: {
    items?: WallstreetcnRawItem[];
  };
  items?: WallstreetcnRawItem[];
};

export type MarketNewsItem = {
  id: string;
  title: string;
  summary: string;
  source: "wallstreetcn";
  sourceLabel: string;
  publishedAt: string;
  url: string;
  symbols: string[];
};

const TRACKED_US_SYMBOLS = ["NVDA", "TSM", "ASML", "AMD", "AVGO", "MU", "QCOM", "INTC"];

function normalizeTimestamp(input: unknown): string {
  const raw = Number(input);
  if (!Number.isFinite(raw) || raw <= 0) {
    return new Date().toISOString();
  }
  const ms = raw > 10_000_000_000 ? raw : raw * 1000;
  return new Date(ms).toISOString();
}

function normalizeUrl(uri: unknown): string {
  const value = typeof uri === "string" ? uri.trim() : "";
  if (!value) return "https://wallstreetcn.com/livenews";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/")) return `https://wallstreetcn.com${value}`;
  return `https://wallstreetcn.com/${value}`;
}

function extractSymbols(text: string): string[] {
  const upper = text.toUpperCase();
  const matchedCn = upper.match(/\b\d{6}\b/g) ?? [];
  const matchedUs = TRACKED_US_SYMBOLS.filter(symbol => upper.includes(symbol));
  return Array.from(new Set([...matchedCn, ...matchedUs]));
}

function normalizeItem(item: WallstreetcnRawItem, fallbackIndex: number): MarketNewsItem | null {
  const content = String(item.content_text ?? item.content ?? "").trim();
  const title = String(item.title ?? "").trim() || content.replace(/\s+/g, " ").trim();
  if (!title) return null;

  const publishedAt = normalizeTimestamp(item.display_time ?? item.created_at);
  const id = String(item.id ?? `${publishedAt}-${fallbackIndex}`);
  const summary = content || title;

  return {
    id,
    title,
    summary,
    source: "wallstreetcn",
    sourceLabel: "华尔街见闻 7x24",
    publishedAt,
    url: normalizeUrl(item.uri),
    symbols: extractSymbols(`${title} ${summary}`),
  };
}

export async function getRecentMarketNewsFromWallstreetcn(
  limit = 8,
  channel: "a-stock-channel" | "global-channel" = "a-stock-channel"
): Promise<MarketNewsItem[]> {
  const query = new URLSearchParams({
    channel,
    limit: String(Math.min(Math.max(limit, 1), 20)),
  });

  const response = await fetch(`${WALLSTREETCN_LIVES_URL}?${query.toString()}`, {
    headers: {
      Accept: "application/json, text/plain, */*",
      "User-Agent": "FangClawDashboard/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`WallstreetCN request failed: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json() as WallstreetcnResponse;
  const rows = payload.data?.items ?? payload.items ?? [];

  return rows
    .map((item, index) => normalizeItem(item, index))
    .filter((item): item is MarketNewsItem => Boolean(item))
    .slice(0, limit);
}
