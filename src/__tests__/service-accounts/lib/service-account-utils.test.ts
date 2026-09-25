import type {
  OAuthClientDTO,
  RoleDTO,
  ServiceAccountDTO,
} from "@igrp/platform-access-management-client-ts";
import { describe, expect, it } from "vitest";

import {
  computeEffectivePermissions,
  formatAccessSummary,
  getAvailableOAuthClients,
  groupRolesByDepartment,
  mergeScopedSelection,
  pairDirectPermissions,
  permissionIdsOf,
  permissionNamesOf,
  roleIdsOf,
} from "@/features/service-accounts/lib/service-account-utils";

const client = (id: string, grantTypes: string[]) =>
  ({ id, clientId: id, grantTypes }) as OAuthClientDTO;
const account = (oauthClientId: string) =>
  ({ id: `sa-${oauthClientId}`, oauthClientId }) as ServiceAccountDTO;

describe("getAvailableOAuthClients", () => {
  it("keeps client_credentials clients with no linked account", () => {
    const clients = [
      client("a", ["client_credentials"]),
      client("b", ["client_credentials"]),
      client("c", ["authorization_code"]),
    ];
    expect(
      getAvailableOAuthClients(clients, [account("b")]).map((c) => c.id),
    ).toEqual(["a"]);
  });
  it("handles missing data", () => {
    expect(getAvailableOAuthClients(undefined, undefined)).toEqual([]);
  });
});

describe("formatAccessSummary", () => {
  it.each([
    [0, 0, "0 perfis · 0 diretas"],
    [1, 1, "1 perfil · 1 direta"],
    [2, 3, "2 perfis · 3 diretas"],
  ])("formats %i roles and %i direct", (r, d, text) =>
    expect(formatAccessSummary(r, d)).toBe(text),
  );
});

describe("computeEffectivePermissions", () => {
  it("unions role and direct permissions, marking sources", () => {
    const r = computeEffectivePermissions(
      [
        { code: "reader", permissions: ["inv.read", "inv.list"] },
        { code: "exporter", permissions: ["inv.read", "inv.export"] },
      ],
      ["inv.approve", "inv.read"],
    );
    expect(r).toMatchObject({ fromRoles: 3, direct: 2, total: 4 });
    expect(r.items).toEqual([
      { name: "inv.approve", roleCodes: [], direct: true },
      { name: "inv.export", roleCodes: ["exporter"], direct: false },
      { name: "inv.list", roleCodes: ["reader"], direct: false },
      { name: "inv.read", roleCodes: ["reader", "exporter"], direct: true },
    ]);
  });
  it("tolerates roles without a permissions list", () => {
    const r = computeEffectivePermissions([{ code: "x" } as RoleDTO], []);
    expect(r.total).toBe(0);
  });
});

describe("mergeScopedSelection", () => {
  it("replaces only the items inside the scope", () => {
    expect(mergeScopedSelection([1, 2, 10], [1, 2, 3], [2, 3])).toEqual([
      10, 2, 3,
    ]);
  });
  it("never duplicates", () => {
    expect(mergeScopedSelection([5], [1], [1, 1, 5])).toEqual([5, 1]);
  });
  it("uses a key for objects", () => {
    const merged = mergeScopedSelection(
      [{ id: 1 }, { id: 9 }],
      [{ id: 1 }, { id: 2 }],
      [{ id: 2 }],
      (i) => i.id,
    );
    expect(merged.map((i) => i.id)).toEqual([9, 2]);
  });
});

describe("pairDirectPermissions", () => {
  it("uses the backend's permissions pairs over the flat sets", () => {
    expect(
      pairDirectPermissions({
        permissions: [
          { id: 7, name: "b" },
          { id: 4, name: "a" },
        ],
        // Flat sets in a different order must be ignored.
        permissionIds: [4, 7],
        permissionNames: ["b", "a"],
      }),
    ).toEqual({
      reliable: true,
      items: [
        { id: 7, name: "b" },
        { id: 4, name: "a" },
      ],
    });
  });

  it("pairs by position when both lists line up", () => {
    expect(
      pairDirectPermissions({
        permissionIds: [4, 7],
        permissionNames: ["a", "b"],
      }),
    ).toEqual({
      reliable: true,
      items: [
        { id: 4, name: "a" },
        { id: 7, name: "b" },
      ],
    });
  });
  it("falls back to names without ids when lengths differ", () => {
    expect(
      pairDirectPermissions({
        permissionIds: [4],
        permissionNames: ["a", "b"],
      }),
    ).toEqual({
      reliable: false,
      items: [
        { id: null, name: "a" },
        { id: null, name: "b" },
      ],
    });
  });
  it("handles missing lists", () => {
    expect(pairDirectPermissions({})).toEqual({ reliable: true, items: [] });
  });
});

describe("access accessors", () => {
  const legacy = {
    roleIds: [9, 4],
    permissionIds: [7],
    permissionNames: ["legacy.name"],
  };

  it("prefer the roles / permissions pairs over the flat sets", () => {
    const sa = {
      ...legacy,
      roles: [{ id: 3, code: "ADMIN", departmentCode: "RH" }],
      permissions: [{ id: 12, name: "igrp.client.list" }],
    };
    expect(roleIdsOf(sa)).toEqual([3]);
    expect(permissionIdsOf(sa)).toEqual([12]);
    expect(permissionNamesOf(sa)).toEqual(["igrp.client.list"]);
  });

  it("trust empty pairs over stale flat sets", () => {
    const sa = { ...legacy, roles: [], permissions: [] };
    expect(roleIdsOf(sa)).toEqual([]);
    expect(permissionIdsOf(sa)).toEqual([]);
    expect(permissionNamesOf(sa)).toEqual([]);
  });

  it("fall back to the flat sets on older backends", () => {
    expect(roleIdsOf(legacy)).toEqual([9, 4]);
    expect(permissionIdsOf(legacy)).toEqual([7]);
    expect(permissionNamesOf(legacy)).toEqual(["legacy.name"]);
  });

  it("handle missing lists", () => {
    expect(roleIdsOf({})).toEqual([]);
    expect(permissionIdsOf({})).toEqual([]);
    expect(permissionNamesOf({})).toEqual([]);
  });
});

describe("groupRolesByDepartment", () => {
  it("groups and sorts by department, then role code", () => {
    const role = (code: string, departmentCode: string) =>
      ({
        id: code.length,
        code,
        departmentCode,
        permissions: [],
      }) as unknown as RoleDTO;
    const groups = groupRolesByDepartment([
      role("b", "INV"),
      role("z", "ADM"),
      role("a", "INV"),
    ]);
    expect(
      groups.map((g) => [g.departmentCode, g.roles.map((r) => r.code)]),
    ).toEqual([
      ["ADM", ["z"]],
      ["INV", ["a", "b"]],
    ]);
  });
});
