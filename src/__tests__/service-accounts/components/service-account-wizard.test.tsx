import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { createServiceAccount } from "@/actions/service-accounts";
import { oauthClientKeys } from "@/features/oauth-clients/query-keys";
import { serviceAccountKeys } from "@/features/service-accounts/query-keys";

// Radix Select needs pointer-event polyfills jsdom doesn't implement.
beforeAll(() => {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.scrollIntoView = vi.fn();
});

const toast = vi.fn();
vi.mock("@igrp/igrp-framework-react-design-system", async (orig) => ({
  ...(await orig<typeof import("@igrp/igrp-framework-react-design-system")>()),
  useIGRPToast: () => ({ igrpToast: toast }),
}));
const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
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
  createServiceAccount: vi.fn(async () => ({
    success: true,
    data: { id: "sa-new" },
  })),
  createServiceAccountWithNewClient: vi.fn(),
  updateServiceAccountIdentity: vi.fn(),
  setServiceAccountAccess: vi.fn(),
  deleteServiceAccount: vi.fn(),
  setServiceAccountActive: vi.fn(),
}));
vi.mock("@/actions/roles", () => ({
  getRoleById: vi.fn(),
  getRoleByCode: vi.fn(),
}));
const APPS = { data: [{ id: 7, code: "INV", name: "Faturação" }] };
vi.mock("@/features/applications/use-applications", () => ({
  useApplications: () => APPS,
}));
const DEPTS = { data: [], isLoading: false, error: null };
const EMPTY = { data: [], isLoading: false, isError: false };
vi.mock("@/features/departments/use-departments", () => ({
  useDepartments: () => DEPTS,
  useRoles: () => EMPTY,
  useDepartmentPermissions: () => EMPTY,
}));

import { ServiceAccountWizard } from "@/features/service-accounts/components/wizard/service-account-wizard";

const clients = [
  {
    id: "c1",
    clientId: "etl-runner-m2m",
    clientName: "ETL",
    applicationCode: "INV",
    active: true,
    grantTypes: ["client_credentials"],
  },
  { id: "c2", clientId: "taken", grantTypes: ["client_credentials"] },
  {
    id: "c3",
    clientId: "legacy-m2m",
    active: false,
    grantTypes: ["client_credentials"],
  },
];

function renderWizard(initialOAuthClientId?: string) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Number.POSITIVE_INFINITY },
    },
  });
  qc.setQueryData(oauthClientKeys.list(), clients);
  qc.setQueryData(serviceAccountKeys.list(), [
    { id: "x", oauthClientId: "c2" },
  ]);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  render(<ServiceAccountWizard initialOAuthClientId={initialOAuthClientId} />, {
    wrapper,
  });
}

beforeEach(() => vi.clearAllMocks());

describe("ServiceAccountWizard — existing client", () => {
  it("walks the three steps and creates the account", async () => {
    renderWizard();
    expect(
      screen.getByText("Nada é criado até confirmar no último passo."),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("combobox"));
    expect(
      screen.queryByRole("option", { name: /taken/ }),
    ).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("option", { name: /etl-runner-m2m/ }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(screen.getByText("Faturação")).toBeInTheDocument(); // inherited application, by name
    await userEvent.type(
      screen.getByLabelText("Nome *"),
      "Nightly Invoice ETL",
    );
    await userEvent.click(screen.getByRole("button", { name: "Continuar" }));

    await userEvent.click(screen.getByRole("button", { name: "Criar conta" }));
    await waitFor(() =>
      expect(createServiceAccount).toHaveBeenCalledWith({
        oauthClientId: "c1",
        name: "Nightly Invoice ETL",
        description: undefined,
        active: true,
        roleIds: [],
        permissionIds: [],
      }),
    );
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/settings/accounts/services/sa-new"),
    );
  });

  it("jumps to step 2 from a deep link and links back to step 1", async () => {
    renderWizard("c1");
    expect(screen.getByLabelText("Nome *")).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: /Cliente OAuth.*ETL/ }),
    );
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("keeps what was typed in Identidade after Voltar", async () => {
    renderWizard("c1");
    await userEvent.type(screen.getByLabelText("Nome *"), "Nightly");
    await userEvent.click(screen.getByRole("button", { name: "Voltar" }));
    expect(screen.getByRole("combobox")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(screen.getByLabelText("Nome *")).toHaveValue("Nightly");
  });

  it("keeps roles and the identity when going back from step 3", async () => {
    renderWizard("c1");
    await userEvent.type(screen.getByLabelText("Nome *"), "Nightly");
    await userEvent.click(screen.getByRole("button", { name: "Continuar" }));
    await userEvent.click(screen.getByRole("button", { name: "Voltar" }));
    expect(screen.getByLabelText("Nome *")).toHaveValue("Nightly");
  });

  it("follows an inactive existing client instead of offering a choice", async () => {
    renderWizard("c3");
    expect(
      screen.queryByRole("checkbox", { name: "Ativa na criação" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Estado: segue o cliente OAuth (Inativo)."),
    ).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Nome *"), "Legacy");
    await userEvent.click(screen.getByRole("button", { name: "Continuar" }));
    await userEvent.click(screen.getByRole("button", { name: "Criar conta" }));
    await waitFor(() =>
      expect(createServiceAccount).toHaveBeenCalledWith(
        expect.objectContaining({ oauthClientId: "c3", active: false }),
      ),
    );
  });

  it("toasts when the create call throws", async () => {
    vi.mocked(createServiceAccount).mockRejectedValueOnce(
      new Error("Rede indisponível"),
    );
    renderWizard("c1");
    await userEvent.type(screen.getByLabelText("Nome *"), "Nightly");
    await userEvent.click(screen.getByRole("button", { name: "Continuar" }));
    await userEvent.click(screen.getByRole("button", { name: "Criar conta" }));
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith({
        type: "error",
        title: "Não foi possível criar a conta",
        description: "Rede indisponível",
      }),
    );
    expect(push).not.toHaveBeenCalled();
  });

  it("explains a 409 as the client already having an account", async () => {
    vi.mocked(createServiceAccount).mockResolvedValueOnce({
      success: false,
      status: 409,
      error: "Conflict",
    });
    renderWizard("c1");
    await userEvent.type(screen.getByLabelText("Nome *"), "Nightly");
    await userEvent.click(screen.getByRole("button", { name: "Continuar" }));
    await userEvent.click(screen.getByRole("button", { name: "Criar conta" }));
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith({
        type: "error",
        title: "Não foi possível criar a conta",
        description:
          "Este cliente OAuth já tem uma conta de serviço. Escolha outro cliente no passo 1.",
      }),
    );
    expect(push).not.toHaveBeenCalled();
  });

  it("warns when a deep-linked client is not available", () => {
    renderWizard("c2");
    expect(
      screen.getByText(/Este cliente não pode receber uma conta de serviço/),
    ).toBeInTheDocument();
  });
});

describe("ServiceAccountWizard — Cancelar", () => {
  const cancel = () => screen.getByRole("link", { name: "Cancelar" });

  it("leaves straight away while only the defaults are set", async () => {
    renderWizard("c1"); // a deep-linked client is a default, not input
    cancel().addEventListener("click", (e) => e.preventDefault()); // no router in jsdom
    await userEvent.click(cancel());
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("asks before leaving with a client picked but not confirmed", async () => {
    renderWizard();
    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(
      screen.getByRole("option", { name: /etl-runner-m2m/ }),
    );
    await userEvent.click(cancel());

    const dialog = await screen.findByRole("alertdialog", {
      name: "Sair sem criar a conta?",
    });
    expect(dialog).toHaveTextContent(
      "Os dados que preencheu ainda não foram guardados. Se sair agora, vai perdê-los.",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Continuar a preencher" }),
    );
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("asks before leaving with a name typed on step 2, and leaves on confirm", async () => {
    renderWizard("c1");
    await userEvent.type(screen.getByLabelText("Nome *"), "Nightly");
    await userEvent.click(cancel());
    await userEvent.click(
      await screen.findByRole("button", { name: "Sair e descartar" }),
    );
    expect(push).toHaveBeenCalledWith("/settings/accounts/services");
  });
});
