import { describe, expect, it } from "vitest";
import { CORE_FACTOR_TEMPLATES } from "./factorTemplateCatalog";

describe("CORE_FACTOR_TEMPLATES", () => {
  it("provides a broad enough baseline for local discovery", () => {
    expect(CORE_FACTOR_TEMPLATES).toHaveLength(10);
    expect(new Set(CORE_FACTOR_TEMPLATES.map(template => template.code)).size).toBe(10);
    expect(CORE_FACTOR_TEMPLATES.map(template => template.code)).toEqual([
      "F01",
      "F02",
      "F03",
      "F04",
      "F05",
      "F06",
      "F07",
      "F08",
      "F09",
      "F10",
    ]);
  });
});
