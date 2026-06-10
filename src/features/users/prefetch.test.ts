import { describe, expect, it, vi } from "vitest";

import { HttpStatusError } from "@/lib/errors";

vi.mock("@/actions/user", () => ({
  getCurrentUser: vi.fn(async () => ({ success: true, data: { id: "u1" } })),
  getCurrentUserActiveRole: vi.fn(async () => ({
    success: true,
    data: { id: "r1" },
  })),
  getCurrentUserRoles: vi.fn(async () => ({ success: true, data: [] })),
  getCurrentUserDepartments: vi.fn(async () => ({ success: true, data: [] })),
  getCurrentUserApplications: vi.fn(async () => ({
    success: true,
    data: [{ id: "1", code: "A" }],
  })),
  getCurrentUserFavoriteApplications: vi.fn(async () => ({
    success: true,
    data: [],
  })),
  getCurrentUserRecentApplications: vi.fn(async () => ({
    success: true,
    data: [],
  })),
}));

import { makeQueryClient } from "@/providers/query-client";

import { prefetchCurrentUserDashboard } from "./prefetch";

describe("prefetchCurrentUserDashboard", () => {
  it("populates the cache under the exact hook keys", async () => {
    const client = makeQueryClient();
    await prefetchCurrentUserDashboard(client);
    expect(client.getQueryData(["current-user-applications"])).toHaveLength(1);
    expect(client.getQueryData(["favorite-applications", undefined])).toEqual(
      [],
    );
    expect(client.getQueryData(["recent-applications", undefined])).toEqual([]);
  });

  it("rejects with HttpStatusError when current-user fetch fails", async () => {
    const { getCurrentUser } = await import("@/actions/user");
    vi.mocked(getCurrentUser).mockResolvedValueOnce({
      success: false,
      error: "Unauthorized",
      status: 401,
    });
    const client = makeQueryClient();
    const result = prefetchCurrentUserDashboard(client);
    await expect(result).rejects.toBeInstanceOf(HttpStatusError);
    await expect(result).rejects.toMatchObject({
      digest: "HTTP_STATUS_401|Unauthorized",
    });
  });

  it("resolves even when a secondary fetch fails", async () => {
    const { getCurrentUserActiveRole } = await import("@/actions/user");
    vi.mocked(getCurrentUserActiveRole).mockResolvedValueOnce({
      success: false,
      error: "boom",
      status: 500,
    });
    const client = makeQueryClient();
    await expect(
      prefetchCurrentUserDashboard(client),
    ).resolves.toBeUndefined();
    expect(client.getQueryData(["current-user"])).toEqual({ id: "u1" });
  });
});
