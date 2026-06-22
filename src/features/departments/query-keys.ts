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
  detail: (code?: string) => ["department-by-code", code] as const,
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
