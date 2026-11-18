import type { Metadata } from "next";

import { igrpAssertAuthorize } from "@igrp/framework-next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getTranslations } from "next-intl/server";

import { OAuthClientDetail } from "@/features/oauth-clients/components/oauth-client-detail";
import {
  getOAuthClientCached,
  prefetchOAuthClient,
} from "@/features/oauth-clients/prefetch";
import { CLIENT_VIEW_PERMISSION } from "@/lib/constants";
import { getQueryClient } from "@/providers/query-client.server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const t = await getTranslations("oauthClients.meta");
  const result = await getOAuthClientCached(id);
  const name = result.success
    ? result.data.clientName || result.data.clientId
    : t("detailFallback");
  return { title: t("detailTitle", { name }) };
}

export default async function OAuthClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Refuse before any data is fetched; the AM API enforces the same permission.
  await igrpAssertAuthorize(CLIENT_VIEW_PERMISSION);

  const { id } = await params;
  const queryClient = getQueryClient();
  await prefetchOAuthClient(queryClient, id);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OAuthClientDetail id={id} />
    </HydrationBoundary>
  );
}
