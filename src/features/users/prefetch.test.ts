import { describe, expect, it, vi } from "vitest";

vi.mock("@/actions/user", () => ({
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
});
