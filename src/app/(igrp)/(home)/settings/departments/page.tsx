import type { Metadata } from "next";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { DepartmentListTree } from "@/features/departments/components/dept-list-tree";
import { prefetchDepartments } from "@/features/departments/prefetch";
import { getQueryClient } from "@/providers/query-client.server";

export const metadata: Metadata = {
  title: "Departamentos",
  description: "Gerir departamentos, perfis, permissões e menus.",
};

export default async function DepartmentListPage() {
  const queryClient = getQueryClient();

  await prefetchDepartments(queryClient);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DepartmentListTree />
    </HydrationBoundary>
  );
}
