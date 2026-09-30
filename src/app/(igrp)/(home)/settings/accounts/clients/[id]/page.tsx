import type { Metadata } from "next";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { OAuthClientDetail } from "@/features/oauth-clients/components/oauth-client-detail";
import {
  getOAuthClientCached,
  prefetchOAuthClient,
} from "@/features/oauth-clients/prefetch";
import { getQueryClient } from "@/providers/query-client.server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await getOAuthClientCached(id);
  const title = result.success
    ? result.data.clientName || result.data.clientId
    : "Cliente OAuth";
  return { title: `${title} · Clientes OAuth` };
}

export default async function OAuthClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const queryClient = getQueryClient();
  await prefetchOAuthClient(queryClient, id);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OAuthClientDetail id={id} />
    </HydrationBoundary>
  );
}
