import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getUser } from "@/actions/user";
import { UserDetailView } from "@/features/users/components/user-detail-view";
import { HttpStatusError } from "@/lib/errors";
import { makeQueryClient } from "@/providers/query-client";

export const dynamic = "force-dynamic";

export default async function UserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const queryClient = makeQueryClient();
  // fetchQuery (unlike prefetchQuery) rethrows the queryFn error, so an
  // HTTP failure reaches the segment error boundary as a status page.
  await queryClient.fetchQuery({
    queryKey: ["user", id],
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
