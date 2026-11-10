import type { Metadata } from "next";

import { igrpAssertAuthorize } from "@igrp/framework-next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getTranslations } from "next-intl/server";

import { OAuthClientList } from "@/features/oauth-clients/components/oauth-client-list";
import { prefetchOAuthClientList } from "@/features/oauth-clients/prefetch";
import { CLIENT_LIST_PERMISSION } from "@/lib/constants";
import { getQueryClient } from "@/providers/query-client.server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("oauthClients.meta");
  return { title: t("listTitle"), description: t("listDescription") };
}

export default async function OAuthClientsPage() {
  // Refuse before any data is fetched; the AM API enforces the same permission.
  await igrpAssertAuthorize(CLIENT_LIST_PERMISSION);

  const queryClient = getQueryClient();
  await prefetchOAuthClientList(queryClient);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OAuthClientList />
    </HydrationBoundary>
  );
}
