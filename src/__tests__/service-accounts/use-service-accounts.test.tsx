import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getRoleById } from "@/actions/roles";
import { deleteServiceAccount } from "@/actions/service-accounts";
import { oauthClientKeys } from "@/features/oauth-clients/query-keys";
import { serviceAccountKeys } from "@/features/service-accounts/query-keys";
import { useRoleDetails } from "@/features/service-accounts/use-role-details";
import {
  useAvailableOAuthClients,
  useCreateServiceAccountWithNewClient,
  useDeleteServiceAccount,
  useSetServiceAccountAccess,
} from "@/features/service-accounts/use-service-accounts";

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
  createServiceAccountWithNewClient: vi.fn(async () => ({
    success: false,
    failedStep: "serviceAccount",
    error: "Boom",
    client: { id: "c9", clientSecret: "s3cret" },
  })),
  updateServiceAccountIdentity: vi.fn(),
  setServiceAccountAccess: vi.fn(async () => ({ success: true, data: {} })),
  deleteServiceAccount: vi.fn(async () => ({ success: true, data: null })),
  setServiceAccountActive: vi.fn(),
}));
vi.mock("@/actions/roles", () => ({
  getRoleById: vi.fn(async (id: number) => ({
    success: true,
    data: { id, code: `r${id}`, departmentCode: "D", permissions: [] },
  })),
  getRoleByCode: vi.fn(),
}));

function setup() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Number.POSITIVE_INFINITY },
    },
  });
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, invalidate, wrapper };
}

beforeEach(() => vi.clearAllMocks());

describe("useAvailableOAuthClients", () => {
  it("filters to unlinked client_credentials clients", () => {
    const { client, wrapper } = setup();
    client.setQueryData(oauthClientKeys.list(), [
      { id: "a", grantTypes: ["client_credentials"] },
      { id: "b", grantTypes: ["client_credentials"] },
    ]);
    client.setQueryData(serviceAccountKeys.list(), [
      { id: "s", oauthClientId: "b" },
    ]);
    const { result } = renderHook(() => useAvailableOAuthClients(), {
      wrapper,
    });
    expect(result.current.data.map((c) => c.id)).toEqual(["a"]);
  });
});

describe("useCreateServiceAccountWithNewClient", () => {
  it("returns the secret on partial failure but never caches it", async () => {
    const { client, invalidate, wrapper } = setup();
    const { result } = renderHook(
      () => useCreateServiceAccountWithNewClient(),
      { wrapper },
    );
    const r = await result.current.mutateAsync({
      client: {
        clientId: "x",
        clientName: "x",
        scopes: [],
        grantTypes: ["client_credentials"],
      },
      account: { name: "N" },
    });
    expect(
      !r.success && r.failedStep === "serviceAccount" && r.client.clientSecret,
    ).toBe("s3cret");
    await waitFor(() => {
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: serviceAccountKeys.all,
      });
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: oauthClientKeys.all,
      });
    });
    const cached = JSON.stringify(
      client
        .getQueryCache()
        .getAll()
        .map((q) => q.state.data),
    );
    expect(cached).not.toContain("s3cret");
  });
});

describe("useSetServiceAccountAccess", () => {
  it("invalidates the service-account family", async () => {
    const { invalidate, wrapper } = setup();
    const { result } = renderHook(() => useSetServiceAccountAccess(), {
      wrapper,
    });
    await result.current.mutateAsync({ id: "sa1", access: { roleIds: [1] } });
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: serviceAccountKeys.all,
      }),
    );
  });
});

describe("useDeleteServiceAccount", () => {
  it("drops the detail and refreshes both lists", async () => {
    const { client, invalidate, wrapper } = setup();
    client.setQueryData(serviceAccountKeys.detail("sa1"), { id: "sa1" });
    const { result } = renderHook(() => useDeleteServiceAccount(), { wrapper });
    await result.current.mutateAsync({ id: "sa1", alsoDeleteClient: true });
    expect(deleteServiceAccount).toHaveBeenCalledWith("sa1", {
      alsoDeleteClient: true,
    });
    expect(
      client.getQueryData(serviceAccountKeys.detail("sa1")),
    ).toBeUndefined();
    await waitFor(() => {
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: serviceAccountKeys.list(),
      });
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: oauthClientKeys.all,
      });
    });
  });
});

describe("useRoleDetails", () => {
  it("fetches each role and keeps a stable result", async () => {
    const { wrapper } = setup();
    const { result, rerender } = renderHook(() => useRoleDetails([1, 2]), {
      wrapper,
    });
    await waitFor(() => expect(result.current.roles).toHaveLength(2));
    expect(getRoleById).toHaveBeenCalledTimes(2);
    const first = result.current.roles;
    rerender();
    expect(result.current.roles).toBe(first);
  });
});
