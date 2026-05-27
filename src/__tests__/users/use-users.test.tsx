import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as actions from "@/actions/user";
import { useUpdateUserStatus, useUsers } from "@/features/users/use-users";

vi.mock("@/actions/user", () => ({
  getUsers: vi.fn(),
  updateUserStatus: vi.fn(),
}));
vi.mock("@/actions/user-audit", () => ({
  getUserAuditLogs: vi.fn(),
}));
vi.mock("@/actions/user-sessions", () => ({
  getUserSession: vi.fn(),
  killUserSession: vi.fn(),
}));

function wrapperWith(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

describe("useUsers", () => {
  beforeEach(() => {
    vi.mocked(actions.getUsers).mockResolvedValue({
      success: true,
      data: [],
    } as Awaited<ReturnType<typeof actions.getUsers>>);
  });

  it("caches separately for different params", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = wrapperWith(client);

    const a = renderHook(() => useUsers({ status: "ACTIVE" }), { wrapper });
    const b = renderHook(() => useUsers({ status: "INACTIVE" }), { wrapper });

    await waitFor(() => {
      expect(a.result.current.isSuccess).toBe(true);
      expect(b.result.current.isSuccess).toBe(true);
    });

    expect(actions.getUsers).toHaveBeenCalledTimes(2);
    expect(actions.getUsers).toHaveBeenNthCalledWith(1, { status: "ACTIVE" });
    expect(actions.getUsers).toHaveBeenNthCalledWith(2, { status: "INACTIVE" });
  });
});

describe("useUpdateUserStatus", () => {
  it("invalidates both users list and individual user queries", async () => {
    vi.mocked(actions.updateUserStatus).mockResolvedValue({
      success: true,
      data: { id: "u1", status: "INACTIVE" },
    } as Awaited<ReturnType<typeof actions.updateUserStatus>>);

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const spy = vi.spyOn(client, "invalidateQueries");
    const wrapper = wrapperWith(client);

    const { result } = renderHook(() => useUpdateUserStatus(), { wrapper });
    await result.current.mutateAsync({ id: "u1", value: "INACTIVE" });

    expect(spy).toHaveBeenCalledWith({ queryKey: ["users"] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ["user", "u1"] });
  });
});
