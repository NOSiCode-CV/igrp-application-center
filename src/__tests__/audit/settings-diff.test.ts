import { describe, expect, it } from "vitest";

import { parseSettingsDiff } from "@/features/audit/lib/settings-diff";

describe("parseSettingsDiff", () => {
  it("pairs a single field", () => {
    expect(
      parseSettingsDiff(
        "description=audit test",
        "description=edited via test",
      ),
    ).toEqual([
      { field: "description", previous: "audit test", next: "edited via test" },
    ]);
  });

  it("pairs several semicolon-separated fields, keeping order", () => {
    expect(
      parseSettingsDiff("name=A;status=ACTIVE", "name=B;status=INACTIVE"),
    ).toEqual([
      { field: "name", previous: "A", next: "B" },
      { field: "status", previous: "ACTIVE", next: "INACTIVE" },
    ]);
  });

  it("splits on the first '=' only", () => {
    expect(parseSettingsDiff("url=a=b", "url=c")).toEqual([
      { field: "url", previous: "a=b", next: "c" },
    ]);
  });

  it("handles a field present on one side only", () => {
    expect(parseSettingsDiff("", "picture=x.png")).toEqual([
      { field: "picture", previous: null, next: "x.png" },
    ]);
  });

  it("returns null when either side is not in field=value form", () => {
    expect(parseSettingsDiff("just text", "name=B")).toBeNull();
    expect(parseSettingsDiff("name=A", "=oops")).toBeNull();
  });

  it("returns null when there is nothing to show", () => {
    expect(parseSettingsDiff(null, null)).toBeNull();
    expect(parseSettingsDiff("", undefined)).toBeNull();
  });
});
