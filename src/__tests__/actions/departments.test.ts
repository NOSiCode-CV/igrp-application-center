import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the SDK accessor: getClientAccess returns an object with departments.*
// The real SDK method returns { data: T }, so mocks must resolve to { data: ... }.
const mockGetDepartments = vi.fn();

vi.mock("@/actions/access-client", () => ({
  getClientAccess: vi.fn(async () => ({
    departments: {
      getDepartments: mockGetDepartments,
    },
  })),
}));

// serverSession is consumed inside access-client; mock it there to avoid
// the redirect() call in getClientAccess.
vi.mock("@/lib/auth", () => ({
  serverSession: vi.fn(async () => ({ accessToken: "test-token" })),
}));

import { getDepartments } from "@/actions/departments";

beforeEach(() => vi.clearAllMocks());

describe("getDepartments action", () => {
  it("returns { success: true, data } on a resolved SDK call", async () => {
    const departments = [{ code: "DEP1", name: "Department One" }];
    mockGetDepartments.mockResolvedValue({ data: departments });

    const result = await getDepartments();

    expect(result).toEqual({ success: true, data: departments });
    expect(mockGetDepartments).toHaveBeenCalledOnce();
  });

  it("maps an SDK error with no title to a default status message", async () => {
    mockGetDepartments.mockRejectedValue({ status: 403 });

    const result = await getDepartments();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.status).toBe(403);
      expect(result.error).toBe("Acesso negado");
    }
  });
});
