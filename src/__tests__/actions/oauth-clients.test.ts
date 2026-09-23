import { beforeEach, describe, expect, it, vi } from "vitest";

const oauthClients = {
  listOAuthClients: vi.fn(),
  getOAuthClient: vi.fn(),
  createOAuthClient: vi.fn(),
  updateOAuthClient: vi.fn(),
  deleteOAuthClient: vi.fn(),
};

const applications = {
  getApplications: vi.fn(async ({ code }: { code: string }) => ({
    data: code === "INV" ? [{ id: 7, code: "INV", name: "Faturação" }] : [],
  })),
};

vi.mock("@/actions/access-client", () => ({
  getClientAccess: vi.fn(async () => ({ oauthClients, applications })),
}));
vi.mock("@/lib/auth", () => ({
  serverSession: vi.fn(async () => ({ accessToken: "t" })),
}));

import {
  createOAuthClient,
  deleteOAuthClient,
  listOAuthClients,
  setOAuthClientActive,
  updateOAuthClient,
} from "@/actions/oauth-clients";

const dto = {
  id: "u1",
  clientId: "my-invoice",
  clientName: "Invoice",
  active: true,
  accessTokenTtl: 180,
  refreshTokenTtl: 86400,
  authorizationCodeTtl: 60,
  scopes: [],
  redirectUris: [],
  grantTypes: ["client_credentials"],
};

beforeEach(() => vi.clearAllMocks());

describe("oauth-client actions", () => {
  it("lists clients", async () => {
    oauthClients.listOAuthClients.mockResolvedValue({ data: [dto] });
    expect(await listOAuthClients()).toEqual({ success: true, data: [dto] });
  });

  it("returns the secret from create", async () => {
    oauthClients.createOAuthClient.mockResolvedValue({
      data: { ...dto, clientSecret: "s3cret" },
    });
    const r = await createOAuthClient({
      clientId: "my-invoice",
      clientName: "Invoice",
      scopes: [],
      grantTypes: ["client_credentials"],
    });
    expect(r.success && r.data.clientSecret).toBe("s3cret");
  });

  it("resolves applicationCode to the SDK's applicationId", async () => {
    oauthClients.createOAuthClient.mockResolvedValue({ data: dto });
    await createOAuthClient({
      clientId: "my-invoice",
      clientName: "Invoice",
      scopes: [],
      grantTypes: ["client_credentials"],
      applicationCode: "INV",
    });
    const sent = oauthClients.createOAuthClient.mock.calls[0][0];
    expect(sent.applicationId).toBe(7);
    expect("applicationCode" in sent).toBe(false);
  });

  it("rejects an unknown applicationCode before calling the SDK", async () => {
    const r = await createOAuthClient({
      clientId: "my-invoice",
      clientName: "Invoice",
      scopes: [],
      grantTypes: ["client_credentials"],
      applicationCode: "NOPE",
    });
    expect(r).toEqual({
      success: false,
      status: 422,
      error: "A aplicação «NOPE» não existe.",
    });
    expect(oauthClients.createOAuthClient).not.toHaveBeenCalled();
  });

  it("sends no applicationId when no application is chosen", async () => {
    oauthClients.createOAuthClient.mockResolvedValue({ data: dto });
    await createOAuthClient({
      clientId: "x",
      clientName: "x",
      scopes: [],
      grantTypes: ["client_credentials"],
    });
    expect(
      oauthClients.createOAuthClient.mock.calls[0][0].applicationId,
    ).toBeUndefined();
    expect(applications.getApplications).not.toHaveBeenCalled();
  });

  it("surfaces a 409 status on duplicate clientId", async () => {
    oauthClients.createOAuthClient.mockRejectedValue({
      status: 409,
      title: "Conflict",
    });
    const r = await createOAuthClient({
      clientId: "dup",
      clientName: "x",
      scopes: [],
      grantTypes: ["client_credentials"],
    });
    expect(r).toMatchObject({ success: false, status: 409 });
  });

  it("strips a secret from update responses", async () => {
    oauthClients.updateOAuthClient.mockResolvedValue({
      data: { ...dto, clientSecret: "leak" },
    });
    const r = await updateOAuthClient("u1", {
      clientId: "my-invoice",
      clientName: "Invoice",
      scopes: [],
      grantTypes: ["client_credentials"],
    });
    expect(r.success && "clientSecret" in r.data).toBe(false);
  });

  it("deletes and returns null", async () => {
    oauthClients.deleteOAuthClient.mockResolvedValue({ data: undefined });
    expect(await deleteOAuthClient("u1")).toEqual({
      success: true,
      data: null,
    });
  });

  it("toggles active with a full PUT built from the current client", async () => {
    oauthClients.getOAuthClient.mockResolvedValue({ data: dto });
    oauthClients.updateOAuthClient.mockResolvedValue({
      data: { ...dto, active: false },
    });

    const r = await setOAuthClientActive("u1", false);

    expect(oauthClients.updateOAuthClient).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({
        clientId: "my-invoice",
        active: false,
        grantTypes: ["client_credentials"],
      }),
    );
    expect(r).toMatchObject({ success: true, data: { active: false } });
  });
});
