import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the SDK accessor: getClientAccess returns an object with users.*
// The real SDK method returns { data: T }, so mocks must resolve to { data: ... }.
const mockGetUsers = vi.fn();

vi.mock("@/actions/access-client", () => ({
  getClientAccess: vi.fn(async () => ({
    users: {
      getUsers: mockGetUsers,
    },
  })),
}));

// serverSession is consumed inside access-client; mock it there to avoid
// the redirect() call in getClientAccess.
vi.mock("@/lib/auth", () => ({
  serverSession: vi.fn(async () => ({ accessToken: "test-token" })),
}));

import { getUsers } from "@/actions/user";

beforeEach(() => vi.clearAllMocks());

describe("getUsers action", () => {
  it("returns { success: true, data } on a resolved SDK call", async () => {
    const users = [{ id: "user-1", username: "alice" }];
    mockGetUsers.mockResolvedValue({ data: users });

    const result = await getUsers();

    expect(result).toEqual({ success: true, data: users });
    expect(mockGetUsers).toHaveBeenCalledWith(undefined);
  });

  it("forwards params to the SDK call", async () => {
    const users = [{ id: "user-2", username: "bob" }];
    mockGetUsers.mockResolvedValue({ data: users });

    const result = await getUsers({ name: "bob" });

    expect(result).toEqual({ success: true, data: users });
    expect(mockGetUsers).toHaveBeenCalledWith({ name: "bob" });
  });

  it("maps an SDK error with no title to a default status message", async () => {
    mockGetUsers.mockRejectedValue({ status: 401 });

    const result = await getUsers();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.status).toBe(401);
      expect(result.error).toBe("Não autorizado");
    }
  });
});
