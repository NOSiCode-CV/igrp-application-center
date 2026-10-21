import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// Built once: unstable mocked query data makes vitest run out of memory.
const available = { data: [], isLoading: false };
const assigned = {
  data: [{ id: 1, name: "read_users", description: "Read users" }],
  isLoading: false,
};
const mutation = { mutateAsync: vi.fn() };

vi.mock("@/features/departments/use-departments", () => ({
  useAvailablePermissions: () => available,
  useDepartmentPermissions: () => assigned,
  useAddPermissionsToDepartment: () => mutation,
  useRemovePermissionsFromDepartment: () => mutation,
}));

vi.mock("@/features/permissions/components/resource-manage-modal", () => ({
  ManageResourcesModal: () => null,
}));

import { PermissionList } from "@/features/permissions/components/permission-list";

import { renderWithIntl } from "../helpers/intl";

afterEach(cleanup);

describe("PermissionList", () => {
  it("renders in Portuguese by default", () => {
    renderWithIntl(<PermissionList departmentCode="DEPT1" />);
    expect(screen.getByText("Permissões")).toBeTruthy();
    expect(screen.getByText("Gerir Recursos")).toBeTruthy();
  });

  it("renders in English", () => {
    renderWithIntl(<PermissionList departmentCode="DEPT1" />, {
      locale: "en",
    });
    expect(screen.getByText("Permissions")).toBeTruthy();
    expect(screen.getByText("Manage Resources")).toBeTruthy();
    expect(screen.getByLabelText("Remove permission read_users")).toBeTruthy();
  });
});
