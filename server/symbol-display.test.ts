import { describe, expect, it } from "vitest";
import { getDisplayNameForSymbol, normalizeEquitySymbol } from "../client/src/lib/symbolDisplay";

describe("symbol display helpers", () => {
  it("normalizes exchange suffixes before matching company names", () => {
    expect(normalizeEquitySymbol("300557.SZ")).toBe("300557");
    expect(normalizeEquitySymbol("688256.SH")).toBe("688256");
  });

  it("uses target pool names before fallback names", () => {
    const companies = [{ symbol: "300557", name: "理工光科" }];

    expect(getDisplayNameForSymbol("300557.SZ", companies)).toBe("理工光科");
  });

  it("uses built-in fallback names and preserves unknown symbols", () => {
    expect(getDisplayNameForSymbol("300033.SZ", [])).toBe("同花顺");
    expect(getDisplayNameForSymbol("999999.SZ", [])).toBe("999999.SZ");
  });
});
