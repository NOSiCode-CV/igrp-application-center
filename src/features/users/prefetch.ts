import type { QueryClient } from "@tanstack/react-query";
import {
  getCurrentUserApplications,
  getCurrentUserFavoriteApplications,
  getCurrentUserRecentApplications,
} from "@/actions/user";
import { makeQueryClient } from "@/providers/query-client";

export { makeQueryClient };

export async function prefetchCurrentUserDashboard(client: QueryClient) {
  await Promise.all([
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
