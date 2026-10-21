import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// Built once: unstable mocked query data makes vitest run out of memory.
const roles = {
  data: [
    {
      id: 1,
      code: "ADMIN",
      name: "Admin",
      description: "",
      departmentCode: "D1",
      parentCode: "BASE",
      permissions: ["a", "b", "c", "d", "e"],
    },
  ],
  isLoading: false,
};
const active = { data: undefined };
const mutation = { mutateAsync: vi.fn(), isPending: false };

vi.mock("@/features/users/use-users", () => ({
  useGetCurrentUserRoles: () => roles,
  useCurrentUserActiveRole: () => active,
  useSetCurrentUserActiveRole: () => mutation,
}));

import ProfileRoleList from "@/features/profile/components/profile-role-list";

import { renderWithIntl } from "../helpers/intl";

afterEach(cleanup);

describe("ProfileRoleList", () => {
  it("renders in Portuguese by default", () => {
    renderWithIntl(<ProfileRoleList />);
    expect(screen.getByText("Perfis Atribuídos")).toBeTruthy();
    expect(screen.getByText("5 permissões")).toBeTruthy();
    expect(screen.getByText("+2 mais")).toBeTruthy();
  });

  it("renders in English", () => {
    renderWithIntl(<ProfileRoleList />, { locale: "en" });
    expect(screen.getByText("Assigned Roles")).toBeTruthy();
    expect(screen.getByText("5 permissions")).toBeTruthy();
    expect(screen.getByText("+2 more")).toBeTruthy();
    expect(screen.getByText("Activate")).toBeTruthy();
  });
});
