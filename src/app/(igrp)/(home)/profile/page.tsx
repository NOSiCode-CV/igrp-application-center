import type { Metadata } from "next";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getFileUrl } from "@/actions/file";
import { getCurrentUser } from "@/actions/user";
import { filesKeys } from "@/features/files/query-keys";
import { UserProfile } from "@/features/users/components/user-profile";
import { HttpStatusError } from "@/lib/errors";
import { getQueryClient } from "@/providers/query-client.server";

export const metadata: Metadata = {
  title: "Perfil",
};

export default async function UserProfilePage() {
  const queryClient = getQueryClient();

  // fetchQuery rethrows on failure so the boundary shows the status page.
  const user = await queryClient.fetchQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const result = await getCurrentUser();
      if (!result.success) {
        throw new HttpStatusError(result.status, result.error);
      }
      return result.data;
    },
  });

  // Resolve the avatar URL on the server so it hydrates without a pop-in.
  // prefetchQuery (not fetchQuery) so a missing/expired picture never breaks
  // the page — the client query will simply resolve it again.
  if (user.picture) {
    const picture = user.picture;
    await queryClient.prefetchQuery({
      queryKey: filesKeys.byPath(picture),
      queryFn: async () => {
        const result = await getFileUrl(picture);
        if (!result.success) throw new Error(result.error);
        return result.data;
      },
    });
  }

  return (
    <div className="container mx-auto max-w-7xl">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <UserProfile />
      </HydrationBoundary>
    </div>
  );
}
