import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the SDK accessor: getClientAccess returns an object with applications.*
// The real SDK method returns { data: T }, so mocks must resolve to { data: ... }.
const mockGetApplications = vi.fn();
const mockUpdateApplication = vi.fn();

vi.mock("@/actions/access-client", () => ({
  getClientAccess: vi.fn(async () => ({
    applications: {
      getApplications: mockGetApplications,
      updateApplication: mockUpdateApplication,
    },
  })),
}));

// serverSession is consumed inside access-client; mock it there to avoid
// the redirect() call in getClientAccess.
vi.mock("@/lib/auth", () => ({
  serverSession: vi.fn(async () => ({ accessToken: "test-token" })),
}));

import { getApplications, updateApplication } from "@/actions/applications";

beforeEach(() => vi.clearAllMocks());

describe("getApplications action", () => {
  it("returns { success: true, data } on a resolved SDK call", async () => {
    const apps = [{ code: "APP1", name: "App One" }];
    mockGetApplications.mockResolvedValue({ data: apps });

    const result = await getApplications();

    expect(result).toEqual({ success: true, data: apps });
    expect(mockGetApplications).toHaveBeenCalledWith(undefined);
  });

  it("forwards filters to the SDK call", async () => {
    const apps = [{ code: "APP2", name: "App Two" }];
    mockGetApplications.mockResolvedValue({ data: apps });

    const result = await getApplications({ code: "APP2" });

    expect(result).toEqual({ success: true, data: apps });
    expect(mockGetApplications).toHaveBeenCalledWith({ code: "APP2" });
  });

  it("maps an SDK error with title to { success: false, error, status }", async () => {
    mockGetApplications.mockRejectedValue({
      status: 403,
      title: "Acesso negado",
    });

    const result = await getApplications();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.status).toBe(403);
      expect(result.error).toBe("Acesso negado");
    }
  });

  it("falls back to the per-status default message when no title/details", async () => {
    mockGetApplications.mockRejectedValue({ status: 404 });

    const result = await getApplications();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.status).toBe(404);
      expect(result.error).toBe("Recurso não encontrado");
    }
  });

  it("returns Erro desconhecido when error has no status or title", async () => {
    mockGetApplications.mockRejectedValue({});

    const result = await getApplications();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.status).toBeUndefined();
      expect(result.error).toBe("Erro desconhecido");
    }
  });
});

describe("updateApplication action", () => {
  it("returns { success: true, data } on a resolved SDK call", async () => {
    const updated = { code: "APP1", name: "Updated App" };
    mockUpdateApplication.mockResolvedValue({ data: updated });

    const result = await updateApplication("APP1", { name: "Updated App" });

    expect(result).toEqual({ success: true, data: updated });
    expect(mockUpdateApplication).toHaveBeenCalledWith("APP1", {
      name: "Updated App",
    });
  });

  it("maps a 409 conflict error to { success: false, error, status }", async () => {
    mockUpdateApplication.mockRejectedValue({ status: 409 });

    const result = await updateApplication("APP1", { name: "Dup" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.status).toBe(409);
      expect(result.error).toBe("Conflito de dados");
    }
  });
});
