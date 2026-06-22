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
import { HttpStatusError } from "@/lib/errors";

import { currentUserKeys } from "./query-keys";

/**
 * Prefetch every query the home launcher reads on first paint.
 *
 * Includes the user identity (current-user, active role, roles,
 * departments) so the hero greeting renders with the user's name and
 * context immediately on hydration — no post-mount popping.
 */
export async function prefetchCurrentUserDashboard(client: QueryClient) {
  await Promise.all([
    // Primary resource: without the current user the launcher is unusable,
    // so a failure here surfaces the status error page (fetchQuery throws;
    // the secondary prefetchQuery calls below degrade gracefully).
    client.fetchQuery({
      queryKey: currentUserKeys.detail(),
      queryFn: async () => {
        const r = await getCurrentUser();
        if (!r.success) throw new HttpStatusError(r.status, r.error);
        return r.data;
      },
    }),
    client.prefetchQuery({
      queryKey: currentUserKeys.activeRole(),
      queryFn: async () => {
        const r = await getCurrentUserActiveRole();
        if (!r.success) throw new Error(r.error);
        return r.data;
      },
    }),
    client.prefetchQuery({
      queryKey: currentUserKeys.roles(),
      queryFn: async () => {
        const r = await getCurrentUserRoles();
        if (!r.success) throw new Error(r.error);
        return r.data;
      },
    }),
    client.prefetchQuery({
      queryKey: currentUserKeys.departments(),
      queryFn: async () => {
        const r = await getCurrentUserDepartments();
        if (!r.success) throw new Error(r.error);
        return r.data;
      },
    }),
    client.prefetchQuery({
      queryKey: currentUserKeys.applications(),
      queryFn: async () => {
        const r = await getCurrentUserApplications();
        if (!r.success) throw new Error(r.error);
        return r.data;
      },
    }),
    client.prefetchQuery({
      queryKey: currentUserKeys.favoriteApplications(),
      queryFn: async () => {
        const r = await getCurrentUserFavoriteApplications();
        if (!r.success) throw new Error(r.error);
        return r.data;
      },
    }),
    client.prefetchQuery({
      queryKey: currentUserKeys.recentApplications(),
      queryFn: async () => {
        const r = await getCurrentUserRecentApplications();
        if (!r.success) throw new Error(r.error);
        return r.data;
      },
    }),
  ]);
}
