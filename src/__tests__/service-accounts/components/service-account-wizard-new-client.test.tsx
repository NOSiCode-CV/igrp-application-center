import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createServiceAccount,
  createServiceAccountWithNewClient,
} from "@/actions/service-accounts";
import { oauthClientKeys } from "@/features/oauth-clients/query-keys";
import { serviceAccountKeys } from "@/features/service-accounts/query-keys";

// Radix Select needs pointer-event polyfills jsdom doesn't implement.
beforeAll(() => {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.scrollIntoView = vi.fn();
});

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
    grantTypes: ["client_credentials"],
  },
  { id: "c2", clientId: "taken", grantTypes: ["client_credentials"] },
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

async function fillNewClientAndIdentity() {
  renderWizard();
  await userEvent.click(
    screen.getByRole("radio", { name: "Registar um novo cliente OAuth" }),
  );
  await userEvent.type(screen.getByLabelText(/Client ID/), "nightly-etl-m2m");
  await userEvent.type(screen.getByLabelText("Nome *"), "Nightly ETL client");
  await userEvent.click(screen.getByRole("button", { name: "Continuar" }));
  await userEvent.type(screen.getByLabelText("Nome *"), "Nightly Invoice ETL");
  await userEvent.click(screen.getByRole("button", { name: "Continuar" }));
}

describe("ServiceAccountWizard — new client", () => {
  it("locks grant types to client_credentials", async () => {
    renderWizard();
    await userEvent.click(
      screen.getByRole("radio", { name: "Registar um novo cliente OAuth" }),
    );
    expect(
      screen.getByText("Fixo para contas de serviço."),
    ).toBeInTheDocument();
    expect(screen.queryByText("authorization_code")).not.toBeInTheDocument();
  });

  it("creates both, then shows the secret once before going to the account", async () => {
    vi.mocked(createServiceAccountWithNewClient).mockResolvedValueOnce({
      success: true,
      data: {
        client: {
          id: "c9",
          clientId: "nightly-etl-m2m",
          clientSecret: "s3cret",
        } as never,
        account: { id: "sa9", name: "Nightly Invoice ETL" } as never,
      },
    });
    await fillNewClientAndIdentity();
    expect(
      screen.getByText(/O segredo do novo cliente é mostrado uma única vez/),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Criar conta" }));
    const done = await screen.findByRole("button", {
      name: "Concluir — ver conta",
    });
    expect(done).toBeDisabled();
    await userEvent.click(
      screen.getByRole("checkbox", { name: /Guardei o segredo/ }),
    );
    await userEvent.click(done);
    expect(push).toHaveBeenCalledWith("/settings/accounts/services/sa9");
  });

  it("removes the header Cancelar link and warns once a client has been registered", async () => {
    vi.mocked(createServiceAccountWithNewClient).mockResolvedValueOnce({
      success: true,
      data: {
        client: {
          id: "c9",
          clientId: "nightly-etl-m2m",
          clientSecret: "s3cret",
        } as never,
        account: { id: "sa9", name: "Nightly Invoice ETL" } as never,
      },
    });
    await fillNewClientAndIdentity();
    expect(screen.getByRole("link", { name: /Cancelar/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Criar conta" }));
    await screen.findByRole("button", { name: "Concluir — ver conta" });
    expect(
      screen.queryByRole("link", { name: /Cancelar/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "O cliente OAuth já foi registado. Guarde o segredo antes de sair desta página.",
      ),
    ).toBeInTheDocument();
  });

  it("still shows the secret when the account step fails, and retries on that client", async () => {
    vi.mocked(createServiceAccountWithNewClient).mockResolvedValueOnce({
      success: false,
      failedStep: "serviceAccount",
      error: "Boom",
      client: {
        id: "c9",
        clientId: "nightly-etl-m2m",
        clientSecret: "s3cret",
      } as never,
    });
    vi.mocked(createServiceAccount).mockResolvedValueOnce({
      success: true,
      data: { id: "sa9" } as never,
    });
    await fillNewClientAndIdentity();
    await userEvent.click(screen.getByRole("button", { name: "Criar conta" }));
    expect(await screen.findByLabelText("Client secret")).toHaveValue("s3cret");
    expect(
      screen.getByText(/A conta de serviço não foi criada/),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Tentar criar a conta novamente" }),
    );
    await waitFor(() =>
      expect(createServiceAccount).toHaveBeenCalledWith(
        expect.objectContaining({
          oauthClientId: "c9",
          name: "Nightly Invoice ETL",
        }),
      ),
    );
    expect(
      await screen.findByRole("button", { name: "Concluir — ver conta" }),
    ).toBeInTheDocument();
  });

  it("sends a duplicate client ID back to step 1 with a field error", async () => {
    vi.mocked(createServiceAccountWithNewClient).mockResolvedValueOnce({
      success: false,
      failedStep: "client",
      status: 409,
      error: "Conflict",
    });
    await fillNewClientAndIdentity();
    await userEvent.click(screen.getByRole("button", { name: "Criar conta" }));
    expect(
      await screen.findByText("Já existe um cliente com este client ID."),
    ).toBeInTheDocument();
  });
});
