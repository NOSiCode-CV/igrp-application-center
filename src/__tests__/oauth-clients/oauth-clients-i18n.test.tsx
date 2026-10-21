import type { OAuthClientDTO } from "@igrp/platform-access-management-client-ts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/actions/oauth-clients", () => ({
  listOAuthClients: vi.fn(),
  getOAuthClient: vi.fn(),
  createOAuthClient: vi.fn(),
  updateOAuthClient: vi.fn(),
  deleteOAuthClient: vi.fn(),
  rotateOAuthClientSecret: vi.fn(),
  setOAuthClientActive: vi.fn(),
}));
vi.mock("@/actions/service-accounts", () => ({
  listServiceAccounts: vi.fn(),
  setServiceAccountActive: vi.fn(),
}));
// Built once: unstable mocked query data makes vitest run out of memory.
const APPS = { data: [{ id: 7, code: "INV", name: "Invoicing" }] };
vi.mock("@/features/applications/use-applications", () => ({
  useApplications: () => APPS,
}));

import { OAuthClientCreate } from "@/features/oauth-clients/components/oauth-client-create";
import { OAuthClientList } from "@/features/oauth-clients/components/oauth-client-list";
import { OAuthClientRotateSecretDialog } from "@/features/oauth-clients/components/oauth-client-rotate-secret-dialog";
import { oauthClientKeys } from "@/features/oauth-clients/query-keys";
import { serviceAccountKeys } from "@/features/service-accounts/query-keys";

import { renderWithIntl } from "../helpers/intl";

const CLIENT: OAuthClientDTO = {
  id: "c1",
  clientId: "etl-runner-m2m",
  clientName: "Nightly ETL",
  active: true,
  accessTokenTtl: 1,
  refreshTokenTtl: 1,
  authorizationCodeTtl: 1,
  scopes: [],
  redirectUris: [],
  grantTypes: ["client_credentials"],
};

function queryClient() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Number.POSITIVE_INFINITY },
    },
  });
  qc.setQueryData(oauthClientKeys.list(), [CLIENT]);
  qc.setQueryData(serviceAccountKeys.list(), []);
  return qc;
}

afterEach(cleanup);

describe("oauth-clients in English", () => {
  it("renders the list", () => {
    renderWithIntl(
      <QueryClientProvider client={queryClient()}>
        <OAuthClientList />
      </QueryClientProvider>,
      { locale: "en" },
    );
    expect(screen.getByText("Register client")).toBeInTheDocument();
    expect(screen.getByText("Service account")).toBeInTheDocument();
    expect(screen.getByText("Machine")).toBeInTheDocument();
    expect(screen.getByText("No account")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders the registration form", () => {
    renderWithIntl(
      <QueryClientProvider client={queryClient()}>
        <OAuthClientCreate />
      </QueryClientProvider>,
      { locale: "en" },
    );
    expect(screen.getByText("Register OAuth2 client")).toBeInTheDocument();
    expect(screen.getByText("Basic information")).toBeInTheDocument();
    expect(
      screen.getByText("Users sign in through the browser."),
    ).toBeInTheDocument();
    expect(screen.getByText("Token lifetime")).toBeInTheDocument();
  });

  it("renders the rotate-secret confirmation", async () => {
    renderWithIntl(
      <QueryClientProvider client={queryClient()}>
        <OAuthClientRotateSecretDialog
          client={CLIENT}
          linkedAccountName="Nightly Invoice"
          open
          onOpenChange={vi.fn()}
        />
      </QueryClientProvider>,
      { locale: "en" },
    );
    expect(
      screen.getByText(/for the service account «Nightly Invoice» too/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Generate new secret" }),
    ).toBeEnabled();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
  });
});
