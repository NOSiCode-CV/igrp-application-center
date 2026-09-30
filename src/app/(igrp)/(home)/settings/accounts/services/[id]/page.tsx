import type { Metadata } from "next";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { ServiceAccountAccess } from "@/features/service-accounts/components/service-account-access";
import { ServiceAccountDetail } from "@/features/service-accounts/components/service-account-detail";
import {
  getServiceAccountCached,
  prefetchServiceAccount,
} from "@/features/service-accounts/prefetch";
import { getQueryClient } from "@/providers/query-client.server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await getServiceAccountCached(id);
  return {
    title: `${result.success ? result.data.name : "Conta de serviço"} · Contas de Serviço`,
  };
}

export default async function ServiceAccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const queryClient = getQueryClient();
  await prefetchServiceAccount(queryClient, id);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ServiceAccountDetail id={id} main={<ServiceAccountAccess id={id} />} />
    </HydrationBoundary>
  );
}
