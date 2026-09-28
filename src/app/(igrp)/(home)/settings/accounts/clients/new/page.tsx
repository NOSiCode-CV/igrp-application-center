import type { Metadata } from "next";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { OAuthClientCreate } from "@/features/oauth-clients/components/oauth-client-create";
import { prefetchOAuthClientCreate } from "@/features/oauth-clients/prefetch";
import { getQueryClient } from "@/providers/query-client.server";

export const metadata: Metadata = { title: "Registar cliente OAuth" };

export default async function NewOAuthClientPage() {
  const queryClient = getQueryClient();
  await prefetchOAuthClientCreate(queryClient);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OAuthClientCreate />
    </HydrationBoundary>
  );
}
