import { describe, expect, it, vi } from "vitest";

// The guards return before any client call; the mock only keeps the module
// import from pulling in server-side auth configuration.
vi.mock("@/actions/access-client", () => ({
  getClientAccess: vi.fn(),
}));

import {
  getAvailableApplications,
  getAvailableMenus,
  getAvailablePermissions,
  getAvailableResources,
  getDepartmentMenus,
  getDepartmentPermissions,
  getDepartmentResources,
} from "@/actions/departments";

describe("departments validation guards", () => {
  it("returns the department-required message when departmentCode is missing", async () => {
    await expect(getAvailableApplications(undefined)).resolves.toEqual({
      success: false,
      error: "Informação do departamento é obrigatório",
    });
    for (const action of [
      getAvailableResources,
      getDepartmentResources,
      getDepartmentPermissions,
      getAvailablePermissions,
    ]) {
      await expect(action("")).resolves.toEqual({
        success: false,
        error: "Informação do departamento é obrigatória",
      });
    }
  });

  it("returns the app-and-department message when either code is missing", async () => {
    for (const action of [getAvailableMenus, getDepartmentMenus]) {
      await expect(action("", "DEP1")).resolves.toEqual({
        success: false,
        error: "Informação de aplicação e departamento são obrigatórios",
      });
    }
  });
});
