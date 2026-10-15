import type { Metadata } from "next";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { ServiceAccountList } from "@/features/service-accounts/components/service-account-list";
import { prefetchServiceAccountList } from "@/features/service-accounts/prefetch";
import { getQueryClient } from "@/providers/query-client.server";

export const metadata: Metadata = {
  title: "Contas de Serviço",
  description: "Identidades de máquina que autenticam via client_credentials.",
};

export default async function ServiceAccountsPage() {
  const queryClient = getQueryClient();
  await prefetchServiceAccountList(queryClient);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ServiceAccountList />
    </HydrationBoundary>
  );
}
