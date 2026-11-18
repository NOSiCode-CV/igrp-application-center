import type { ServiceAccountDTO } from "@igrp/platform-access-management-client-ts";
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
vi.mock("@/actions/roles", () => ({
  getRoleById: vi.fn(),
  getRoleByCode: vi.fn(),
}));
// Built once: unstable mocked query data makes vitest run out of memory.
const APPS = { data: [{ id: 7, code: "INV", name: "Invoicing" }] };
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
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import { oauthClientKeys } from "@/features/oauth-clients/query-keys";
import { ServiceAccountDeleteDialog } from "@/features/service-accounts/components/service-account-delete-dialog";
import { ServiceAccountList } from "@/features/service-accounts/components/service-account-list";
import { ServiceAccountWizard } from "@/features/service-accounts/components/wizard/service-account-wizard";
import { serviceAccountKeys } from "@/features/service-accounts/query-keys";

import { renderWithIntl } from "../helpers/intl";

const ACCOUNT: ServiceAccountDTO = {
  id: "sa1",
  name: "Nightly Invoice",
  active: true,
  oauthClientId: "c1",
  clientId: "etl-runner-m2m",
  applicationCode: "INV",
  roleIds: [1, 2],
  roleCodes: ["INV.reader", "INV.exporter"],
  permissionIds: [9, 10, 11],
  permissionNames: ["a", "b", "c"],
};
const CLIENT = {
  id: "c1",
  clientId: "etl-runner-m2m",
  clientName: "ETL",
  active: true,
  grantTypes: ["client_credentials"],
};

function queryClient() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Number.POSITIVE_INFINITY },
    },
  });
  qc.setQueryData(serviceAccountKeys.list(), [ACCOUNT]);
  qc.setQueryData(oauthClientKeys.list(), [CLIENT]);
  return qc;
}

afterEach(cleanup);

describe("service-accounts in English", () => {
  it("renders the list", () => {
    renderWithIntl(
      <QueryClientProvider client={queryClient()}>
        <ServiceAccountList />
      </QueryClientProvider>,
      { locale: "en" },
    );
    expect(screen.getByText("New service account")).toBeInTheDocument();
    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(screen.getByText("Access")).toBeInTheDocument();
    expect(screen.getByText("2 roles · 3 direct")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Actions for Nightly Invoice" }),
    ).toBeInTheDocument();
  });

  it("renders the delete dialog", () => {
    renderWithIntl(
      <QueryClientProvider client={queryClient()}>
        <ServiceAccountDeleteDialog
          account={ACCOUNT}
          open
          onOpenChange={vi.fn()}
        />
      </QueryClientProvider>,
      { locale: "en" },
    );
    expect(
      screen.getByText(/Also delete the OAuth client/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Delete account and client" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("renders the wizard", async () => {
    renderWithIntl(
      <QueryClientProvider client={queryClient()}>
        <ServiceAccountWizard />
      </QueryClientProvider>,
      { locale: "en" },
    );
    expect(
      screen.getByText(
        "Nothing is created until you confirm in the last step.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Roles and permissions")).toBeInTheDocument();
    expect(screen.getByText("Register a new OAuth client")).toBeInTheDocument();
    await userEvent.click(screen.getByText("Register a new OAuth client"));
    expect(screen.getByText("Basic information")).toBeInTheDocument();
  });
});
