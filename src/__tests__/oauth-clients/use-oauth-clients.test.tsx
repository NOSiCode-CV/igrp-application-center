import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  deleteOAuthClient,
  setOAuthClientActive,
} from "@/actions/oauth-clients";
import { setServiceAccountActive } from "@/actions/service-accounts";
import { oauthClientKeys } from "@/features/oauth-clients/query-keys";
import {
  useCreateOAuthClient,
  useDeleteOAuthClient,
  useSetClientActive,
  useUpdateOAuthClient,
} from "@/features/oauth-clients/use-oauth-clients";
import { serviceAccountKeys } from "@/features/service-accounts/query-keys";

vi.mock("@/actions/oauth-clients", () => ({
  listOAuthClients: vi.fn(),
  getOAuthClient: vi.fn(),
  createOAuthClient: vi.fn(async () => ({
    success: true,
    data: { id: "new", clientId: "x", clientSecret: "s3cret" },
  })),
  updateOAuthClient: vi.fn(async () => ({ success: true, data: { id: "u1" } })),
  deleteOAuthClient: vi.fn(async () => ({ success: true, data: null })),
  setOAuthClientActive: vi.fn(async () => ({
    success: true,
    data: { id: "u1" },
  })),
}));
vi.mock("@/actions/service-accounts", () => ({
  listServiceAccounts: vi.fn(),
  setServiceAccountActive: vi.fn(async () => ({ success: true, data: null })),
}));

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, invalidate, wrapper };
}

const req = {
  clientId: "x",
  clientName: "x",
  scopes: [],
  grantTypes: ["client_credentials"],
};

describe("useCreateOAuthClient", () => {
  it("invalidates the list and never writes the secret into the cache", async () => {
    const { client, invalidate, wrapper } = setup();
    const { result } = renderHook(() => useCreateOAuthClient(), { wrapper });

    const r = await result.current.mutateAsync(req);

    expect(r.success && r.data.clientSecret).toBe("s3cret");
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: oauthClientKeys.all,
      }),
    );
    const cached = JSON.stringify(
      client
        .getQueryCache()
        .getAll()
        .map((q) => q.state.data),
    );
    expect(cached).not.toContain("s3cret");
  });

  it("drops the secret from the mutation cache once the hook unmounts", async () => {
    const { client, wrapper } = setup();
    const { result, unmount } = renderHook(() => useCreateOAuthClient(), {
      wrapper,
    });
    await result.current.mutateAsync(req);
    unmount();
    await new Promise((r) => setTimeout(r, 0));
    const inMutations = JSON.stringify(
      client
        .getMutationCache()
        .getAll()
        .map((m) => m.state.data),
    );
    expect(inMutations).not.toContain("s3cret");
  });
});

describe("useUpdateOAuthClient / useDeleteOAuthClient", () => {
  it("update invalidates the family", async () => {
    const { invalidate, wrapper } = setup();
    const { result } = renderHook(() => useUpdateOAuthClient(), { wrapper });
    await result.current.mutateAsync({ id: "u1", request: req });
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: oauthClientKeys.all,
      }),
    );
  });

  it("delete drops the deleted detail and invalidates the list and service accounts", async () => {
    const { client, invalidate, wrapper } = setup();
    const remove = vi.spyOn(client, "removeQueries");
    const { result } = renderHook(() => useDeleteOAuthClient(), { wrapper });
    await result.current.mutateAsync("u1");
    await waitFor(() => {
      expect(remove).toHaveBeenCalledWith({
        queryKey: oauthClientKeys.detail("u1"),
      });
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: oauthClientKeys.list(),
      });
      expect(invalidate).not.toHaveBeenCalledWith({
        queryKey: oauthClientKeys.all,
      });
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: serviceAccountKeys.all,
      });
    });
  });

  it("delete refreshes the service-account link on a 409 and keeps the detail", async () => {
    vi.mocked(deleteOAuthClient).mockResolvedValueOnce({
      success: false,
      status: 409,
      error: "Conflict",
    });
    const { client, invalidate, wrapper } = setup();
    const remove = vi.spyOn(client, "removeQueries");
    const { result } = renderHook(() => useDeleteOAuthClient(), { wrapper });
    await result.current.mutateAsync("u1");
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: serviceAccountKeys.all,
      }),
    );
    expect(remove).not.toHaveBeenCalled();
  });
});

describe("useSetClientActive", () => {
  const oauth = { id: "u1" } as never;

  it("uses the single-client action when nothing is linked", async () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useSetClientActive(), { wrapper });
    await result.current.mutateAsync({ client: oauth, active: false });
    expect(setOAuthClientActive).toHaveBeenCalledWith("u1", false);
    expect(setServiceAccountActive).not.toHaveBeenCalled();
  });

  it("uses the combined action when a service account is linked", async () => {
    const { invalidate, wrapper } = setup();
    const { result } = renderHook(() => useSetClientActive(), { wrapper });
    await result.current.mutateAsync({
      client: oauth,
      linkedAccountId: "sa1",
      active: false,
    });
    expect(setServiceAccountActive).toHaveBeenCalledWith("sa1", false);
    await waitFor(() => {
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: oauthClientKeys.all,
      });
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: serviceAccountKeys.all,
      });
    });
  });
});
