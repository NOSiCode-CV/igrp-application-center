import type { Metadata } from "next";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getTranslations } from "next-intl/server";

import { ServiceAccountWizard } from "@/features/service-accounts/components/wizard/service-account-wizard";
import { prefetchServiceAccountWizard } from "@/features/service-accounts/prefetch";
import { getQueryClient } from "@/providers/query-client.server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("serviceAccounts.meta");
  return { title: t("newTitle") };
}

export default async function NewServiceAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ oauthClientId?: string | string[] }>;
}) {
  const { oauthClientId } = await searchParams;
  const queryClient = getQueryClient();
  await prefetchServiceAccountWizard(queryClient);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ServiceAccountWizard
        initialOAuthClientId={
          typeof oauthClientId === "string" ? oauthClientId : undefined
        }
      />
    </HydrationBoundary>
  );
}
