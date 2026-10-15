import type { QueryClient } from "@tanstack/react-query";

import { departmentListOptions } from "./query-options";

export async function prefetchDepartments(client: QueryClient) {
  // fetchQuery rethrows on failure so the segment boundary can render the
  // status error page (prefetchQuery would swallow the error).
  // departmentListOptions' queryFn already calls unwrap(), which throws
  // HttpStatusError on failure — no override needed.
  await client.fetchQuery(departmentListOptions());
}
