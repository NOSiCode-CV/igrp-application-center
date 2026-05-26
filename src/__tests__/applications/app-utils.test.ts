import { describe, expect, it } from "vitest";
import {
  APPLICATIONS_TYPES,
  APPLICATIONS_TYPES_FILTERED,
  formatSlug,
} from "@/features/applications/app-utils";

describe("formatSlug", () => {
  it("returns slug untouched when already prefixed with /apps", () => {
    expect(formatSlug("/apps/foo")).toBe("/apps/foo");
  });

  it("prepends /apps/ to a bare slug", () => {
    expect(formatSlug("foo")).toBe("/apps/foo");
  });
});

describe("APPLICATIONS_TYPES", () => {
  it("contains EXTERNAL and INTERNAL", () => {
    expect([...APPLICATIONS_TYPES]).toEqual(["EXTERNAL", "INTERNAL"]);
  });

  it("matches the dropdown options 1:1", () => {
    expect(APPLICATIONS_TYPES_FILTERED.map((o) => o.value)).toEqual([
      ...APPLICATIONS_TYPES,
    ]);
  });
});
