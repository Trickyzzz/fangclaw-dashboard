const SEC_BASE_URL = "https://www.sec.gov";
const SEC_DATA_BASE_URL = "https://data.sec.gov";
const SEC_TICKER_URL = `${SEC_BASE_URL}/files/company_tickers.json`;
const SEC_USER_AGENT = "FangClawDashboard/1.0 (research@fangclaw.local)";
const TRACKED_US_SYMBOLS = ["NVDA", "TSM", "ASML", "AMD", "AVGO", "MU", "QCOM", "INTC"] as const;

type SecTickerRecord = {
  ticker: string;
  cik_str: number;
  title: string;
};

type SecTickerResponse = Record<string, SecTickerRecord>;

type SecRecentFilings = {
  accessionNumber?: string[];
  filingDate?: string[];
  form?: string[];
  primaryDocDescription?: string[];
  primaryDocument?: string[];
};

type SecSubmissionResponse = {
  filings?: {
    recent?: SecRecentFilings;
  };
};

export type SecFilingItem = {
  symbol: string;
  companyName: string;
  cik: string;
  formType: string;
  filedAt: string;
  description: string;
  accessionNumber: string;
  url: string;
};

function getSecHeaders(): HeadersInit {
  return {
    "User-Agent": SEC_USER_AGENT,
    Accept: "application/json",
  };
}

function normalizeCik(value: number | string): string {
  return String(value).padStart(10, "0");
}

function buildSubmissionUrl(cik: string): string {
  return `${SEC_DATA_BASE_URL}/submissions/CIK${cik}.json`;
}

function buildFilingUrl(cik: string, accessionNumber: string, primaryDocument: string): string {
  const accessionWithoutDashes = accessionNumber.replaceAll("-", "");
  return `${SEC_BASE_URL}/Archives/edgar/data/${Number(cik)}/${accessionWithoutDashes}/${primaryDocument}`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: getSecHeaders(),
  });

  if (!response.ok) {
    throw new Error(`SEC request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

async function getTrackedCompanies(): Promise<SecTickerRecord[]> {
  const companies = await fetchJson<SecTickerResponse>(SEC_TICKER_URL);
  return Object.values(companies).filter(company =>
    TRACKED_US_SYMBOLS.includes(company.ticker as (typeof TRACKED_US_SYMBOLS)[number])
  );
}

function normalizeRecentFilings(company: SecTickerRecord, recent: SecRecentFilings | undefined): SecFilingItem[] {
  if (!recent?.accessionNumber?.length) {
    return [];
  }

  return recent.accessionNumber
    .map((accessionNumber, index) => {
      const cik = normalizeCik(company.cik_str);
      const filedAt = recent.filingDate?.[index];
      const formType = recent.form?.[index];
      const primaryDocument = recent.primaryDocument?.[index];

      if (!filedAt || !formType || !primaryDocument) {
        return null;
      }

      return {
        symbol: company.ticker,
        companyName: company.title,
        cik,
        formType,
        filedAt,
        description: recent.primaryDocDescription?.[index] || formType,
        accessionNumber,
        url: buildFilingUrl(cik, accessionNumber, primaryDocument),
      } satisfies SecFilingItem;
    })
    .filter((item): item is SecFilingItem => Boolean(item));
}

export async function getRecentSecFilings(limit = 6): Promise<SecFilingItem[]> {
  const companies = await getTrackedCompanies();

  const filingsByCompany = await Promise.all(
    companies.map(async company => {
      const cik = normalizeCik(company.cik_str);

      try {
        const submissions = await fetchJson<SecSubmissionResponse>(
          buildSubmissionUrl(cik)
        );
        return normalizeRecentFilings(company, submissions.filings?.recent);
      } catch (error) {
        console.error(`[SEC] Failed to fetch submissions for ${company.ticker}:`, error);
        return [];
      }
    })
  );

  return filingsByCompany
    .flat()
    .sort((a, b) => b.filedAt.localeCompare(a.filedAt))
    .slice(0, limit);
}
