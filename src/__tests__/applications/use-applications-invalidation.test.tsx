import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  applicationsKeys,
  menusKeys,
} from "@/features/applications/query-keys";
import {
  useDeleteMenu,
  useUpdateApplication,
} from "@/features/applications/use-applications";

vi.mock("@/actions/applications", () => ({
  updateApplication: vi.fn(async () => ({
    success: true,
    data: { code: "APP_A", name: "A" },
  })),
  deleteMenu: vi.fn(async () => ({ success: true, data: { code: "MENU_X" } })),
  createApplication: vi.fn(),
  createMenu: vi.fn(),
  updateMenu: vi.fn(),
  getApplications: vi.fn(),
  getApplicationByCode: vi.fn(),
  getMenus: vi.fn(),
  addRolesToMenu: vi.fn(),
  removeRolesFromMenu: vi.fn(),
}));

function makeWrapper(client: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe("useUpdateApplication", () => {
  it("invalidates list and detail keys on success", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const spy = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useUpdateApplication(), {
      wrapper: makeWrapper(client),
    });

    await result.current.mutateAsync({
      code: "APP_A",
      data: { name: "A renamed" },
    });

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith({ queryKey: applicationsKeys.all });
      expect(spy).toHaveBeenCalledWith({
        queryKey: applicationsKeys.detail("APP_A"),
      });
    });
  });
});

describe("useDeleteMenu", () => {
  it("invalidates the menus-by-application key, not a dangling prefix", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const spy = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useDeleteMenu(), {
      wrapper: makeWrapper(client),
    });

    await result.current.mutateAsync({ appCode: "APP_A", menuCode: "MENU_X" });

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith({
        queryKey: menusKeys.byApplication("APP_A"),
      });
    });
  });
});
