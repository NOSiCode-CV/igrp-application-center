import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import {
  makeQueryClient,
  prefetchCurrentUserDashboard,
} from "@/features/users/prefetch";
import { HomeDashboard } from "./home-dashboard";

export default async function HomeIGRP() {
  const queryClient = makeQueryClient();
  await prefetchCurrentUserDashboard(queryClient);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomeDashboard />
    </HydrationBoundary>
  );
}
