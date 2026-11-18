import { describe, expect, it } from "vitest";

import {
  APPLICATIONS_TYPES,
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
});
