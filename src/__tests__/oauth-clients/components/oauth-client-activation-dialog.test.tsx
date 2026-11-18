import type { ReactNode } from "react";

import type { OAuthClientDTO } from "@igrp/platform-access-management-client-ts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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
  setServiceAccountActive: vi.fn(),
}));

import { OAuthClientActivationDialog } from "@/features/oauth-clients/components/oauth-client-activation-dialog";

const client = {
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
} as OAuthClientDTO;

describe("OAuthClientActivationDialog", () => {
  it("keeps the intent fixed at open, even if a refetch flips the client (retry after partial failure)", () => {
    const qc = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );
    const { rerender } = render(
      <OAuthClientActivationDialog
        client={client}
        open
        onOpenChange={vi.fn()}
      />,
      { wrapper },
    );
    expect(
      screen.getByRole("button", { name: "Desativar" }),
    ).toBeInTheDocument();

    // The first step of a combined deactivation went through; the refetch now
    // reports the client as inactive while the dialog is still open.
    rerender(
      <OAuthClientActivationDialog
        client={{ ...client, active: false }}
        open
        onOpenChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Desativar" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Ativar" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Desativar cliente")).toBeInTheDocument();
  });
});
