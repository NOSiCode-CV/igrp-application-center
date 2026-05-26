import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ApplicationDetails } from "@/features/applications/components/app-details";
import {
  makeQueryClient,
  prefetchApplicationByCode,
} from "@/features/applications/prefetch";

export default async function ApplicationDetailsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const queryClient = makeQueryClient();
  await prefetchApplicationByCode(queryClient, code);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ApplicationDetails code={code} />
    </HydrationBoundary>
  );
}
