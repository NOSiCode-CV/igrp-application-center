import { beforeEach, describe, expect, it, vi } from "vitest";

const oauthClients = {
  getOAuthClient: vi.fn(),
  createOAuthClient: vi.fn(),
  deleteOAuthClient: vi.fn(),
};
const serviceAccounts = {
  getServiceAccount: vi.fn(),
  createServiceAccount: vi.fn(),
  updateServiceAccount: vi.fn(),
  deleteServiceAccount: vi.fn(),
};
const applications = { getApplications: vi.fn() };

vi.mock("@/actions/access-client", () => ({
  getClientAccess: vi.fn(async () => ({
    oauthClients,
    serviceAccounts,
    applications,
  })),
}));
vi.mock("@/lib/auth", () => ({
  serverSession: vi.fn(async () => ({ accessToken: "t" })),
}));

import {
  createServiceAccount,
  createServiceAccountWithNewClient,
  deleteServiceAccount,
  setServiceAccountAccess,
  updateServiceAccountIdentity,
} from "@/actions/service-accounts";

const sa = {
  id: "sa1",
  name: "Nightly",
  description: "old",
  active: true,
  oauthClientId: "c1",
  clientId: "etl",
  applicationId: 99, // drifted — must be healed from the client
  roleIds: [1, 2],
  permissionIds: [9],
};
const oauth = {
  id: "c1",
  clientId: "etl",
  applicationId: 7,
  grantTypes: ["client_credentials"],
};
const clientInput = {
  clientId: "etl",
  clientName: "ETL",
  scopes: [],
  grantTypes: ["client_credentials" as const],
};

beforeEach(() => {
  vi.clearAllMocks();
  serviceAccounts.getServiceAccount.mockResolvedValue({ data: sa });
  oauthClients.getOAuthClient.mockResolvedValue({ data: oauth });
  serviceAccounts.updateServiceAccount.mockImplementation(async (_id, req) => ({
    data: { ...sa, ...req },
  }));
});

describe("createServiceAccount", () => {
  it("takes applicationId from the linked client", async () => {
    serviceAccounts.createServiceAccount.mockResolvedValue({ data: sa });
    await createServiceAccount({
      name: "N",
      oauthClientId: "c1",
      roleIds: [1],
    });
    expect(serviceAccounts.createServiceAccount).toHaveBeenCalledWith({
      name: "N",
      oauthClientId: "c1",
      roleIds: [1],
      applicationId: 7,
    });
  });
  it("reports failures", async () => {
    serviceAccounts.createServiceAccount.mockRejectedValue({
      status: 409,
      title: "Conflict",
    });
    expect(
      await createServiceAccount({ name: "N", oauthClientId: "c1" }),
    ).toMatchObject({
      success: false,
      status: 409,
    });
  });
});

describe("updateServiceAccountIdentity", () => {
  it("PUTs the fresh account with only name/description changed", async () => {
    const r = await updateServiceAccountIdentity("sa1", {
      name: "Renamed",
      description: undefined,
    });
    expect(serviceAccounts.updateServiceAccount).toHaveBeenCalledWith("sa1", {
      name: "Renamed",
      description: undefined,
      active: true,
      oauthClientId: "c1",
      applicationId: 7,
      roleIds: [1, 2],
      permissionIds: [9],
    });
    expect(r.success).toBe(true);
  });
});

describe("setServiceAccountAccess", () => {
  it("replaces only the sets it is given", async () => {
    await setServiceAccountAccess("sa1", { roleIds: [2] });
    expect(serviceAccounts.updateServiceAccount).toHaveBeenCalledWith(
      "sa1",
      expect.objectContaining({
        roleIds: [2],
        permissionIds: [9],
        applicationId: 7,
      }),
    );
  });
});

describe("createServiceAccountWithNewClient", () => {
  it("creates the client, then the account on it", async () => {
    oauthClients.createOAuthClient.mockResolvedValue({
      data: { ...oauth, clientSecret: "s3cret" },
    });
    serviceAccounts.createServiceAccount.mockResolvedValue({ data: sa });
    const r = await createServiceAccountWithNewClient(clientInput, {
      name: "N",
      roleIds: [1],
    });
    expect(serviceAccounts.createServiceAccount).toHaveBeenCalledWith({
      name: "N",
      roleIds: [1],
      oauthClientId: "c1",
      applicationId: 7,
    });
    expect(r.success && r.data.client.clientSecret).toBe("s3cret");
  });

  it("refuses a client without client_credentials", async () => {
    const r = await createServiceAccountWithNewClient(
      { ...clientInput, grantTypes: ["authorization_code"] },
      { name: "N" },
    );
    expect(r).toMatchObject({
      success: false,
      failedStep: "client",
      status: 422,
    });
    expect(oauthClients.createOAuthClient).not.toHaveBeenCalled();
  });

  it("reports a client failure with its status", async () => {
    oauthClients.createOAuthClient.mockRejectedValue({
      status: 409,
      title: "Conflict",
    });
    const r = await createServiceAccountWithNewClient(clientInput, {
      name: "N",
    });
    expect(r).toMatchObject({
      success: false,
      failedStep: "client",
      status: 409,
    });
    expect(serviceAccounts.createServiceAccount).not.toHaveBeenCalled();
  });

  it("returns the created client (with its secret) when the account step fails", async () => {
    oauthClients.createOAuthClient.mockResolvedValue({
      data: { ...oauth, clientSecret: "s3cret" },
    });
    serviceAccounts.createServiceAccount.mockRejectedValue({
      status: 500,
      title: "Boom",
    });
    const r = await createServiceAccountWithNewClient(clientInput, {
      name: "N",
    });
    expect(r).toMatchObject({
      success: false,
      failedStep: "serviceAccount",
      client: { id: "c1", clientSecret: "s3cret" },
    });
  });
});

describe("deleteServiceAccount", () => {
  it("deletes the account, then the client when asked", async () => {
    const order: string[] = [];
    serviceAccounts.deleteServiceAccount.mockImplementation(async () =>
      order.push("sa"),
    );
    oauthClients.deleteOAuthClient.mockImplementation(async () =>
      order.push("client"),
    );
    expect(
      await deleteServiceAccount("sa1", { alsoDeleteClient: true }),
    ).toEqual({
      success: true,
      data: null,
    });
    expect(order).toEqual(["sa", "client"]);
    expect(oauthClients.deleteOAuthClient).toHaveBeenCalledWith("c1");
  });

  it("leaves the client alone when not asked", async () => {
    await deleteServiceAccount("sa1", { alsoDeleteClient: false });
    expect(oauthClients.deleteOAuthClient).not.toHaveBeenCalled();
  });

  it("reports a client-step failure with the client id", async () => {
    oauthClients.deleteOAuthClient.mockRejectedValue({
      status: 500,
      title: "Boom",
    });
    const r = await deleteServiceAccount("sa1", { alsoDeleteClient: true });
    expect(r).toMatchObject({
      success: false,
      failedStep: "client",
      oauthClientId: "c1",
    });
  });

  it("reports an account-step failure", async () => {
    serviceAccounts.deleteServiceAccount.mockRejectedValue({
      status: 404,
      title: "Not found",
    });
    const r = await deleteServiceAccount("sa1", { alsoDeleteClient: true });
    expect(r).toMatchObject({
      success: false,
      failedStep: "serviceAccount",
      status: 404,
    });
    expect(oauthClients.deleteOAuthClient).not.toHaveBeenCalled();
  });
});
