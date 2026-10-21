import type { Metadata } from "next";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getTranslations } from "next-intl/server";

import { OAuthClientCreate } from "@/features/oauth-clients/components/oauth-client-create";
import { prefetchOAuthClientCreate } from "@/features/oauth-clients/prefetch";
import { getQueryClient } from "@/providers/query-client.server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("oauthClients.meta");
  return { title: t("newTitle") };
}

export default async function NewOAuthClientPage() {
  const queryClient = getQueryClient();
  await prefetchOAuthClientCreate(queryClient);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OAuthClientCreate />
    </HydrationBoundary>
  );
}
