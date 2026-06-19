import type { QueryClient } from "@tanstack/react-query";

import { getDepartments } from "@/actions/departments";
import { HttpStatusError } from "@/lib/errors";
import { makeQueryClient } from "@/providers/query-client";

export { makeQueryClient };

export async function prefetchDepartments(client: QueryClient) {
  // fetchQuery rethrows on failure so the segment boundary can render the
  // status error page (prefetchQuery would swallow the error).
  await client.fetchQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const result = await getDepartments();
      if (!result.success) {
        throw new HttpStatusError(result.status, result.error);
      }
      return result.data;
    },
  });
}
