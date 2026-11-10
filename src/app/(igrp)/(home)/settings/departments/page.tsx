import type { Metadata } from "next";

import { igrpAssertAuthorize } from "@igrp/framework-next";
import { IGRPPageHeader } from "@igrp/igrp-framework-react-design-system";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getTranslations } from "next-intl/server";

import { DepartmentListTree } from "@/features/departments/components/dept-list-tree";
import { prefetchDepartments } from "@/features/departments/prefetch";
import { DEPARTMENTS_LIST_PERMISSION } from "@/lib/constants";
import { PAGE_HEADER_PROPS } from "@/lib/page-header";
import { getQueryClient } from "@/providers/query-client.server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("departments.meta");
  return { title: t("title"), description: t("description") };
}

export default async function DepartmentListPage() {
  // Refuse before any data is fetched; the AM API enforces the same permission.
  await igrpAssertAuthorize(DEPARTMENTS_LIST_PERMISSION);

  const t = await getTranslations("departments.page");
  const queryClient = getQueryClient();

  await prefetchDepartments(queryClient);

  return (
    <div className="flex flex-col gap-6">
      <IGRPPageHeader
        {...PAGE_HEADER_PROPS}
        title={t("title")}
        description={t("description")}
        showBackButton
        urlBackButton="/settings"
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <DepartmentListTree />
      </HydrationBoundary>
    </div>
  );
}
