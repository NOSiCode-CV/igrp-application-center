import type { Metadata } from "next";

import { igrpAssertAuthorize } from "@igrp/framework-next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getTranslations } from "next-intl/server";

import { ApplicationList } from "@/features/applications/components/app-list";
import { prefetchApplicationsList } from "@/features/applications/prefetch";
import { APPLICATIONS_LIST_PERMISSION } from "@/lib/constants";
import { getQueryClient } from "@/providers/query-client.server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("applications.meta");
  return { title: t("listTitle"), description: t("listDescription") };
}

export default async function ApplicationsPage() {
  // Refuse before any data is fetched; the AM API enforces the same permission.
  await igrpAssertAuthorize(APPLICATIONS_LIST_PERMISSION);

  const queryClient = getQueryClient();
  await prefetchApplicationsList(queryClient);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ApplicationList />
    </HydrationBoundary>
  );
}
