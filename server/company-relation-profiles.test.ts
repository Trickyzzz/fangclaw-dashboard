import { describe, expect, it } from "vitest";
import { getRelationProfile, relationTokensFor } from "./companyRelationProfiles";

describe("company relation profiles", () => {
  it("maps target companies to aliases and ecosystem anchors", () => {
    expect(relationTokensFor("688256")).toEqual(expect.arrayContaining([
      "寒武纪",
      "字节跳动",
      "英伟达",
      "台积电",
      "国产替代",
    ]));
  });

  it("returns null for unknown symbols", () => {
    expect(getRelationProfile("UNKNOWN")).toBeNull();
  });
});
