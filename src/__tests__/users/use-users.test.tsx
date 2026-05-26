import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useUsers } from "@/features/users/use-users";
import * as actions from "@/actions/user";

vi.mock("@/actions/user", () => ({
  getUsers: vi.fn(),
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
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
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
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
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
