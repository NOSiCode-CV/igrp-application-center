import type { RoleDTO } from "@igrp/platform-access-management-client-ts";
import type { UseQueryResult } from "@tanstack/react-query";
import { useQueries } from "@tanstack/react-query";

import { getRoleById } from "@/actions/roles";
import { unwrap } from "@/actions/types";

function combineRoles(results: UseQueryResult<RoleDTO>[]) {
  return {
    roles: results.flatMap((r) => (r.data ? [r.data] : [])),
    isLoading: results.some((r) => r.isLoading),
    isError: results.some((r) => r.isError),
    refetch: () => {
      for (const r of results) if (r.isError) void r.refetch();
    },
  };
}

/**
 * One GET per role (backend gap §7.5). Same key as `useRoleById` so the cache
 * is shared, but errors stay local instead of throwing to the boundary.
 * `combine` gives a structurally shared, stable result.
 */
export function useRoleDetails(roleIds: readonly number[]) {
  return useQueries({
    queries: roleIds.map((id) => ({
      queryKey: ["roleById", id] as const,
      queryFn: async () => unwrap(await getRoleById(id)),
      staleTime: 60_000,
    })),
    combine: combineRoles,
  });
}
