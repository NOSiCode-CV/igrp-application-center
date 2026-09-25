import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { updateServiceAccountIdentity } from "@/actions/service-accounts";
import { oauthClientKeys } from "@/features/oauth-clients/query-keys";
import { serviceAccountKeys } from "@/features/service-accounts/query-keys";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
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
  updateServiceAccountIdentity: vi.fn(async () => ({
    success: true,
    data: {},
  })),
  setServiceAccountAccess: vi.fn(),
  deleteServiceAccount: vi.fn(),
  setServiceAccountActive: vi.fn(),
}));
vi.mock("@/actions/roles", () => ({
  getRoleById: vi.fn(async () => ({ success: false, error: "x" })),
  getRoleByCode: vi.fn(),
}));

import { ServiceAccountDetail } from "@/features/service-accounts/components/service-account-detail";

const account = {
  id: "sa1",
  name: "Nightly Invoice ETL",
  description: "Exporta faturas",
  active: true,
  oauthClientId: "c1",
  clientId: "etl-runner-m2m",
  applicationCode: "INV",
  roleIds: [],
  roleCodes: [],
  permissionIds: [],
  permissionNames: [],
  createdAt: "2026-03-14T10:05:00Z",
};
const client = {
  id: "c1",
  clientId: "etl-runner-m2m",
  clientName: "ETL runner",
  active: true,
  grantTypes: ["client_credentials"],
  scopes: [],
  redirectUris: [],
};

function renderDetail() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Number.POSITIVE_INFINITY },
    },
  });
  qc.setQueryData(serviceAccountKeys.detail("sa1"), account);
  qc.setQueryData(oauthClientKeys.detail("c1"), client);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  render(<ServiceAccountDetail id="sa1" />, { wrapper });
}

beforeEach(() => vi.clearAllMocks());

describe("ServiceAccountDetail", () => {
  it("shows the header and the linked client", () => {
    renderDetail();
    expect(
      screen.getByRole("heading", { level: 2, name: "Nightly Invoice ETL" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Ativa")).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /etl-runner-m2m/ })[0],
    ).toHaveAttribute("href", "/settings/accounts/clients/c1");
    expect(
      screen.getByText("Fixo enquanto esta conta existir."),
    ).toBeInTheDocument();
    expect(screen.getByText("Herdada do cliente OAuth.")).toBeInTheDocument();
  });

  it("edits the identity in place", async () => {
    renderDetail();
    await userEvent.click(
      screen.getByRole("button", { name: "Editar identidade" }),
    );
    const name = screen.getByLabelText("Nome *");
    await userEvent.clear(name);
    await userEvent.type(name, "Renamed");
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() =>
      expect(updateServiceAccountIdentity).toHaveBeenCalledWith("sa1", {
        name: "Renamed",
        description: "Exporta faturas",
      }),
    );
  });

  it("disables the danger zone and identity save while an edit is pending", async () => {
    let finish: (v: { success: true; data: never }) => void = () => {};
    vi.mocked(updateServiceAccountIdentity).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    renderDetail();
    await userEvent.click(
      screen.getByRole("button", { name: "Editar identidade" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Desativar" })).toBeDisabled(),
    );
    expect(screen.getByRole("button", { name: "Eliminar" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "A guardar…" })).toBeDisabled();
    finish({ success: true, data: {} as never });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Eliminar" })).toBeEnabled(),
    );
  });

  it("names the client in the deactivate copy", () => {
    renderDetail();
    expect(
      screen.getByText(/Desativa também o cliente OAuth etl-runner-m2m/),
    ).toBeInTheDocument();
  });
});
