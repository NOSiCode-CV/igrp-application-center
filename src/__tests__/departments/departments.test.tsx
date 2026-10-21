import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// Built once: unstable mocked query data makes vitest run out of memory.
const departments = {
  data: [
    {
      id: 1,
      code: "DEPT1",
      name: "Finance",
      description: null,
      status: "ACTIVE",
      parentCode: null,
    },
  ],
  isLoading: false,
  error: null,
};
const mutation = { mutateAsync: vi.fn(), isPending: false };
const emptyQuery = { data: [], isLoading: false, error: null };

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/features/departments/use-departments", () => ({
  useDepartments: () => departments,
  useCreateDepartment: () => mutation,
  useUpdateDepartment: () => mutation,
  useDeleteDepartment: () => mutation,
  useDepartmentAvailableApps: () => emptyQuery,
  useAddApplicationsToDepartment: () => mutation,
  useRemoveApplicationsFromDepartment: () => mutation,
}));

vi.mock("@/features/applications/use-applications", () => ({
  useApplications: () => emptyQuery,
}));

// The tab contents belong to the roles, permissions and menus features.
vi.mock("@/features/roles/components/role-tree-list", () => ({
  RolesListTree: () => null,
}));
vi.mock("@/features/permissions/components/permission-list", () => ({
  PermissionList: () => null,
}));
vi.mock("@/features/departments/components/dept-menu", () => ({
  MenuPermissions: () => null,
}));

import { DepartmentFormDialog } from "@/features/departments/components/dept-form-dialog";
import { DepartmentListTree } from "@/features/departments/components/dept-list-tree";
import { ManageAppsModal } from "@/features/departments/components/modal/manage-apps-modal";
import { makeDepartmentSchema } from "@/features/departments/dept-schemas";
import en from "@/i18n/messages/en.json";

import { renderWithIntl } from "../helpers/intl";

afterEach(cleanup);

describe("DepartmentListTree", () => {
  it("renders in Portuguese by default", () => {
    renderWithIntl(<DepartmentListTree />);
    expect(screen.getAllByText("Novo Departamento").length).toBeGreaterThan(0);
    expect(screen.getByText("Sem descrição.")).toBeTruthy();
  });

  it("renders in English", () => {
    renderWithIntl(<DepartmentListTree />, { locale: "en" });
    expect(screen.getAllByText("Department Management").length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText("New Department").length).toBeGreaterThan(0);
    expect(screen.getAllByPlaceholderText("Search department…").length).toBe(1);
    expect(screen.getByText("1 department")).toBeTruthy();
    expect(screen.getByText("No description.")).toBeTruthy();
    expect(screen.getByText("Manage Applications")).toBeTruthy();
    expect(screen.getByText("Active")).toBeTruthy();
  });
});

describe("Department dialogs", () => {
  it("renders the form in English", () => {
    renderWithIntl(
      <DepartmentFormDialog open onOpenChange={() => {}} department={null} />,
      { locale: "en" },
    );
    expect(screen.getByText("Create New Department")).toBeTruthy();
    expect(screen.getByPlaceholderText("Department name")).toBeTruthy();
    expect(screen.getByText("Save and New")).toBeTruthy();
  });

  it("renders the manage applications modal in English", () => {
    renderWithIntl(
      <ManageAppsModal departmentCode="DEPT1" open onOpenChange={() => {}} />,
      { locale: "en" },
    );
    expect(screen.getByText("Manage Applications")).toBeTruthy();
    expect(
      screen.getByText("There are no applications available"),
    ).toBeTruthy();
  });
});

describe("makeDepartmentSchema", () => {
  it("takes its messages from the translator", () => {
    const schema = makeDepartmentSchema(
      (key) => en.departments.validation[key],
    );
    const result = schema.safeParse({
      code: "a",
      name: "N",
      status: "ACTIVE",
    });
    expect(result.success).toBe(false);
    const messages = result.error?.issues.map((i) => i.message);
    expect(messages).toContain(en.departments.validation.codeMin);
    expect(messages).toContain(en.departments.validation.nameMin);
  });
});
