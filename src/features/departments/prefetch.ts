import type { QueryClient } from "@tanstack/react-query";

import { getDepartments } from "@/actions/departments";
import { HttpStatusError } from "@/lib/errors";

import { departmentListOptions } from "./query-options";

export async function prefetchDepartments(client: QueryClient) {
  // fetchQuery rethrows on failure so the segment boundary can render the
  // status error page (prefetchQuery would swallow the error).
  // Uses the shared query key from departmentListOptions; overrides queryFn to
  // throw HttpStatusError so the segment boundary renders the status error page.
  await client.fetchQuery({
    ...departmentListOptions(),
    queryFn: async () => {
      const result = await getDepartments();
      if (!result.success) {
        throw new HttpStatusError(result.status, result.error);
      }
      return result.data;
    },
  });
}
