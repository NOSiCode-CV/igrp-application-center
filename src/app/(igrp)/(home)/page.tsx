import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { prefetchCurrentUserDashboard } from "@/features/users/prefetch";
import { EnterpriseWorkspace } from "@/features/workspace";
import { getQueryClient } from "@/providers/query-client.server";

export default async function HomeIGRP() {
  const queryClient = getQueryClient();
  await prefetchCurrentUserDashboard(queryClient);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {/* No viewport-derived height and no `overflow-hidden`: this page
          scrolls with the document, like settings, users and profile. The
          previous version pinned itself to `100dvh` minus the framework
          chrome so an inner panel could own the scroll — which drew a second
          scrollbar inside the page, inset from the window edge. */}
      <div className="flex flex-col bg-muted/10">
        <EnterpriseWorkspace />
      </div>
    </HydrationBoundary>
  );
}
