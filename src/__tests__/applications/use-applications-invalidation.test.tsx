import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  applicationsKeys,
  menusKeys,
} from "@/features/applications/query-keys";
import {
  useAddRolesToMenu,
  useDeleteMenu,
  useRemoveRolesFromMenu,
  useUpdateApplication,
} from "@/features/applications/use-applications";
import {
  addRolesToMenu,
  removeRolesFromMenu,
} from "@/actions/applications";

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
  addRolesToMenu: vi.fn(async () => ({ success: true, data: {} })),
  removeRolesFromMenu: vi.fn(async () => ({ success: true, data: {} })),
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

describe("useAddRolesToMenu", () => {
  it("optimistically appends new role codes to the cache", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const key = menusKeys.roles("APP_A", "MENU_X");
    client.setQueryData(key, [{ code: "ROLE_OLD" }]);

    const { result } = renderHook(() => useAddRolesToMenu(), {
      wrapper: makeWrapper(client),
    });
    result.current.mutate({
      appCode: "APP_A",
      menuCode: "MENU_X",
      departmentCode: "DEP_1",
      roleNames: ["ROLE_NEW"],
    });

    await waitFor(() => {
      expect(client.getQueryData(key)).toEqual([
        { code: "ROLE_OLD" },
        { code: "ROLE_NEW" },
      ]);
    });
  });

  it("rolls back the cache when the mutation errors", async () => {
    vi.mocked(addRolesToMenu).mockRejectedValueOnce(new Error("boom"));
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const key = menusKeys.roles("APP_A", "MENU_X");
    const initial = [{ code: "ROLE_OLD" }];
    client.setQueryData(key, initial);

    const { result } = renderHook(() => useAddRolesToMenu(), {
      wrapper: makeWrapper(client),
    });
    await expect(
      result.current.mutateAsync({
        appCode: "APP_A",
        menuCode: "MENU_X",
        departmentCode: "DEP_1",
        roleNames: ["ROLE_NEW"],
      }),
    ).rejects.toThrow();
    expect(client.getQueryData(key)).toEqual(initial);
  });

  it("invalidates the roles key on settle", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const spy = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useAddRolesToMenu(), {
      wrapper: makeWrapper(client),
    });
    await result.current.mutateAsync({
      appCode: "APP_A",
      menuCode: "MENU_X",
      departmentCode: "DEP_1",
      roleNames: ["ROLE_NEW"],
    });
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith({
        queryKey: menusKeys.roles("APP_A", "MENU_X"),
      });
    });
  });
});

describe("useRemoveRolesFromMenu", () => {
  it("optimistically removes role codes from the cache", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const key = menusKeys.roles("APP_A", "MENU_X");
    client.setQueryData(key, [{ code: "ROLE_OLD" }, { code: "ROLE_X" }]);

    const { result } = renderHook(() => useRemoveRolesFromMenu(), {
      wrapper: makeWrapper(client),
    });
    result.current.mutate({
      appCode: "APP_A",
      menuCode: "MENU_X",
      departmentCode: "DEP_1",
      roleNames: ["ROLE_X"],
    });

    await waitFor(() => {
      expect(client.getQueryData(key)).toEqual([{ code: "ROLE_OLD" }]);
    });
  });

  it("rolls back the cache when the mutation errors", async () => {
    vi.mocked(removeRolesFromMenu).mockRejectedValueOnce(new Error("boom"));
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const key = menusKeys.roles("APP_A", "MENU_X");
    const initial = [{ code: "ROLE_OLD" }, { code: "ROLE_X" }];
    client.setQueryData(key, initial);

    const { result } = renderHook(() => useRemoveRolesFromMenu(), {
      wrapper: makeWrapper(client),
    });
    await expect(
      result.current.mutateAsync({
        appCode: "APP_A",
        menuCode: "MENU_X",
        departmentCode: "DEP_1",
        roleNames: ["ROLE_X"],
      }),
    ).rejects.toThrow();
    expect(client.getQueryData(key)).toEqual(initial);
  });

  it("invalidates the roles key on settle", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const spy = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useRemoveRolesFromMenu(), {
      wrapper: makeWrapper(client),
    });
    await result.current.mutateAsync({
      appCode: "APP_A",
      menuCode: "MENU_X",
      departmentCode: "DEP_1",
      roleNames: ["ROLE_X"],
    });
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith({
        queryKey: menusKeys.roles("APP_A", "MENU_X"),
      });
    });
  });
});
