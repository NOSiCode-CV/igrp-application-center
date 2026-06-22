import type { Metadata } from "next";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { ApplicationList } from "@/features/applications/components/app-list";
import { prefetchApplicationsList } from "@/features/applications/prefetch";
import { getQueryClient } from "@/providers/query-client.server";

export const metadata: Metadata = {
  title: "Aplicações",
  description: "Gerir aplicações e menus.",
};

export default async function ApplicationsPage() {
  const queryClient = getQueryClient();
  await prefetchApplicationsList(queryClient);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ApplicationList />
    </HydrationBoundary>
  );
}
