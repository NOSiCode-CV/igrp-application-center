import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveTimeZone } from "@/i18n/time-zone";

describe("resolveTimeZone", () => {
  afterEach(() => vi.restoreAllMocks());

  it("defaults when unset", () => {
    expect(resolveTimeZone(undefined)).toBe("Atlantic/Cape_Verde");
    expect(resolveTimeZone("")).toBe("Atlantic/Cape_Verde");
  });

  it("keeps a valid zone", () => {
    expect(resolveTimeZone("Europe/Lisbon")).toBe("Europe/Lisbon");
  });

  it("warns once and falls back on an invalid zone", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(resolveTimeZone("Not/AZone")).toBe("Atlantic/Cape_Verde");
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
