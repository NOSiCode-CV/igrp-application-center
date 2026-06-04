import type { Metadata } from "next";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { ApplicationList } from "@/features/applications/components/app-list";
import {
  makeQueryClient,
  prefetchApplicationsList,
} from "@/features/applications/prefetch";

export const metadata: Metadata = {
  title: "Aplicações",
  description: "Gerir aplicações e menus.",
};

export default async function ApplicationsPage() {
  const queryClient = makeQueryClient();
  await prefetchApplicationsList(queryClient);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ApplicationList />
    </HydrationBoundary>
  );
}
