import { notFound } from "next/navigation";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getUser } from "@/actions/user";
import { UserDetailView } from "@/features/users/components/user-detail-view";
import { makeQueryClient } from "@/providers/query-client";

export const dynamic = "force-dynamic";

export default async function UserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const queryClient = makeQueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["user", id],
    queryFn: async () => {
      const result = await getUser(id);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });
  // prefetchQuery swallows the error; if the user wasn't loaded, 404.
  if (!queryClient.getQueryData(["user", id])) {
    notFound();
  }
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserDetailView id={id} />
    </HydrationBoundary>
  );
}
