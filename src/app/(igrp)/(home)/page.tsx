import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { prefetchCurrentUserDashboard } from "@/features/users/prefetch";
import { EnterpriseWorkspace } from "@/features/workspace";
import { getQueryClient } from "@/providers/query-client.server";

export default async function HomeIGRP() {
  const queryClient = getQueryClient();
  await prefetchCurrentUserDashboard(queryClient);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="h-(--home-scroll-h) lg:h-(--home-scroll-h-lg) overflow-hidden flex flex-col">
        <EnterpriseWorkspace />
      </div>
    </HydrationBoundary>
  );
}
