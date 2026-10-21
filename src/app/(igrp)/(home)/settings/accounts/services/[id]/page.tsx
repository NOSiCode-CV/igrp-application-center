import type { Metadata } from "next";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getTranslations } from "next-intl/server";

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
  const t = await getTranslations("serviceAccounts.meta");
  const result = await getServiceAccountCached(id);
  const name = result.success ? result.data.name : t("detailFallback");
  return { title: t("detailTitle", { name }) };
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
