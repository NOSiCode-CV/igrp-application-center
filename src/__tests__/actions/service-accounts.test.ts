import { beforeEach, describe, expect, it, vi } from "vitest";

const calls: string[] = [];
const oauthClients = { getOAuthClient: vi.fn(), updateOAuthClient: vi.fn() };
const serviceAccounts = {
  listServiceAccounts: vi.fn(),
  getServiceAccount: vi.fn(),
  updateServiceAccount: vi.fn(),
};

vi.mock("@/actions/access-client", () => ({
  getClientAccess: vi.fn(async () => ({ oauthClients, serviceAccounts })),
}));
vi.mock("@/lib/auth", () => ({
  serverSession: vi.fn(async () => ({ accessToken: "t" })),
}));

import {
  listServiceAccounts,
  setServiceAccountActive,
} from "@/actions/service-accounts";

const sa = {
  id: "sa1",
  name: "Nightly",
  active: true,
  oauthClientId: "c1",
  clientId: "etl",
  roleIds: [1],
  permissionIds: [2],
  applicationId: 3,
};
const client = {
  id: "c1",
  clientId: "etl",
  clientName: "ETL",
  active: true,
  applicationId: 7,
  accessTokenTtl: 1,
  refreshTokenTtl: 1,
  authorizationCodeTtl: 1,
  scopes: [],
  redirectUris: [],
  grantTypes: ["client_credentials"],
};

beforeEach(() => {
  vi.clearAllMocks();
  calls.length = 0;
  serviceAccounts.getServiceAccount.mockResolvedValue({ data: sa });
  oauthClients.getOAuthClient.mockResolvedValue({ data: client });
  oauthClients.updateOAuthClient.mockImplementation(async () => {
    calls.push("client");
    return { data: client };
  });
  serviceAccounts.updateServiceAccount.mockImplementation(async () => {
    calls.push("serviceAccount");
    return { data: sa };
  });
});

describe("listServiceAccounts", () => {
  it("returns the list", async () => {
    serviceAccounts.listServiceAccounts.mockResolvedValue({ data: [sa] });
    expect(await listServiceAccounts()).toEqual({ success: true, data: [sa] });
  });
});

describe("setServiceAccountActive", () => {
  it("deactivates the client first, then the service account", async () => {
    expect(await setServiceAccountActive("sa1", false)).toEqual({
      success: true,
      data: null,
    });
    expect(calls).toEqual(["client", "serviceAccount"]);
    expect(oauthClients.updateOAuthClient).toHaveBeenCalledWith(
      "c1",
      expect.objectContaining({ active: false }),
    );
    expect(serviceAccounts.updateServiceAccount).toHaveBeenCalledWith(
      "sa1",
      expect.objectContaining({
        active: false,
        roleIds: [1],
        permissionIds: [2],
      }),
    );
  });

  it("sends the client's application as the service account's (spec §1)", async () => {
    await setServiceAccountActive("sa1", false);
    expect(serviceAccounts.updateServiceAccount).toHaveBeenCalledWith(
      "sa1",
      expect.objectContaining({ applicationId: 7 }),
    );
  });

  it("reactivates the service account first, then the client", async () => {
    await setServiceAccountActive("sa1", true);
    expect(calls).toEqual(["serviceAccount", "client"]);
  });

  it("reports which step failed and stops", async () => {
    oauthClients.updateOAuthClient.mockRejectedValue({
      status: 500,
      title: "Boom",
    });
    const r = await setServiceAccountActive("sa1", false);
    expect(r).toMatchObject({
      success: false,
      failedStep: "client",
      status: 500,
    });
    expect(serviceAccounts.updateServiceAccount).not.toHaveBeenCalled();
  });

  it("reports a failure on the second step", async () => {
    serviceAccounts.updateServiceAccount.mockRejectedValue({
      status: 500,
      title: "Boom",
    });
    const r = await setServiceAccountActive("sa1", false);
    expect(r).toMatchObject({ success: false, failedStep: "serviceAccount" });
    expect(calls).toEqual(["client"]);
  });
});
