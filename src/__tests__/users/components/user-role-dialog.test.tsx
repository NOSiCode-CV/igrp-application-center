import { describe, expect, it } from "vitest";
import { computeRoleDiff } from "@/features/users/lib/role-diff";

describe("UserRoleDialog — expiresAt via computeRoleDiff", () => {
  it("assigns expiresAt to all newly added roles when provided", () => {
    const { toAdd } = computeRoleDiff([], ["ADMIN", "VIEWER"], "2026-12-31");
    expect(toAdd.roles).toEqual(["ADMIN", "VIEWER"]);
    expect(toAdd.expiresAt).toBe("2026-12-31");
  });

  it("does not include expiresAt for permanent assignments", () => {
    const { toAdd } = computeRoleDiff([], ["ADMIN"]);
    expect("expiresAt" in toAdd).toBe(false);
  });

  it("only adds roles that are newly selected", () => {
    const { toAdd } = computeRoleDiff(
      ["EXISTING"],
      ["EXISTING", "NEW"],
      "2027-01-01",
    );
    expect(toAdd.roles).toEqual(["NEW"]);
  });
});
