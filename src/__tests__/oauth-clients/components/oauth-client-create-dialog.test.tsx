import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { createOAuthClient } from "@/actions/oauth-clients";

vi.mock("@/actions/oauth-clients", () => ({
  createOAuthClient: vi.fn(),
  listOAuthClients: vi.fn(),
  getOAuthClient: vi.fn(),
  updateOAuthClient: vi.fn(),
  deleteOAuthClient: vi.fn(),
  setOAuthClientActive: vi.fn(),
}));
vi.mock("@/actions/service-accounts", () => ({
  listServiceAccounts: vi.fn(),
  setServiceAccountActive: vi.fn(),
}));
const APPS = { data: [{ id: 7, code: "INV", name: "Faturação" }] };
vi.mock("@/features/applications/use-applications", () => ({
  useApplications: () => APPS,
}));

import { OAuthClientCreateDialog } from "@/features/oauth-clients/components/oauth-client-create-dialog";

function renderDialog() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  render(<OAuthClientCreateDialog open onOpenChange={vi.fn()} />, { wrapper });
}

async function fillValidWebClient() {
  await userEvent.type(screen.getByLabelText(/^Client ID/), "my-invoice");
  await userEvent.type(screen.getByLabelText(/^Nome/), "Invoice App");
  await userEvent.type(
    screen.getByLabelText(/URIs de redirecionamento/),
    "https://a.gov.cv/cb{Enter}",
  );
}

describe("OAuthClientCreateDialog", () => {
  it("hides redirect URIs when authorization_code is unticked", async () => {
    renderDialog();
    expect(
      screen.getByLabelText(/URIs de redirecionamento/),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("checkbox", { name: /authorization_code/ }),
    );
    expect(
      screen.queryByLabelText(/URIs de redirecionamento/),
    ).not.toBeInTheDocument();
  });

  it("puts a 409 on the clientId field", async () => {
    vi.mocked(createOAuthClient).mockResolvedValueOnce({
      success: false,
      error: "Conflict",
      status: 409,
    });
    renderDialog();
    await fillValidWebClient();
    await userEvent.click(screen.getByRole("button", { name: "Registar" }));
    expect(
      await screen.findByText("Já existe um cliente com este client ID."),
    ).toBeInTheDocument();
  });

  it("shows the secret once, with Concluir disabled until confirmed", async () => {
    vi.mocked(createOAuthClient).mockResolvedValueOnce({
      success: true,
      data: {
        id: "u1",
        clientId: "my-invoice",
        clientSecret: "s3cret",
        active: true,
        accessTokenTtl: 1,
        refreshTokenTtl: 1,
        authorizationCodeTtl: 1,
        scopes: [],
        redirectUris: [],
        grantTypes: [],
      },
    });
    renderDialog();
    await fillValidWebClient();
    await userEvent.click(screen.getByRole("button", { name: "Registar" }));

    expect(
      await screen.findByText("Este segredo não volta a ser mostrado."),
    ).toBeInTheDocument();
    const done = screen.getByRole("button", { name: /Concluir/ });
    expect(done).toBeDisabled();
    await userEvent.click(
      screen.getByRole("checkbox", {
        name: "Guardei o segredo num local seguro",
      }),
    );
    await waitFor(() => expect(done).toBeEnabled());
  });
});
