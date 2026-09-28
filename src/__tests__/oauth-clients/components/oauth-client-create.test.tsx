import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createOAuthClient } from "@/actions/oauth-clients";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

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

import { OAuthClientCreate } from "@/features/oauth-clients/components/oauth-client-create";

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  render(<OAuthClientCreate />, { wrapper });
}

async function fillValidWebClient() {
  await userEvent.type(screen.getByLabelText(/^Client ID/), "my-invoice");
  await userEvent.type(screen.getByLabelText(/^Nome/), "Invoice App");
  await userEvent.type(
    screen.getByLabelText(/URIs de redirecionamento/),
    "https://a.gov.cv/cb{Enter}",
  );
}

describe("OAuthClientCreate", () => {
  beforeEach(() => push.mockReset());

  it("hides redirect URIs when authorization_code is unticked", async () => {
    renderPage();
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
    renderPage();
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
    renderPage();
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
    await userEvent.click(done);
    expect(push).toHaveBeenCalledWith("/settings/accounts/clients/u1");
  });

  it("warns before unloading until the secret is confirmed", async () => {
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
    renderPage();
    await fillValidWebClient();
    await userEvent.click(screen.getByRole("button", { name: "Registar" }));
    await screen.findByText("Este segredo não volta a ser mostrado.");

    const unload = () => {
      const event = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    };
    expect(unload()).toBe(true);
    await userEvent.click(
      screen.getByRole("checkbox", {
        name: "Guardei o segredo num local seguro",
      }),
    );
    await waitFor(() => expect(unload()).toBe(false));
  });

  it("cancels straight to the list while only the defaults are set", async () => {
    renderPage();
    const cancel = screen.getByRole("link", { name: "Cancelar" });
    expect(cancel).toHaveAttribute("href", "/settings/accounts/clients");
    cancel.addEventListener("click", (e) => e.preventDefault()); // no router in jsdom
    await userEvent.click(cancel);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("asks before cancelling once a field is filled", async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText(/^Nome/), "Invoice App");
    await userEvent.click(screen.getByRole("link", { name: "Cancelar" }));

    const dialog = await screen.findByRole("alertdialog", {
      name: "Sair sem registar o cliente?",
    });
    expect(dialog).toHaveTextContent(
      "Os dados que preencheu ainda não foram guardados. Se sair agora, vai perdê-los.",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Continuar a preencher" }),
    );
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/^Nome/)).toHaveValue("Invoice App");
    expect(push).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("link", { name: "Cancelar" }));
    await userEvent.click(
      await screen.findByRole("button", { name: "Sair e descartar" }),
    );
    expect(push).toHaveBeenCalledWith("/settings/accounts/clients");
  });

  it("cannot be cancelled while the registration is in flight", async () => {
    vi.mocked(createOAuthClient).mockReturnValueOnce(new Promise(() => {}));
    renderPage();
    await fillValidWebClient();
    await userEvent.click(screen.getByRole("button", { name: "Registar" }));
    expect(
      await screen.findByRole("button", { name: "A registar…" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    expect(
      screen.queryByRole("link", { name: "Cancelar" }),
    ).not.toBeInTheDocument();
  });

  it("says so when the server returns no secret, and still leads to the details", async () => {
    vi.mocked(createOAuthClient).mockResolvedValueOnce({
      success: true,
      data: {
        id: "u1",
        clientId: "my-invoice",
        active: true,
        accessTokenTtl: 1,
        refreshTokenTtl: 1,
        authorizationCodeTtl: 1,
        scopes: [],
        redirectUris: [],
        grantTypes: [],
      },
    });
    renderPage();
    await fillValidWebClient();
    await userEvent.click(screen.getByRole("button", { name: "Registar" }));

    expect(
      await screen.findByText(
        "O servidor não devolveu o segredo. Gere um novo nos detalhes do cliente.",
      ),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Ver detalhes" }));
    expect(push).toHaveBeenCalledWith("/settings/accounts/clients/u1");
  });

  it("links the grant-type error to the group", async () => {
    renderPage();
    await userEvent.click(
      screen.getByRole("checkbox", { name: /authorization_code/ }),
    );
    await userEvent.click(
      screen.getByRole("checkbox", { name: /refresh_token/ }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Registar" }));

    const message = await screen.findByText(
      "Escolha pelo menos um grant type.",
    );
    const group = screen.getByRole("group", { name: "Grant types" });
    expect(group).toHaveAttribute("aria-invalid", "true");
    expect(group.getAttribute("aria-describedby")).toContain(message.id);
  });

  it("scope defaults follow the grant selection while untouched", async () => {
    renderPage();
    expect(
      screen.getByRole("button", { name: "Remover openid" }),
    ).toBeInTheDocument();

    // Machine-only client: the web defaults no longer apply.
    await userEvent.click(
      screen.getByRole("checkbox", { name: /client_credentials/ }),
    );
    await userEvent.click(
      screen.getByRole("checkbox", { name: /authorization_code/ }),
    );
    await userEvent.click(
      screen.getByRole("checkbox", { name: /refresh_token/ }),
    );
    expect(
      screen.queryByRole("button", { name: "Remover openid" }),
    ).not.toBeInTheDocument();

    // authorization_code back on with no scopes: restore the defaults.
    await userEvent.click(
      screen.getByRole("checkbox", { name: /authorization_code/ }),
    );
    for (const scope of ["openid", "email", "profile"]) {
      expect(
        screen.getByRole("button", { name: `Remover ${scope}` }),
      ).toBeInTheDocument();
    }
  });

  it("leaves scopes the admin edited alone", async () => {
    renderPage();
    await userEvent.click(
      screen.getByRole("button", { name: "Remover profile" }),
    );
    await userEvent.click(
      screen.getByRole("checkbox", { name: /client_credentials/ }),
    );
    await userEvent.click(
      screen.getByRole("checkbox", { name: /authorization_code/ }),
    );
    await userEvent.click(
      screen.getByRole("checkbox", { name: /refresh_token/ }),
    );
    expect(
      screen.getByRole("button", { name: "Remover openid" }),
    ).toBeInTheDocument();
  });

  it("marks the redirect URIs field invalid when none is provided", async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText(/^Client ID/), "my-invoice");
    await userEvent.type(screen.getByLabelText(/^Nome/), "Invoice App");
    await userEvent.click(screen.getByRole("button", { name: "Registar" }));

    const message = await screen.findByText(
      "Adicione pelo menos um URI de redirecionamento.",
    );
    const redirectInput = screen.getByLabelText(/URIs de redirecionamento/);
    expect(redirectInput).toHaveAttribute("aria-invalid", "true");
    expect(redirectInput.getAttribute("aria-describedby")).toContain(
      message.id,
    );
  });
});
