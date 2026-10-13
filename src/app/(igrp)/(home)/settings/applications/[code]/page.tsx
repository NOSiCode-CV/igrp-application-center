import type { Metadata } from "next";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getTranslations } from "next-intl/server";

import { ApplicationDetails } from "@/features/applications/components/app-details";
import {
  getApplicationByCodeCached,
  prefetchApplicationByCode,
} from "@/features/applications/prefetch";
import { getQueryClient } from "@/providers/query-client.server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const [result, t] = await Promise.all([
    getApplicationByCodeCached(code),
    getTranslations("applications.meta"),
  ]);
  const name = result.success ? result.data.name : code;
  return {
    title: t("detailTitle", { name }),
  };
}

export default async function ApplicationDetailsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const queryClient = getQueryClient();
  await prefetchApplicationByCode(queryClient, code);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ApplicationDetails code={code} />
    </HydrationBoundary>
  );
}
