import type {
  OAuthClientDTO,
  RoleDTO,
  ServiceAccountDTO,
} from "@igrp/platform-access-management-client-ts";

/** client_credentials clients with no Service Account yet (spec §5.3). */
export function getAvailableOAuthClients(
  clients: readonly OAuthClientDTO[] | undefined,
  accounts: readonly ServiceAccountDTO[] | undefined,
): OAuthClientDTO[] {
  const linked = new Set((accounts ?? []).map((a) => a.oauthClientId));
  return (clients ?? []).filter(
    (c) => c.grantTypes.includes("client_credentials") && !linked.has(c.id),
  );
}

export function formatAccessSummary(
  roleCount: number,
  directCount: number,
): string {
  const roles = `${roleCount} ${roleCount === 1 ? "perfil" : "perfis"}`;
  const direct = `${directCount} ${directCount === 1 ? "direta" : "diretas"}`;
  return `${roles} · ${direct}`;
}

export type EffectivePermission = {
  name: string;
  roleCodes: string[];
  direct: boolean;
};

/** Union of role-inherited and direct permissions (CONTEXT.md → Effective Permissions). */
export function computeEffectivePermissions(
  roles: readonly Pick<RoleDTO, "code" | "permissions">[],
  directNames: readonly string[],
) {
  const byName = new Map<string, EffectivePermission>();
  const entry = (name: string) => {
    let found = byName.get(name);
    if (!found) {
      found = { name, roleCodes: [], direct: false };
      byName.set(name, found);
    }
    return found;
  };
  for (const role of roles) {
    for (const name of role.permissions ?? []) {
      const e = entry(name);
      if (!e.roleCodes.includes(role.code)) e.roleCodes.push(role.code);
    }
  }
  for (const name of directNames) entry(name).direct = true;
  const items = [...byName.values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  return {
    fromRoles: items.filter((i) => i.roleCodes.length > 0).length,
    direct: new Set(directNames).size,
    total: items.length,
    items,
  };
}

/**
 * A department-scoped picker only sees its own department's items. Replace
 * the selection inside `scope`, keep everything outside it, never duplicate.
 */
export function mergeScopedSelection<T>(
  current: readonly T[],
  scope: readonly T[],
  selected: readonly T[],
  key: (item: T) => string | number = (item) =>
    item as unknown as string | number,
): T[] {
  const scopeKeys = new Set(scope.map(key));
  const result = current.filter((item) => !scopeKeys.has(key(item)));
  const seen = new Set(result.map(key));
  for (const item of selected) {
    const k = key(item);
    if (seen.has(k)) continue;
    seen.add(k);
    result.push(item);
  }
  return result;
}

type AccessFields = Pick<
  ServiceAccountDTO,
  "roles" | "permissions" | "roleIds" | "permissionIds" | "permissionNames"
>;

/**
 * The flat `roleIds` / `permissionIds` / `permissionNames` are deprecated in
 * SDK beta.18. Read the `roles` / `permissions` pairs when the backend sends
 * them and fall back to the flat sets on older backends. Drop the fallbacks
 * once every environment runs the new backend.
 */
export function roleIdsOf(account: AccessFields): number[] {
  return account.roles?.map((r) => r.id) ?? account.roleIds ?? [];
}

export function permissionIdsOf(account: AccessFields): number[] {
  return account.permissions?.map((p) => p.id) ?? account.permissionIds ?? [];
}

export function permissionNamesOf(account: AccessFields): string[] {
  return (
    account.permissions?.map((p) => p.name) ?? account.permissionNames ?? []
  );
}

export type DirectPermission = { id: number | null; name: string };

/**
 * ACCOUNTS_BACKEND_RESPONSES.md §1: the flat `permissionIds` /
 * `permissionNames` sets cannot be paired by position (two independent
 * HashSets). Backends from SDK beta.18 return `permissions: { id, name }[]`,
 * which is authoritative. Older backends only have the flat sets. There we
 * still pair by position and let `setServiceAccountAccess` verify each removal
 * against the PUT response (restoring the previous set on a mismatch).
 * Drop the fallback once every environment runs the new backend.
 */
export function pairDirectPermissions(
  account: Pick<
    ServiceAccountDTO,
    "permissions" | "permissionIds" | "permissionNames"
  >,
): { items: DirectPermission[]; reliable: boolean } {
  if (account.permissions) {
    return {
      reliable: true,
      items: account.permissions.map(({ id, name }) => ({ id, name })),
    };
  }
  const ids = account.permissionIds ?? [];
  const names = account.permissionNames ?? [];
  if (ids.length !== names.length) {
    return {
      reliable: false,
      items: names.map((name) => ({ id: null, name })),
    };
  }
  return {
    reliable: true,
    items: ids.map((id, i) => ({ id, name: names[i] })),
  };
}

export function groupRolesByDepartment(roles: readonly RoleDTO[]) {
  const groups = new Map<string, RoleDTO[]>();
  for (const role of roles) {
    const list = groups.get(role.departmentCode) ?? [];
    list.push(role);
    groups.set(role.departmentCode, list);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([departmentCode, list]) => ({
      departmentCode,
      roles: [...list].sort((a, b) => a.code.localeCompare(b.code)),
    }));
}
