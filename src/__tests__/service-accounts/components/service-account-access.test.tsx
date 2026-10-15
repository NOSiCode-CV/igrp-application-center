import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { setServiceAccountAccess } from "@/actions/service-accounts";
import { serviceAccountKeys } from "@/features/service-accounts/query-keys";

vi.mock("@/actions/service-accounts", () => ({
  listServiceAccounts: vi.fn(),
  getServiceAccount: vi.fn(),
  createServiceAccount: vi.fn(),
  createServiceAccountWithNewClient: vi.fn(),
  updateServiceAccountIdentity: vi.fn(),
  setServiceAccountAccess: vi.fn(async () => ({ success: true, data: {} })),
  deleteServiceAccount: vi.fn(),
  setServiceAccountActive: vi.fn(),
}));
vi.mock("@/actions/oauth-clients", () => ({
  listOAuthClients: vi.fn(),
  getOAuthClient: vi.fn(),
  createOAuthClient: vi.fn(),
  updateOAuthClient: vi.fn(),
  deleteOAuthClient: vi.fn(),
  setOAuthClientActive: vi.fn(),
}));
const ROLES: Record<number, unknown> = {
  1: {
    id: 1,
    code: "INV.reader",
    description: "Lê faturas",
    departmentCode: "INV",
    permissions: ["inv.read", "inv.list"],
  },
  2: {
    id: 2,
    code: "INV.exporter",
    departmentCode: "INV",
    permissions: ["inv.read", "inv.export"],
  },
};
vi.mock("@/actions/roles", () => ({
  getRoleById: vi.fn(async (id: number) => ({
    success: true,
    data: ROLES[id],
  })),
  getRoleByCode: vi.fn(),
}));
const DEPTS = { data: [], isLoading: false, error: null };
const EMPTY = { data: [], isLoading: false, isError: false };
vi.mock("@/features/departments/use-departments", () => ({
  useDepartments: () => DEPTS,
  useRoles: () => EMPTY,
  useDepartmentPermissions: () => EMPTY,
}));

import { ServiceAccountAccess } from "@/features/service-accounts/components/service-account-access";

const base = {
  id: "sa1",
  name: "Nightly",
  active: true,
  oauthClientId: "c1",
  clientId: "etl",
  roleIds: [1, 2],
  roleCodes: ["INV.reader", "INV.exporter"],
  permissionIds: [9],
  permissionNames: ["inv.approve"],
};

function renderAccess(account = base) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Number.POSITIVE_INFINITY },
    },
  });
  qc.setQueryData(serviceAccountKeys.detail("sa1"), account);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  render(<ServiceAccountAccess id="sa1" />, { wrapper });
}

beforeEach(() => vi.clearAllMocks());

describe("ServiceAccountAccess", () => {
  it("counts effective permissions from roles and direct grants", async () => {
    renderAccess();
    await waitFor(() =>
      expect(screen.getByTestId("effective-from-roles")).toHaveTextContent("3"),
    );
    expect(screen.getByTestId("effective-direct")).toHaveTextContent("1");
    expect(screen.getByTestId("effective-total")).toHaveTextContent("4");
  });

  it("lists roles by department with permission counts", async () => {
    renderAccess();
    expect(await screen.findByText("INV.reader")).toBeInTheDocument();
    expect(screen.getAllByText("2 permissões")).toHaveLength(2);
  });

  it("removes a role after inline confirmation, sending the reduced set", async () => {
    renderAccess();
    await userEvent.click(
      await screen.findByRole("button", { name: "Remover perfil INV.reader" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Confirmar remoção" }),
    );
    await waitFor(() =>
      expect(setServiceAccountAccess).toHaveBeenCalledWith("sa1", {
        roles: { remove: [1] },
      }),
    );
  });

  it("removes a direct permission", async () => {
    renderAccess();
    await userEvent.click(
      screen.getByRole("button", { name: "Remover permissão inv.approve" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Confirmar remoção" }),
    );
    await waitFor(() =>
      expect(setServiceAccountAccess).toHaveBeenCalledWith("sa1", {
        permissions: { remove: [{ id: 9, name: "inv.approve" }] },
      }),
    );
  });

  it("keeps rows apart when a name repeats across departments", async () => {
    renderAccess({
      ...base,
      permissionIds: [9, 10],
      permissionNames: ["inv.read", "inv.read"],
    });
    const removes = screen.getAllByRole("button", {
      name: "Remover permissão inv.read",
    });
    expect(removes).toHaveLength(2);
    await userEvent.click(removes[1]);
    expect(
      screen.getAllByRole("button", { name: "Confirmar remoção" }),
    ).toHaveLength(1);
    await userEvent.click(
      screen.getByRole("button", { name: "Confirmar remoção" }),
    );
    await waitFor(() =>
      expect(setServiceAccountAccess).toHaveBeenCalledWith("sa1", {
        permissions: { remove: [{ id: 10, name: "inv.read" }] },
      }),
    );
  });

  it("disables every access edit while a save on the account is pending", async () => {
    let finish: (v: { success: true; data: never }) => void = () => {};
    vi.mocked(setServiceAccountAccess).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    renderAccess();
    await userEvent.click(
      await screen.findByRole("button", { name: "Remover perfil INV.reader" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Confirmar remoção" }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Remover permissão inv.approve" }),
      ).toBeDisabled(),
    );
    expect(
      screen.getByRole("button", { name: "Atribuir perfil" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Adicionar permissão" }),
    ).toBeDisabled();
    finish({ success: true, data: {} as never });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Adicionar permissão" }),
      ).toBeEnabled(),
    );
  });

  it("refuses to remove direct permissions it cannot pair", () => {
    renderAccess({
      ...base,
      permissionIds: [9, 10],
      permissionNames: ["inv.approve"],
    });
    expect(
      screen.getByRole("button", { name: "Remover permissão inv.approve" }),
    ).toBeDisabled();
  });
});
