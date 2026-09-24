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

export type DirectPermission = { id: number | null; name: string };

/**
 * ASSUMPTION — ACCOUNTS_BACKEND_REQUESTS.md §1 is unanswered: the DTO carries
 * `permissionIds` and `permissionNames` as two separate sets and nothing
 * guarantees their order matches. We pair by position only when the lengths
 * agree; otherwise names are shown without ids and removal is disabled.
 * Replace with the backend's `{ id, name }` pairs once they exist.
 */
export function pairDirectPermissions(
  account: Pick<ServiceAccountDTO, "permissionIds" | "permissionNames">,
): { items: DirectPermission[]; reliable: boolean } {
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
