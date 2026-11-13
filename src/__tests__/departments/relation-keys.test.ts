import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import {
  departmentKeys,
  departmentRelationKeys,
  invalidateKeys,
} from "@/features/departments/query-keys";

describe("departmentRelationKeys", () => {
  it("marks each added or removed app's menus stale for that department", () => {
    const keys = departmentRelationKeys.applications("DEPT1", [
      "APP_A",
      "APP_B",
    ]);
    expect(keys).toContainEqual(departmentKeys.menus("APP_A", "DEPT1"));
    expect(keys).toContainEqual(
      departmentKeys.availableMenus("APP_B", "DEPT1"),
    );
    // The old code put the department code in the app slot, which never matched.
    expect(keys).not.toContainEqual(["department-menus", "DEPT1"]);
  });

  it("marks permissions stale when resources change", () => {
    expect(departmentRelationKeys.resources("DEPT1")).toContainEqual(
      departmentKeys.permissions("DEPT1"),
    );
  });

  it("refreshes a cached menu query after its app joins the department", async () => {
    const qc = new QueryClient();
    qc.setQueryData(departmentKeys.menus("APP_A", "DEPT1"), []);
    qc.setQueryData(departmentKeys.menus("APP_A", "OTHER"), []);
    await invalidateKeys(
      qc,
      departmentRelationKeys.applications("DEPT1", ["APP_A"]),
    );
    expect(
      qc.getQueryState(departmentKeys.menus("APP_A", "DEPT1"))?.isInvalidated,
    ).toBe(true);
    expect(
      qc.getQueryState(departmentKeys.menus("APP_A", "OTHER"))?.isInvalidated,
    ).toBe(false);
  });

  it("invalidates every key it is given", async () => {
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, "invalidateQueries");
    const keys = departmentRelationKeys.rolePermissions("DEPT1", "ADMIN");
    await invalidateKeys(qc, keys);
    expect(spy).toHaveBeenCalledTimes(keys.length);
  });
});
