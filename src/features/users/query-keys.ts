import type {
  AuditLogFilters,
  UserFilters,
} from "@igrp/platform-access-management-client-ts";

/**
 * Query-key factory for the users feature. Mirrors
 * `features/applications/query-keys.ts`. Key shapes are kept identical to the
 * strings previously inlined across the hooks so existing
 * `getQueryData`/`setQueryData` reads and hierarchical `invalidateQueries`
 * prefixes keep matching.
 */
export const userKeys = {
  all: ["users"] as const,
  list: (filters?: UserFilters) => ["users", filters ?? null] as const,
  detail: (id: string) => ["user", id] as const,
  roles: (id: string) => ["userRoles", id] as const,
  applications: (id: string) => ["user-applications", id] as const,
  departments: (id: string) => ["user-departments", id] as const,
  metadata: (id: string) => ["userMetadata", id] as const,
  session: (externalId: string) => ["userSession", externalId] as const,
  auditLogs: (id: string, filters?: AuditLogFilters) =>
    ["userAuditLogs", id, filters] as const,
};

export const invitationKeys = {
  all: ["user-invitations"] as const,
  list: (email?: string) => ["user-invitations", email] as const,
  byToken: (token: string) => ["user-invitation-by-token", token] as const,
};

export const currentUserKeys = {
  detail: () => ["current-user"] as const,
  roles: () => ["current-user-roles"] as const,
  activeRole: () => ["current-user-active-role"] as const,
  departments: () => ["current-user-departments"] as const,
  applications: () => ["current-user-applications"] as const,
  // Prefix that matches every `favoriteApplications(name)` query regardless
  // of the `applicationName` argument — used for broad invalidation/optimistic
  // updates across all cached variants.
  favoriteApplicationsRoot: () => ["favorite-applications"] as const,
  favoriteApplications: (applicationName?: string) =>
    ["favorite-applications", applicationName] as const,
  recentApplicationsRoot: () => ["recent-applications"] as const,
  recentApplications: (applicationName?: string) =>
    ["recent-applications", applicationName] as const,
};
