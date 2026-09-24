import type { Metadata } from "next";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { ServiceAccountWizard } from "@/features/service-accounts/components/wizard/service-account-wizard";
import { prefetchServiceAccountWizard } from "@/features/service-accounts/prefetch";
import { getQueryClient } from "@/providers/query-client.server";

export const metadata: Metadata = { title: "Nova conta de serviço" };

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
