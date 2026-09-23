import { cache } from "react";

import type { QueryClient } from "@tanstack/react-query";

import { getOAuthClient } from "@/actions/oauth-clients";
import { unwrap } from "@/actions/types";
import { serviceAccountListOptions } from "@/features/service-accounts/query-options";

import {
  oauthClientByIdOptions,
  oauthClientListOptions,
} from "./query-options";

export const getOAuthClientCached = cache(getOAuthClient);

/** Clients are page-critical (fetchQuery rethrows → error.tsx); the SA list is
 *  supplementary (prefetchQuery swallows → the page degrades, see Task 7). */
export async function prefetchOAuthClientList(client: QueryClient) {
  await Promise.all([
    client.fetchQuery(oauthClientListOptions()),
    client.prefetchQuery(serviceAccountListOptions()),
  ]);
}

export async function prefetchOAuthClient(client: QueryClient, id: string) {
  await Promise.all([
    client.fetchQuery({
      ...oauthClientByIdOptions(id),
      queryFn: async () => unwrap(await getOAuthClientCached(id)),
    }),
    client.prefetchQuery(serviceAccountListOptions()),
  ]);
}
