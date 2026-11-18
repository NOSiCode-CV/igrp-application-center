import { igrpAssertAuthorize } from "@igrp/framework-next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getUser } from "@/actions/user";
import { UserDetailView } from "@/features/users/components/user-detail-view";
import { userKeys } from "@/features/users/query-keys";
import { USERS_VIEW_PERMISSION } from "@/lib/constants";
import { HttpStatusError } from "@/lib/errors";
import { getQueryClient } from "@/providers/query-client.server";

export const dynamic = "force-dynamic";

export default async function UserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Refuse before any data is fetched; the AM API enforces the same permission.
  await igrpAssertAuthorize(USERS_VIEW_PERMISSION);

  const { id } = await params;
  const queryClient = getQueryClient();
  // fetchQuery (unlike prefetchQuery) rethrows the queryFn error, so an
  // HTTP failure reaches the segment error boundary as a status page.
  await queryClient.fetchQuery({
    queryKey: userKeys.detail(id),
    queryFn: async () => {
      const result = await getUser(id);
      if (!result.success) {
        throw new HttpStatusError(result.status, result.error);
      }
      return result.data;
    },
  });
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserDetailView id={id} />
    </HydrationBoundary>
  );
}
