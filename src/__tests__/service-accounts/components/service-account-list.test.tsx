import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { serviceAccountKeys } from "@/features/service-accounts/query-keys";

vi.mock("@/actions/oauth-clients", () => ({
  listOAuthClients: vi.fn(),
  getOAuthClient: vi.fn(),
  createOAuthClient: vi.fn(),
  updateOAuthClient: vi.fn(),
  deleteOAuthClient: vi.fn(),
  setOAuthClientActive: vi.fn(),
}));
vi.mock("@/actions/service-accounts", () => ({
  listServiceAccounts: vi.fn(),
  getServiceAccount: vi.fn(),
  createServiceAccount: vi.fn(),
  createServiceAccountWithNewClient: vi.fn(),
  updateServiceAccountIdentity: vi.fn(),
  setServiceAccountAccess: vi.fn(),
  deleteServiceAccount: vi.fn(),
  setServiceAccountActive: vi.fn(),
}));
const APPS = { data: [{ id: 7, code: "INV", name: "Faturação" }] };
vi.mock("@/features/applications/use-applications", () => ({
  useApplications: () => APPS,
}));

import { ServiceAccountList } from "@/features/service-accounts/components/service-account-list";

const accounts = [
  {
    id: "sa1",
    name: "Nightly Invoice",
    active: true,
    oauthClientId: "c1",
    clientId: "etl-runner-m2m",
    applicationCode: "INV",
    roleIds: [1, 2],
    roleCodes: ["INV.reader", "INV.exporter"],
    permissionIds: [9, 10, 11],
    permissionNames: ["a", "b", "c"],
  },
  {
    id: "sa2",
    name: "Legacy Reporter",
    active: false,
    oauthClientId: "c2",
    clientId: "legacy-report",
    roleIds: [],
    permissionIds: [],
  },
];

function renderList(data: unknown[]) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Number.POSITIVE_INFINITY },
    },
  });
  qc.setQueryData(serviceAccountKeys.list(), data);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  render(<ServiceAccountList />, { wrapper });
}

describe("ServiceAccountList", () => {
  it("shows name, client, access summary and state", () => {
    renderList(accounts);
    const row = screen.getByRole("row", { name: /Nightly Invoice/ });
    expect(
      within(row).getByRole("link", { name: "Nightly Invoice" }),
    ).toHaveAttribute("href", "/settings/accounts/services/sa1");
    expect(
      within(row).getByRole("link", { name: "etl-runner-m2m" }),
    ).toHaveAttribute("href", "/settings/accounts/clients/c1");
    expect(within(row).getByText("2 perfis · 3 diretas")).toBeInTheDocument();
    expect(within(row).getByText("Ativa")).toBeInTheDocument();
    expect(
      within(screen.getByRole("row", { name: /Legacy Reporter/ })).getByText(
        "Inativa",
      ),
    ).toBeInTheDocument();
  });

  it("counts and names roles from the backend's role pairs, with department", async () => {
    renderList([
      {
        ...accounts[0],
        // Two roles share a code across departments: the flat roleCodes set
        // collapses them, the pairs keep both.
        roles: [
          { id: 1, code: "reader", departmentCode: "INV" },
          { id: 2, code: "reader", departmentCode: "RH" },
        ],
        roleCodes: ["reader"],
        permissions: [{ id: 9, name: "a" }],
      },
    ]);
    const row = screen.getByRole("row", { name: /Nightly Invoice/ });
    await userEvent.click(within(row).getByText("2 perfis · 1 direta"));
    expect(screen.getByText("reader · INV")).toBeInTheDocument();
    expect(screen.getByText("reader · RH")).toBeInTheDocument();
  });

  it("filters by search", async () => {
    renderList(accounts);
    await userEvent.type(screen.getByLabelText("Pesquisar contas"), "legacy");
    expect(screen.queryByText("Nightly Invoice")).not.toBeInTheDocument();
    expect(screen.getByText("Legacy Reporter")).toBeInTheDocument();
  });

  it("explains the empty state", () => {
    renderList([]);
    expect(
      screen.getByText("Ainda não há contas de serviço"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Nova conta de serviço/ }),
    ).toHaveAttribute("href", "/settings/accounts/services/new");
  });

  it("offers the row actions", async () => {
    renderList(accounts);
    await userEvent.click(
      screen.getByRole("button", { name: "Ações para Nightly Invoice" }),
    );
    expect(
      screen.getByRole("menuitem", { name: /Ver detalhes/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /Copiar client ID/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /Desativar/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /Eliminar/ }),
    ).toBeInTheDocument();
  });
});
