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

describe("ServiceAccountWizard — existing client", () => {
  it("walks the three steps and creates the account", async () => {
    renderWizard();
    expect(
      screen.getByText("Nada é criado até confirmar no último passo."),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("combobox", { name: "Cliente OAuth" }),
    );
    expect(
      screen.queryByRole("option", { name: /taken/ }),
    ).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("option", { name: /etl-runner-m2m/ }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(screen.getByText("INV — Faturação")).toBeInTheDocument(); // inherited application
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
    expect(
      screen.getByRole("combobox", { name: "Cliente OAuth" }),
    ).toBeInTheDocument();
  });

  it("warns when a deep-linked client is not available", () => {
    renderWizard("c2");
    expect(
      screen.getByText(/Este cliente não pode receber uma conta de serviço/),
    ).toBeInTheDocument();
  });
});
