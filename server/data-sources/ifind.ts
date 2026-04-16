const DEFAULT_IFIND_BASE_URL = "https://quantapi.51ifind.com/api/v1";
const ACCESS_TOKEN_TTL_MS = 6 * 24 * 60 * 60 * 1000;

let cachedAccessToken: { value: string; expiresAt: number } | null = null;

export type IfindRealtimeQuote = {
  symbol: string;
  time: string | null;
  open: number | null;
  high: number | null;
  low: number | null;
  latest: number | null;
};

type IfindAccessTokenResponse = {
  errorcode?: number;
  errcode?: number;
  errmsg?: string;
  data?: {
    access_token?: string;
  };
};

type IfindRealtimeResponse = {
  errorcode?: number;
  errcode?: number;
  errmsg?: string;
  tables?: {
    thscode?: string;
    table?: Record<string, unknown[]>;
  }[];
};

function getIfindBaseUrl() {
  return (process.env.IFIND_BASE_URL || DEFAULT_IFIND_BASE_URL).replace(/\/$/, "");
}

function assertIfindEnabled() {
  if ((process.env.IFIND_ENABLED || "").toLowerCase() !== "true") {
    throw new Error("iFinD is disabled. Set IFIND_ENABLED=true to enable it.");
  }
  if (!process.env.IFIND_REFRESH_TOKEN?.trim()) {
    throw new Error("IFIND_REFRESH_TOKEN is missing.");
  }
}

async function readJsonResponse<T>(response: Response, sourceName: string): Promise<T> {
  const text = await response.text();
  let payload: T;
  try {
    payload = JSON.parse(text) as T;
  } catch {
    throw new Error(`${sourceName} returned non-JSON response: ${response.status}`);
  }

  if (!response.ok) {
    throw new Error(`${sourceName} request failed: ${response.status}`);
  }
  return payload;
}

function isSuccessCode(payload: { errorcode?: number; errcode?: number }) {
  return (payload.errorcode ?? payload.errcode ?? 0) === 0;
}

export function resetIfindAccessTokenCache() {
  cachedAccessToken = null;
}

export async function getIfindAccessToken(): Promise<string> {
  assertIfindEnabled();

  const now = Date.now();
  if (cachedAccessToken && cachedAccessToken.expiresAt > now) {
    return cachedAccessToken.value;
  }

  const response = await fetch(`${getIfindBaseUrl()}/get_access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      refresh_token: process.env.IFIND_REFRESH_TOKEN!.trim(),
    },
  });
  const payload = await readJsonResponse<IfindAccessTokenResponse>(response, "iFinD access token");

  if (!isSuccessCode(payload) || !payload.data?.access_token) {
    throw new Error(`iFinD access token failed: ${payload.errmsg || "unknown error"}`);
  }

  cachedAccessToken = {
    value: payload.data.access_token,
    expiresAt: now + ACCESS_TOKEN_TTL_MS,
  };
  return cachedAccessToken.value;
}

function firstNumber(table: Record<string, unknown[]> | undefined, key: string): number | null {
  const value = table?.[key]?.[0];
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function firstString(table: Record<string, unknown[]> | undefined, key: string): string | null {
  const value = table?.[key]?.[0];
  return value == null ? null : String(value);
}

function normalizeRealtimeResponse(payload: IfindRealtimeResponse): IfindRealtimeQuote[] {
  return (payload.tables ?? []).map(item => ({
    symbol: item.thscode || "",
    time: firstString(item.table, "time"),
    open: firstNumber(item.table, "open"),
    high: firstNumber(item.table, "high"),
    low: firstNumber(item.table, "low"),
    latest: firstNumber(item.table, "latest"),
  })).filter(item => item.symbol);
}

export async function getIfindRealtimeQuotes(codes: string[]): Promise<IfindRealtimeQuote[]> {
  const normalizedCodes = codes.map(code => code.trim()).filter(Boolean);
  if (normalizedCodes.length === 0) return [];

  const accessToken = await getIfindAccessToken();
  const response = await fetch(`${getIfindBaseUrl()}/real_time_quotation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      access_token: accessToken,
    },
    body: JSON.stringify({
      codes: normalizedCodes.join(","),
      indicators: "open,high,low,latest",
    }),
  });
  const payload = await readJsonResponse<IfindRealtimeResponse>(response, "iFinD realtime quotation");

  if (!isSuccessCode(payload)) {
    throw new Error(`iFinD realtime quotation failed: ${payload.errmsg || "unknown error"}`);
  }
  return normalizeRealtimeResponse(payload);
}
