export type SymbolNameCandidate = {
  symbol: string;
  name: string;
};

export const IFIND_SYMBOL_NAME_FALLBACK: Record<string, string> = {
  "300033": "同花顺",
  "300557": "理工光科",
  "688256": "寒武纪",
};

export function normalizeEquitySymbol(symbol: string) {
  return symbol.trim().toUpperCase().replace(/\.(SZ|SH|SS|HK|US)$/, "");
}

export function getDisplayNameForSymbol(
  symbol: string,
  companies: SymbolNameCandidate[],
  fallbackNames: Record<string, string> = IFIND_SYMBOL_NAME_FALLBACK,
) {
  const normalized = normalizeEquitySymbol(symbol);
  const matchedCompany = companies.find(company => normalizeEquitySymbol(company.symbol) === normalized);

  return matchedCompany?.name ?? fallbackNames[normalized] ?? symbol;
}
