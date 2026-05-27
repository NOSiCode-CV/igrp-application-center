import type { QueryClient } from "@tanstack/react-query";
import { cache } from "react";
import {
  getApplicationByCode as getApplicationByCodeAction,
  getApplications,
} from "@/actions/applications";
import { makeQueryClient } from "@/providers/query-client";
import { applicationsKeys } from "./query-keys";

export { makeQueryClient };

export const getApplicationByCodeCached = cache(getApplicationByCodeAction);

export async function prefetchApplicationsList(client: QueryClient) {
  await client.prefetchQuery({
    queryKey: applicationsKeys.list(),
    queryFn: async () => {
      const result = await getApplications();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });
}

export async function prefetchApplicationByCode(
  client: QueryClient,
  code: string,
) {
  await client.prefetchQuery({
    queryKey: applicationsKeys.detail(code),
    queryFn: async () => {
      const result = await getApplicationByCodeCached(code);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });
}
