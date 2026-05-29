import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ApplicationsListHome } from "@/features/applications/components/app-list-home";
import {
  makeQueryClient,
  prefetchCurrentUserDashboard,
} from "@/features/users/prefetch";

export default async function HomeIGRP() {
  const queryClient = makeQueryClient();
  await prefetchCurrentUserDashboard(queryClient);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="mx-auto p-6">
        <ApplicationsListHome />
      </div>
    </HydrationBoundary>
  );
}
