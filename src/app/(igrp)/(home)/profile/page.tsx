import type { Metadata } from "next";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getCurrentUser } from "@/actions/user";
import { UserProfile } from "@/features/users/components/user-profile";
import { HttpStatusError } from "@/lib/errors";
import { getQueryClient } from "@/providers/query-client.server";

export const metadata: Metadata = {
  title: "Perfil",
};

export default async function UserProfilePage() {
  const queryClient = getQueryClient();

  // fetchQuery rethrows on failure so the boundary shows the status page.
  await queryClient.fetchQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const result = await getCurrentUser();
      if (!result.success) {
        throw new HttpStatusError(result.status, result.error);
      }
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
