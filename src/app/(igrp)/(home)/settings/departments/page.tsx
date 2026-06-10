import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getDepartments } from "@/actions/departments";
import { DepartmentListTree } from "@/features/departments/components/dept-list-tree";
import { HttpStatusError } from "@/lib/errors";
import { makeQueryClient } from "@/providers/query-client";

export default async function DepartmentListPage() {
  const queryClient = makeQueryClient();

  // fetchQuery rethrows on failure so the boundary shows the status page.
  await queryClient.fetchQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const result = await getDepartments();
      if (!result.success) {
        throw new HttpStatusError(result.status, result.error);
      }
      return result.data;
    },
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DepartmentListTree />
    </HydrationBoundary>
  );
}
