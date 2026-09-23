import type { Metadata } from "next";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { OAuthClientList } from "@/features/oauth-clients/components/oauth-client-list";
import { prefetchOAuthClientList } from "@/features/oauth-clients/prefetch";
import { getQueryClient } from "@/providers/query-client.server";

export const metadata: Metadata = {
  title: "Clientes OAuth",
  description:
    "Consumidores de API registados no servidor de autorização iGRP.",
};

export default async function OAuthClientsPage() {
  const queryClient = getQueryClient();
  await prefetchOAuthClientList(queryClient);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OAuthClientList />
    </HydrationBoundary>
  );
}
