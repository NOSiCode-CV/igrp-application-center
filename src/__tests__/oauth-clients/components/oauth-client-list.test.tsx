import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { oauthClientKeys } from "@/features/oauth-clients/query-keys";
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
const copy = vi.fn();
vi.mock("@/features/oauth-clients/use-copy-client-id", () => ({
  useCopyClientId: () => copy,
}));

import { OAuthClientList } from "@/features/oauth-clients/components/oauth-client-list";

const ttl = { accessTokenTtl: 1, refreshTokenTtl: 1, authorizationCodeTtl: 1 };
const clients = [
  {
    id: "c1",
    clientId: "etl-runner-m2m",
    clientName: "Nightly ETL",
    active: true,
    applicationCode: "INV",
    scopes: [],
    redirectUris: [],
    grantTypes: ["client_credentials"],
    ...ttl,
  },
  {
    id: "c2",
    clientId: "portal-web",
    clientName: "Portal",
    active: true,
    scopes: [],
    redirectUris: [],
    grantTypes: ["authorization_code", "refresh_token"],
    ...ttl,
  },
  {
    id: "c3",
    clientId: "spare-m2m",
    active: false,
    scopes: [],
    redirectUris: [],
    grantTypes: ["client_credentials"],
    ...ttl,
  },
];
const accounts = [
  { id: "sa1", name: "Nightly Invoice", oauthClientId: "c1", active: true },
];

function renderList() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Number.POSITIVE_INFINITY },
    },
  });
  qc.setQueryData(oauthClientKeys.list(), clients);
  qc.setQueryData(serviceAccountKeys.list(), accounts);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  render(<OAuthClientList />, { wrapper });
}

describe("OAuthClientList", () => {
  it("links a client to the service account that wraps it", () => {
    renderList();
    const row = screen.getByRole("row", { name: /Nightly ETL/ });
    expect(
      within(row).getByRole("link", { name: "Nightly Invoice" }),
    ).toHaveAttribute("href", "/settings/accounts/services/sa1");
  });

  it("says a machine client has no account, and leaves web clients blank", () => {
    renderList();
    expect(
      within(screen.getByRole("row", { name: /spare-m2m/ })).getByText(
        "Sem conta",
      ),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("row", { name: /Portal/ })).queryByText(
        "Sem conta",
      ),
    ).not.toBeInTheDocument();
  });

  it("names the application and keeps its code", () => {
    renderList();
    const row = screen.getByRole("row", { name: /Nightly ETL/ });
    expect(within(row).getByText("Faturação")).toBeInTheDocument();
    expect(within(row).getByText("INV")).toBeInTheDocument();
    expect(
      within(screen.getByRole("row", { name: /Portal/ })).getByText(
        "Sem aplicação",
      ),
    ).toBeInTheDocument();
  });

  it("copies the client ID from the row", async () => {
    renderList();
    await userEvent.click(
      screen.getByRole("button", { name: "Copiar client ID etl-runner-m2m" }),
    );
    expect(copy).toHaveBeenCalledWith("etl-runner-m2m");
  });
});
