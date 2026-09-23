import type { Metadata } from "next";

import { IGRPPageHeader } from "@igrp/igrp-framework-react-design-system";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { DepartmentListTree } from "@/features/departments/components/dept-list-tree";
import { prefetchDepartments } from "@/features/departments/prefetch";
import { PAGE_HEADER_PROPS } from "@/lib/page-header";
import { getQueryClient } from "@/providers/query-client.server";

export const metadata: Metadata = {
  title: "Departamentos",
  description: "Gerir departamentos, perfis, permissões e menus.",
};

export default async function DepartmentListPage() {
  const queryClient = getQueryClient();

  await prefetchDepartments(queryClient);

  return (
    <div className="flex flex-col gap-6">
      <IGRPPageHeader
        {...PAGE_HEADER_PROPS}
        title="Gestão de Departamentos"
        description="Organize os departamentos e os perfis, permissões e menus associados."
        showBackButton
        urlBackButton="/settings"
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <DepartmentListTree />
      </HydrationBoundary>
    </div>
  );
}
