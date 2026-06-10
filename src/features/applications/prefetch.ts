import { cache } from "react";

import type { QueryClient } from "@tanstack/react-query";

import {
  getApplicationByCode as getApplicationByCodeAction,
  getApplications,
} from "@/actions/applications";
import { HttpStatusError } from "@/lib/errors";
import { makeQueryClient } from "@/providers/query-client";

import { applicationsKeys } from "./query-keys";

export { makeQueryClient };

export const getApplicationByCodeCached = cache(getApplicationByCodeAction);

export async function prefetchApplicationsList(client: QueryClient) {
  // fetchQuery rethrows on failure so the segment boundary can render the
  // status error page (prefetchQuery would swallow the error).
  await client.fetchQuery({
    queryKey: applicationsKeys.list(),
    queryFn: async () => {
      const result = await getApplications();
      if (!result.success) {
        throw new HttpStatusError(result.status, result.error);
      }
      return result.data;
    },
  });
}

export async function prefetchApplicationByCode(
  client: QueryClient,
  code: string,
) {
  await client.fetchQuery({
    queryKey: applicationsKeys.detail(code),
    queryFn: async () => {
      const result = await getApplicationByCodeCached(code);
      if (!result.success) {
        throw new HttpStatusError(result.status, result.error);
      }
      return result.data;
    },
  });
}
