import type { QueryClient, QueryKey } from "@tanstack/react-query";

import { applicationsKeys } from "@/features/applications/query-keys";

/**
 * Query-key factory for the departments feature. Mirrors
 * `features/applications/query-keys.ts`. Key shapes match the strings
 * previously inlined across the hooks so hierarchical `invalidateQueries`
 * prefixes keep matching.
 *
 * Note: `availableApps` was previously (mis)labelled
 * `"department-available-menus-for-roles"` even though it lists available
 * *applications*. The key string is unchanged here so cached data and any
 * remaining invalidations stay consistent, but the accessor name now
 * reflects what it actually keys.
 */
export const departmentKeys = {
  all: ["departments"] as const,
  list: () => ["departments"] as const,
  availableApps: (code?: string) =>
    ["department-available-menus-for-roles", code] as const,
  availableMenus: (appCode?: string, departmentCode?: string) =>
    ["department-available-menus", appCode, departmentCode] as const,
  menus: (appCode?: string, departmentCode?: string) =>
    ["department-menus", appCode, departmentCode] as const,
  resources: (code?: string) => ["department-resources", code] as const,
  availableResources: (code?: string) => ["available-resources", code] as const,
  permissions: (code?: string) => ["department-permissions", code] as const,
  availablePermissions: (code?: string) =>
    ["available-permissions", code] as const,
};

export const roleKeys = {
  all: ["roles"] as const,
  byDepartment: (departmentCode: string) => ["roles", departmentCode] as const,
  permissions: (departmentCode: string, roleCode: string) =>
    ["permissionsByRole", departmentCode, roleCode] as const,
  availablePermissions: (departmentCode: string, roleCode: string) =>
    ["available-permissions-for-role", departmentCode, roleCode] as const,
};

/**
 * What each department relation change makes stale, in one place: the add
 * and the remove hook of a pair invalidate the same list. Pure data, so the
 * rules are testable without a QueryClient.
 */
export const departmentRelationKeys = {
  applications: (departmentCode: string, appCodes: string[]) => [
    departmentKeys.all,
    applicationsKeys.list({ departmentCode }),
    departmentKeys.availableApps(departmentCode),
    // Menu queries are keyed (appCode, departmentCode): one pair per app.
    ...appCodes.flatMap((appCode) => [
      departmentKeys.availableMenus(appCode, departmentCode),
      departmentKeys.menus(appCode, departmentCode),
    ]),
  ],
  menus: (appCode: string, departmentCode: string) => [
    departmentKeys.all,
    departmentKeys.menus(appCode, departmentCode),
    departmentKeys.availableMenus(appCode, departmentCode),
  ],
  // Resources carry permissions, so both lists go stale.
  resources: (departmentCode: string) => [
    departmentKeys.all,
    departmentKeys.resources(departmentCode),
    departmentKeys.availableResources(departmentCode),
    departmentKeys.permissions(departmentCode),
    departmentKeys.availablePermissions(departmentCode),
  ],
  permissions: (departmentCode: string) => [
    departmentKeys.all,
    departmentKeys.permissions(departmentCode),
    departmentKeys.availablePermissions(departmentCode),
  ],
  rolePermissions: (departmentCode: string, roleCode: string) => [
    roleKeys.all,
    roleKeys.permissions(departmentCode, roleCode),
    roleKeys.availablePermissions(departmentCode, roleCode),
    departmentKeys.resources(departmentCode),
  ],
};

export async function invalidateKeys(
  queryClient: QueryClient,
  keys: readonly QueryKey[],
): Promise<void> {
  await Promise.all(
    keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
  );
}
