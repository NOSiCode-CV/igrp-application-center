import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// Built once: unstable mocked query data makes vitest run out of memory.
const roles = {
  data: [
    {
      id: 1,
      code: "ADMIN",
      name: "Admin",
      description: null,
      departmentCode: "DEPT1",
      parentCode: null,
      status: "ACTIVE",
    },
  ],
  isLoading: false,
  error: null,
};
const mutation = { mutateAsync: vi.fn(), isPending: false };

vi.mock("@/features/departments/use-departments", () => ({
  useRoles: () => roles,
  useCreateRole: () => mutation,
  useUpdateRole: () => mutation,
  useDeleteRole: () => mutation,
}));

import { RoleDeleteDialog } from "@/features/roles/components/role-delete-dialog";
import { RoleFormDialog } from "@/features/roles/components/role-form-dialog";
import { RolesListTree } from "@/features/roles/components/role-tree-list";

import { renderWithIntl } from "../helpers/intl";

afterEach(cleanup);

describe("RolesListTree", () => {
  it("renders in Portuguese by default", () => {
    renderWithIntl(<RolesListTree departmentCode="DEPT1" />);
    expect(screen.getByText("Gerir e reorganizar os perfis.")).toBeTruthy();
    expect(screen.getByText("Novo Perfil")).toBeTruthy();
  });

  it("renders in English", () => {
    renderWithIntl(<RolesListTree departmentCode="DEPT1" />, {
      locale: "en",
    });
    expect(screen.getByText("Manage and reorganize the roles.")).toBeTruthy();
    expect(screen.getByText("New Role")).toBeTruthy();
    expect(screen.getByText("Active")).toBeTruthy();
    expect(screen.getByText("N/A")).toBeTruthy();
  });
});

describe("Role dialogs", () => {
  it("renders the form in English", () => {
    renderWithIntl(
      <RoleFormDialog
        open
        onOpenChange={() => {}}
        departmentCode="DEPT1"
        parentRoleName="ADMIN"
      />,
      { locale: "en" },
    );
    expect(screen.getByText("Create New Role")).toBeTruthy();
    expect(screen.getByPlaceholderText("Role name")).toBeTruthy();
  });

  it("renders the delete confirmation in English", () => {
    renderWithIntl(
      <RoleDeleteDialog
        open
        onOpenChange={() => {}}
        departmentCode="DEPT1"
        roleToDelete="ADMIN"
      />,
      { locale: "en" },
    );
    expect(screen.getByText("Role Name")).toBeTruthy();
    expect(screen.getByPlaceholderText("Type 'ADMIN' to confirm")).toBeTruthy();
  });
});
