import { describe, expect, it } from "vitest";
import { computeRoleDiff } from "@/features/users/lib/role-diff";

describe("computeRoleDiff", () => {
  it("adds roles not in current", () => {
    const { toAdd, toRemove } = computeRoleDiff(["A"], ["A", "B"]);
    expect(toAdd.roles).toEqual(["B"]);
    expect(toRemove).toEqual([]);
  });

  it("removes roles not in selected", () => {
    const { toAdd, toRemove } = computeRoleDiff(["A", "B"], ["A"]);
    expect(toAdd.roles).toEqual([]);
    expect(toRemove).toEqual(["B"]);
  });

  it("handles add and remove simultaneously", () => {
    const { toAdd, toRemove } = computeRoleDiff(["A", "B"], ["B", "C"]);
    expect(toAdd.roles).toEqual(["C"]);
    expect(toRemove).toEqual(["A"]);
  });

  it("includes expiresAt when provided", () => {
    const { toAdd } = computeRoleDiff([], ["A"], "2026-12-31");
    expect(toAdd.expiresAt).toBe("2026-12-31");
  });

  it("omits expiresAt when not provided", () => {
    const { toAdd } = computeRoleDiff([], ["A"]);
    expect("expiresAt" in toAdd).toBe(false);
  });

  it("returns empty diff when nothing changes", () => {
    const { toAdd, toRemove } = computeRoleDiff(["A", "B"], ["A", "B"]);
    expect(toAdd.roles).toEqual([]);
    expect(toRemove).toEqual([]);
  });
});
