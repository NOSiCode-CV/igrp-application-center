import { QueryClient } from "@tanstack/react-query";
import {
  getApplicationByCode,
  getApplications,
} from "@/actions/applications";
import { applicationsKeys } from "./query-keys";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: false,
      },
    },
  });
}

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
      const result = await getApplicationByCode(code);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });
}
