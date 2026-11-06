import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetRoleByCode = vi.fn();
const mockGetRoleById = vi.fn();

vi.mock("@/actions/access-client", () => ({
  getClientAccess: vi.fn(async () => ({
    roles: {
      getRoleByCode: mockGetRoleByCode,
      getRoleById: mockGetRoleById,
    },
  })),
}));

vi.mock("@/lib/auth", () => ({
  serverSession: vi.fn(async () => ({ accessToken: "test-token" })),
}));

import { getRoleByCode, getRoleById } from "@/actions/roles";

const forged = "x\r\n[user-update] forged entry";

beforeEach(() => vi.clearAllMocks());

describe("roles actions log injection", () => {
  it("getRoleByCode does not write CR/LF from the role code raw to the log", async () => {
    mockGetRoleByCode.mockRejectedValue({ status: 404 });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await getRoleByCode(forged);

    expect(result.success).toBe(false);
    expect(mockGetRoleByCode).toHaveBeenCalledWith(forged);
    const message = spy.mock.calls[0][0] as string;
    expect(message).not.toMatch(/[\r\n]/);
    expect(message).toContain(JSON.stringify(forged));
    spy.mockRestore();
  });

  it("getRoleById does not write CR/LF from the id raw to the log", async () => {
    mockGetRoleById.mockRejectedValue({ status: 404 });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await getRoleById(forged as unknown as number);

    expect(result.success).toBe(false);
    const message = spy.mock.calls[0][0] as string;
    expect(message).not.toMatch(/[\r\n]/);
    spy.mockRestore();
  });
});
