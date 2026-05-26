import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getCurrentUser } from "@/actions/user";
import { UserProfile } from "@/features/users/components/user-profile";
import { getQueryClient } from "@/providers/query-client.server";

export default async function UserProfilePage() {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const result = await getCurrentUser();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  return (
    <div className="container mx-auto max-w-7xl">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <UserProfile />
      </HydrationBoundary>
    </div>
  );
}
