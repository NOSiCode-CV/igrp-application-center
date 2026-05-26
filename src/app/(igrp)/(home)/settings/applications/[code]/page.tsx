import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getApplicationByCode } from "@/actions/applications";
import { ApplicationDetails } from "@/features/applications/components/app-details";
import {
  makeQueryClient,
  prefetchApplicationByCode,
} from "@/features/applications/prefetch";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const result = await getApplicationByCode(code);
  const title = result.success ? result.data.name : code;
  return {
    title: `${title} · Aplicações`,
  };
}

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
