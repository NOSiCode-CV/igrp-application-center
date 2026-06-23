import { cache } from "react";

import type { QueryClient } from "@tanstack/react-query";

import { getApplicationByCode as getApplicationByCodeAction } from "@/actions/applications";
import { unwrap } from "@/actions/types";

import {
  applicationByCodeOptions,
  applicationsListOptions,
} from "./query-options";

export const getApplicationByCodeCached = cache(getApplicationByCodeAction);

export async function prefetchApplicationsList(client: QueryClient) {
  // fetchQuery rethrows on failure so the segment boundary can render the
  // status error page (prefetchQuery would swallow the error).
  await client.fetchQuery(applicationsListOptions());
}

export async function prefetchApplicationByCode(
  client: QueryClient,
  code: string,
) {
  await client.fetchQuery({
    ...applicationByCodeOptions(code),
    // Use the React-cached action for SSR deduplication.
    queryFn: async () => unwrap(await getApplicationByCodeCached(code)),
  });
}
