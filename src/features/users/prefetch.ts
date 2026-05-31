import type { QueryClient } from "@tanstack/react-query";
import {
  getCurrentUser,
  getCurrentUserActiveRole,
  getCurrentUserApplications,
  getCurrentUserDepartments,
  getCurrentUserFavoriteApplications,
  getCurrentUserRecentApplications,
  getCurrentUserRoles,
} from "@/actions/user";
import { makeQueryClient } from "@/providers/query-client";

export { makeQueryClient };

/**
 * Prefetch every query the home launcher reads on first paint.
 *
 * Includes the user identity (current-user, active role, roles,
 * departments) so the hero greeting renders with the user's name and
 * context immediately on hydration — no post-mount popping.
 */
export async function prefetchCurrentUserDashboard(client: QueryClient) {
  await Promise.all([
    client.prefetchQuery({
      queryKey: ["current-user"],
      queryFn: async () => {
        const r = await getCurrentUser();
        if (!r.success) throw new Error(r.error);
        return r.data;
      },
    }),
    client.prefetchQuery({
      queryKey: ["current-user-active-role"],
      queryFn: async () => {
        const r = await getCurrentUserActiveRole();
        if (!r.success) throw new Error(r.error);
        return r.data;
      },
    }),
    client.prefetchQuery({
      queryKey: ["current-user-roles"],
      queryFn: async () => {
        const r = await getCurrentUserRoles();
        if (!r.success) throw new Error(r.error);
        return r.data;
      },
    }),
    client.prefetchQuery({
      queryKey: ["current-user-departments"],
      queryFn: async () => {
        const r = await getCurrentUserDepartments();
        if (!r.success) throw new Error(r.error);
        return r.data;
      },
    }),
    client.prefetchQuery({
      queryKey: ["current-user-applications"],
      queryFn: async () => {
        const r = await getCurrentUserApplications();
        if (!r.success) throw new Error(r.error);
        return r.data;
      },
    }),
    client.prefetchQuery({
      queryKey: ["favorite-applications", undefined],
      queryFn: async () => {
        const r = await getCurrentUserFavoriteApplications();
        if (!r.success) throw new Error(r.error);
        return r.data;
      },
    }),
    client.prefetchQuery({
      queryKey: ["recent-applications", undefined],
      queryFn: async () => {
        const r = await getCurrentUserRecentApplications();
        if (!r.success) throw new Error(r.error);
        return r.data;
      },
    }),
  ]);
}
