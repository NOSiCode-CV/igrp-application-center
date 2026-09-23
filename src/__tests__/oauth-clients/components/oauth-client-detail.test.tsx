import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { updateOAuthClient } from "@/actions/oauth-clients";
import { oauthClientKeys } from "@/features/oauth-clients/query-keys";
import { serviceAccountKeys } from "@/features/service-accounts/query-keys";

vi.mock("@/actions/oauth-clients", () => ({
  listOAuthClients: vi.fn(),
  getOAuthClient: vi.fn(),
  createOAuthClient: vi.fn(),
  updateOAuthClient: vi.fn(async () => ({ success: true, data: {} })),
  deleteOAuthClient: vi.fn(),
  setOAuthClientActive: vi.fn(),
}));
vi.mock("@/actions/service-accounts", () => ({
  listServiceAccounts: vi.fn(),
  setServiceAccountActive: vi.fn(),
}));
const APPS = { data: [] };
vi.mock("@/features/applications/use-applications", () => ({
  useApplications: () => APPS,
}));

import { OAuthClientDetail } from "@/features/oauth-clients/components/oauth-client-detail";

const client = {
  id: "c1",
  clientId: "etl-runner-m2m",
  clientName: "Nightly ETL",
  active: true,
  requirePkce: true,
  accessTokenTtl: 180,
  refreshTokenTtl: 86400,
  authorizationCodeTtl: 60,
  scopes: [],
  redirectUris: [],
  postLogoutRedirectUris: ["https://keep.me/"],
  grantTypes: ["client_credentials"],
};

function renderWith(accounts: unknown[]) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Number.POSITIVE_INFINITY },
    },
  });
  qc.setQueryData(oauthClientKeys.detail("c1"), client);
  qc.setQueryData(serviceAccountKeys.list(), accounts);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  render(<OAuthClientDetail id="c1" />, { wrapper });
  return qc;
}

beforeEach(() => vi.clearAllMocks());

describe("OAuthClientDetail", () => {
  it("shows humanised TTLs and the locked secret", () => {
    renderWith([]);
    expect(screen.getByText("= 3 minutos")).toBeInTheDocument();
    expect(
      screen.getByText("Mostrado apenas uma vez, no registo"),
    ).toBeInTheDocument();
  });

  it("shows the save bar only when dirty, and saves the full request", async () => {
    vi.mocked(updateOAuthClient).mockResolvedValueOnce({
      success: true,
      data: { ...client, clientName: "Renamed" },
    });
    renderWith([]);
    expect(
      screen.queryByRole("region", { name: "Alterações por guardar" }),
    ).not.toBeInTheDocument();
    const name = screen.getByLabelText(/^Nome/);
    await userEvent.clear(name);
    await userEvent.type(name, "Renamed");
    await userEvent.click(
      await screen.findByRole("button", { name: "Guardar alterações" }),
    );
    expect(updateOAuthClient).toHaveBeenCalledWith(
      "c1",
      expect.objectContaining({
        clientId: "etl-runner-m2m",
        clientName: "Renamed",
        requirePkce: true,
        postLogoutRedirectUris: ["https://keep.me/"],
      }),
    );
    // The save resets the form from the response, so the bar disappears
    // immediately — it does not wait on the invalidated query to refetch.
    await waitFor(() =>
      expect(
        screen.queryByRole("region", { name: "Alterações por guardar" }),
      ).not.toBeInTheDocument(),
    );
  });

  it("keeps a dirty edit when a refetch lands mid-edit (e.g. from a danger-zone mutation)", async () => {
    const qc = renderWith([]);
    const name = screen.getByLabelText(/^Nome/);
    await userEvent.clear(name);
    await userEvent.type(name, "Renamed while editing");
    expect(
      await screen.findByRole("region", { name: "Alterações por guardar" }),
    ).toBeInTheDocument();

    // Simulate a background refetch triggered by an unrelated mutation
    // (every mutation invalidates ["oauth-clients"], including this detail
    // query) while the name field is still dirty.
    await act(async () => {
      qc.setQueryData(oauthClientKeys.detail("c1"), {
        ...client,
        active: false,
      });
    });

    await waitFor(() =>
      expect(screen.getByText("Ativar cliente")).toBeInTheDocument(),
    );
    expect(screen.getByLabelText(/^Nome/)).toHaveValue("Renamed while editing");
    expect(
      screen.getByRole("region", { name: "Alterações por guardar" }),
    ).toBeInTheDocument();
  });

  it("locks client_credentials and blocks delete when a service account is linked", () => {
    renderWith([
      { id: "sa1", name: "Nightly Invoice ETL", oauthClientId: "c1" },
    ]);
    expect(
      screen.getByRole("checkbox", { name: /client_credentials/ }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Eliminar" })).toBeDisabled();
    expect(
      screen.getByText(
        /Remova primeiro a conta de serviço «Nightly Invoice ETL»/,
      ),
    ).toBeInTheDocument();
  });
});
