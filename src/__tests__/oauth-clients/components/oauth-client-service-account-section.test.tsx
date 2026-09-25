import type { ReactNode } from "react";

import { Form } from "@igrp/igrp-framework-react-design-system";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";

import { serviceAccountKeys } from "@/features/service-accounts/query-keys";

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
vi.mock("@/actions/oauth-clients", () => ({
  listOAuthClients: vi.fn(),
  getOAuthClient: vi.fn(),
  createOAuthClient: vi.fn(),
  updateOAuthClient: vi.fn(),
  deleteOAuthClient: vi.fn(),
  setOAuthClientActive: vi.fn(),
}));

import { OAuthClientServiceAccountSection } from "@/features/oauth-clients/components/oauth-client-service-account-section";

function Harness({
  grantTypes,
  saved,
}: {
  grantTypes: string[];
  saved: boolean;
}) {
  const form = useForm({ defaultValues: { grantTypes } });
  return (
    <Form {...form}>
      <OAuthClientServiceAccountSection
        clientId="c1"
        savedWithClientCredentials={saved}
      />
    </Form>
  );
}

function renderSection(
  accounts: unknown[],
  grantTypes = ["client_credentials"],
  saved = true,
) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Number.POSITIVE_INFINITY },
    },
  });
  qc.setQueryData(serviceAccountKeys.list(), accounts);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  render(<Harness grantTypes={grantTypes} saved={saved} />, { wrapper });
}

describe("OAuthClientServiceAccountSection", () => {
  it("links the linked account", () => {
    renderSection([
      {
        id: "sa1",
        name: "Nightly",
        oauthClientId: "c1",
        active: true,
        roleIds: [1],
        permissionIds: [],
      },
    ]);
    expect(screen.getByRole("link", { name: "Nightly" })).toHaveAttribute(
      "href",
      "/settings/accounts/services/sa1",
    );
    expect(screen.getByText("1 perfil · 0 diretas")).toBeInTheDocument();
  });

  it("offers to create one when none is linked", () => {
    renderSection([]);
    expect(
      screen.getByRole("link", {
        name: "Criar conta de serviço para este cliente",
      }),
    ).toHaveAttribute(
      "href",
      "/settings/accounts/services/new?oauthClientId=c1",
    );
  });

  it("asks to save first when client_credentials is not saved yet", () => {
    renderSection([], ["client_credentials"], false);
    expect(screen.getByText(/Guarde as alterações/)).toBeInTheDocument();
  });

  it("is hidden without client_credentials", () => {
    renderSection([], ["authorization_code"]);
    expect(screen.queryByText("Conta de serviço")).not.toBeInTheDocument();
  });
});
