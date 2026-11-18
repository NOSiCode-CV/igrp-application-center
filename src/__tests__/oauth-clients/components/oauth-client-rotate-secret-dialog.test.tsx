import type { ReactNode } from "react";

import type { OAuthClientDTO } from "@igrp/platform-access-management-client-ts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { rotateOAuthClientSecret } from "@/actions/oauth-clients";

vi.mock("@/actions/oauth-clients", () => ({
  rotateOAuthClientSecret: vi.fn(),
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

import { OAuthClientRotateSecretDialog } from "@/features/oauth-clients/components/oauth-client-rotate-secret-dialog";

const CLIENT: OAuthClientDTO = {
  id: "u1",
  clientId: "my-invoice",
  active: true,
  accessTokenTtl: 1,
  refreshTokenTtl: 1,
  authorizationCodeTtl: 1,
  scopes: [],
  redirectUris: [],
  grantTypes: ["client_credentials"],
};

function renderDialog(linkedAccountName?: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  const onOpenChange = vi.fn();
  render(
    <OAuthClientRotateSecretDialog
      client={CLIENT}
      linkedAccountName={linkedAccountName}
      open
      onOpenChange={onOpenChange}
    />,
    { wrapper },
  );
  return { onOpenChange };
}

const confirmButton = () =>
  screen.getByRole("button", { name: /Gerar novo segredo/ });

describe("OAuthClientRotateSecretDialog", () => {
  beforeEach(() => vi.mocked(rotateOAuthClientSecret).mockReset());

  it("asks first, naming the linked service account", () => {
    renderDialog("Faturação batch");
    expect(
      screen.getByText(/também para a conta de serviço «Faturação batch»/),
    ).toBeInTheDocument();
    expect(rotateOAuthClientSecret).not.toHaveBeenCalled();
  });

  it("shows the new secret once, with Concluir disabled until confirmed", async () => {
    vi.mocked(rotateOAuthClientSecret).mockResolvedValueOnce({
      success: true,
      data: { ...CLIENT, clientSecret: "n3w" },
    });
    renderDialog();
    await userEvent.click(confirmButton());

    expect(
      await screen.findByText("Este segredo não volta a ser mostrado."),
    ).toBeInTheDocument();
    expect(rotateOAuthClientSecret).toHaveBeenCalledWith("u1");
    const done = screen.getByRole("button", { name: "Concluir" });
    expect(done).toBeDisabled();
    await userEvent.click(
      screen.getByRole("checkbox", {
        name: "Guardei o segredo num local seguro",
      }),
    );
    await waitFor(() => expect(done).toBeEnabled());
  });

  it("asks before closing an unconfirmed secret", async () => {
    vi.mocked(rotateOAuthClientSecret).mockResolvedValueOnce({
      success: true,
      data: { ...CLIENT, clientSecret: "n3w" },
    });
    const { onOpenChange } = renderDialog();
    await userEvent.click(confirmButton());
    await screen.findByText("Este segredo não volta a ser mostrado.");

    await userEvent.keyboard("{Escape}");

    expect(
      await screen.findByText("Fechar sem confirmar?"),
    ).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("says so when the server returns no secret", async () => {
    vi.mocked(rotateOAuthClientSecret).mockResolvedValueOnce({
      success: true,
      data: CLIENT,
    });
    renderDialog();
    await userEvent.click(confirmButton());
    expect(
      await screen.findByText(/O servidor não devolveu o novo segredo/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fechar" })).toBeEnabled();
  });

  it("stays on the confirmation when the rotation fails", async () => {
    vi.mocked(rotateOAuthClientSecret).mockResolvedValueOnce({
      success: false,
      error: "Not found",
      status: 404,
    });
    const { onOpenChange } = renderDialog();
    await userEvent.click(confirmButton());
    await waitFor(() => expect(rotateOAuthClientSecret).toHaveBeenCalled());
    expect(confirmButton()).toBeInTheDocument();
    expect(
      screen.queryByText("Este segredo não volta a ser mostrado."),
    ).not.toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});
