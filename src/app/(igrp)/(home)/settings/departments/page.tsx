import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getDepartments } from "@/actions/departments";
import { DepartmentListTree } from "@/features/departments/components/dept-list-tree";
import { makeQueryClient } from "@/providers/query-provider";

export default async function DepartmentListPage() {
  const queryClient = makeQueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const result = await getDepartments();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DepartmentListTree />
    </HydrationBoundary>
  );
}
