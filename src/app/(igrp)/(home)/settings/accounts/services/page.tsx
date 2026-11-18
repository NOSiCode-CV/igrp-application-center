import type { Metadata } from "next";

import { igrpAssertAuthorize } from "@igrp/framework-next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getTranslations } from "next-intl/server";

import { ServiceAccountList } from "@/features/service-accounts/components/service-account-list";
import { prefetchServiceAccountList } from "@/features/service-accounts/prefetch";
import { CLIENT_LIST_PERMISSION } from "@/lib/constants";
import { getQueryClient } from "@/providers/query-client.server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("serviceAccounts.meta");
  return { title: t("listTitle"), description: t("listDescription") };
}

export default async function ServiceAccountsPage() {
  // Refuse before any data is fetched; the AM API enforces the same permission.
  await igrpAssertAuthorize(CLIENT_LIST_PERMISSION);

  const queryClient = getQueryClient();
  await prefetchServiceAccountList(queryClient);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ServiceAccountList />
    </HydrationBoundary>
  );
}
