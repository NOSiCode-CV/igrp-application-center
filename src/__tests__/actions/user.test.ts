import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the SDK accessor: getClientAccess returns an object with users.*
// The real SDK method returns { data: T }, so mocks must resolve to { data: ... }.
const mockGetUsers = vi.fn();
const mockGetCurrentUser = vi.fn();
const mockGetUser = vi.fn();
const mockUpdateUser = vi.fn();

vi.mock("@/actions/access-client", () => ({
  getClientAccess: vi.fn(async () => ({
    users: {
      getUsers: mockGetUsers,
      getCurrentUser: mockGetCurrentUser,
      getUser: mockGetUser,
      updateUser: mockUpdateUser,
    },
  })),
}));

// serverSession is consumed inside access-client; mock it there to avoid
// the redirect() call in getClientAccess.
vi.mock("@/lib/auth", () => ({
  serverSession: vi.fn(async () => ({ accessToken: "test-token" })),
}));

import { getUsers, updateUser } from "@/actions/user";

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

describe("updateUser action", () => {
  const stored = { id: "u2", name: "Old", phoneNumber: "+2389911111", nic: "" };

  it("applies the patch to a fresh read, keeping fields it did not touch", async () => {
    mockGetCurrentUser.mockResolvedValue({ data: { id: "admin" } });
    mockGetUser.mockResolvedValue({ data: stored });
    mockUpdateUser.mockResolvedValue({ data: { ...stored, name: "New" } });

    const result = await updateUser("u2", { name: "New" });

    expect(result.success).toBe(true);
    expect(mockUpdateUser).toHaveBeenCalledWith("u2", {
      ...stored,
      name: "New",
      nic: null,
    });
  });

  it("reads your own record through /me, without the admin read", async () => {
    mockGetCurrentUser.mockResolvedValue({ data: stored });
    mockUpdateUser.mockResolvedValue({ data: stored });

    await updateUser("u2", { picture: "p.png" });

    expect(mockGetUser).not.toHaveBeenCalled();
    expect(mockUpdateUser).toHaveBeenCalledWith(
      "u2",
      expect.objectContaining({ picture: "p.png", phoneNumber: "+2389911111" }),
    );
  });
});
