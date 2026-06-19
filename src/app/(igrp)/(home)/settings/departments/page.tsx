import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { DepartmentListTree } from "@/features/departments/components/dept-list-tree";
import {
  makeQueryClient,
  prefetchDepartments,
} from "@/features/departments/prefetch";

export default async function DepartmentListPage() {
  const queryClient = makeQueryClient();

  await prefetchDepartments(queryClient);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DepartmentListTree />
    </HydrationBoundary>
  );
}
