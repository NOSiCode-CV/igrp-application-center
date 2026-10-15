import type { ReactNode } from "react";

import type { ServiceAccountDTO } from "@igrp/platform-access-management-client-ts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  deleteServiceAccount,
  setServiceAccountActive,
} from "@/actions/service-accounts";

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
  deleteServiceAccount: vi.fn(async () => ({ success: true, data: null })),
  setServiceAccountActive: vi.fn(async () => ({ success: true, data: null })),
}));

import { ServiceAccountActivationDialog } from "@/features/service-accounts/components/service-account-activation-dialog";
import { ServiceAccountDeleteDialog } from "@/features/service-accounts/components/service-account-delete-dialog";

const account = {
  id: "sa1",
  name: "Nightly ETL",
  active: true,
  oauthClientId: "c1",
  clientId: "etl-runner-m2m",
} as ServiceAccountDTO;

function wrap(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

beforeEach(() => vi.clearAllMocks());

describe("ServiceAccountDeleteDialog", () => {
  it("deletes the client too by default, and the label follows the checkbox", async () => {
    const onDeleted = vi.fn();
    wrap(
      <ServiceAccountDeleteDialog
        account={account}
        open
        onOpenChange={() => {}}
        onDeleted={onDeleted}
      />,
    );
    expect(
      screen.getByRole("checkbox", { name: /Eliminar também o cliente OAuth/ }),
    ).toBeChecked();
    await userEvent.type(screen.getByLabelText(/Nome da conta/), "Nightly ETL");
    await userEvent.click(
      screen.getByRole("button", { name: /Eliminar conta e cliente/ }),
    );
    await waitFor(() =>
      expect(deleteServiceAccount).toHaveBeenCalledWith("sa1", {
        alsoDeleteClient: true,
      }),
    );
    await waitFor(() => expect(onDeleted).toHaveBeenCalled());
  });

  it("keeps the client when unticked", async () => {
    wrap(
      <ServiceAccountDeleteDialog
        account={account}
        open
        onOpenChange={() => {}}
      />,
    );
    await userEvent.click(
      screen.getByRole("checkbox", { name: /Eliminar também o cliente OAuth/ }),
    );
    await userEvent.type(screen.getByLabelText(/Nome da conta/), "Nightly ETL");
    await userEvent.click(
      screen.getByRole("button", { name: /^Eliminar conta$/ }),
    );
    await waitFor(() =>
      expect(deleteServiceAccount).toHaveBeenCalledWith("sa1", {
        alsoDeleteClient: false,
      }),
    );
  });
});

describe("ServiceAccountActivationDialog", () => {
  it("names the client that is also deactivated", async () => {
    wrap(
      <ServiceAccountActivationDialog
        account={account}
        open
        onOpenChange={() => {}}
      />,
    );
    expect(screen.getByText(/etl-runner-m2m/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Desativar" }));
    await waitFor(() =>
      expect(setServiceAccountActive).toHaveBeenCalledWith("sa1", false),
    );
  });
});
