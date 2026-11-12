import { describe, expect, it } from "vitest";

import { getGreeting } from "./greeting";

function makeDate(h: number) {
  const d = new Date();
  d.setHours(h, 0, 0, 0);
  return d;
}

describe("getGreeting", () => {
  it("returns morning for hour < 12", () => {
    expect(getGreeting(makeDate(8))).toBe("morning");
  });
  it("returns afternoon for 12 <= hour < 19", () => {
    expect(getGreeting(makeDate(14))).toBe("afternoon");
  });
  it("returns evening for hour >= 19", () => {
    expect(getGreeting(makeDate(20))).toBe("evening");
  });
});
