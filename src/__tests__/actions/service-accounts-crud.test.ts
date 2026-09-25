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
  it("applies a removal to the fresh server state, not the UI's copy", async () => {
    // The UI saw roleIds [1, 2]; another save has since added 3.
    serviceAccounts.getServiceAccount.mockResolvedValue({
      data: { ...sa, roleIds: [1, 2, 3] },
    });
    const r = await setServiceAccountAccess("sa1", { roles: { remove: [2] } });
    expect(serviceAccounts.updateServiceAccount).toHaveBeenCalledTimes(1);
    expect(serviceAccounts.updateServiceAccount).toHaveBeenCalledWith(
      "sa1",
      expect.objectContaining({
        roleIds: [1, 3],
        permissionIds: [9],
        applicationId: 7,
      }),
    );
    expect(r.success).toBe(true);
  });

  it("merges a picker's scope/selection into the fresh set", async () => {
    serviceAccounts.getServiceAccount.mockResolvedValue({
      data: { ...sa, roleIds: [1, 2, 3] },
    });
    await setServiceAccountAccess("sa1", {
      roles: { scope: [2, 3, 4], selected: [3, 4] },
    });
    expect(serviceAccounts.updateServiceAccount).toHaveBeenCalledWith(
      "sa1",
      expect.objectContaining({ roleIds: [1, 3, 4], permissionIds: [9] }),
    );
  });

  describe("direct-permission removal", () => {
    const held = {
      ...sa,
      permissionIds: [9, 10],
      permissionNames: ["inv.approve", "inv.export"],
    };
    beforeEach(() => {
      serviceAccounts.getServiceAccount.mockResolvedValue({ data: held });
    });
    const remove = () =>
      setServiceAccountAccess("sa1", {
        permissions: { remove: [{ id: 9, name: "inv.approve" }] },
      });

    it("succeeds when the response drops exactly that name", async () => {
      serviceAccounts.updateServiceAccount.mockResolvedValueOnce({
        data: { ...held, permissionIds: [10], permissionNames: ["inv.export"] },
      });
      const r = await remove();
      expect(serviceAccounts.updateServiceAccount).toHaveBeenCalledTimes(1);
      expect(serviceAccounts.updateServiceAccount).toHaveBeenCalledWith(
        "sa1",
        expect.objectContaining({ permissionIds: [10], roleIds: [1, 2] }),
      );
      expect(r.success).toBe(true);
    });

    it.each([
      ["still holds the removed name", ["inv.approve"]],
      ["lost another name", []],
    ])(
      "restores the previous set when the response %s",
      async (_label, names) => {
        serviceAccounts.updateServiceAccount.mockResolvedValueOnce({
          data: { ...held, permissionIds: [10], permissionNames: names },
        });
        const r = await remove();
        expect(serviceAccounts.updateServiceAccount).toHaveBeenCalledTimes(2);
        expect(serviceAccounts.updateServiceAccount).toHaveBeenLastCalledWith(
          "sa1",
          expect.objectContaining({
            permissionIds: [9, 10],
            roleIds: [1, 2],
            applicationId: 7,
          }),
        );
        expect(r).toEqual({
          success: false,
          error:
            "Não foi possível confirmar qual permissão remover. Nada foi alterado. Remova-a pelo seletor de permissões.",
        });
      },
    );

    it("does not verify picker-based changes", async () => {
      serviceAccounts.updateServiceAccount.mockResolvedValueOnce({
        data: { ...held, permissionIds: [10], permissionNames: ["x"] },
      });
      const r = await setServiceAccountAccess("sa1", {
        permissions: { scope: [9], selected: [] },
      });
      expect(serviceAccounts.updateServiceAccount).toHaveBeenCalledTimes(1);
      expect(r.success).toBe(true);
    });
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

  it("needs no new session once the OAuth client exists (its secret is at stake)", async () => {
    const { getClientAccess } = await import("@/actions/access-client");
    let callsAtCreation = -1;
    oauthClients.createOAuthClient.mockImplementation(async () => {
      callsAtCreation = vi.mocked(getClientAccess).mock.calls.length;
      return { data: { ...oauth, clientSecret: "s3cret" } };
    });
    serviceAccounts.createServiceAccount.mockResolvedValue({ data: sa });
    await createServiceAccountWithNewClient(clientInput, { name: "N" });
    expect(callsAtCreation).toBeGreaterThan(0);
    expect(vi.mocked(getClientAccess).mock.calls.length).toBe(callsAtCreation);
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
