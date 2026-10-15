import { cache } from "react";

import type { QueryClient } from "@tanstack/react-query";

import { getServiceAccount } from "@/actions/service-accounts";
import { unwrap } from "@/actions/types";
import {
  oauthClientByIdOptions,
  oauthClientListOptions,
} from "@/features/oauth-clients/query-options";

import {
  serviceAccountByIdOptions,
  serviceAccountListOptions,
} from "./query-options";

export const getServiceAccountCached = cache(getServiceAccount);

/** Accounts are page-critical (fetchQuery rethrows → error.tsx); clients only enrich rows. */
export async function prefetchServiceAccountList(client: QueryClient) {
  await Promise.all([
    client.fetchQuery(serviceAccountListOptions()),
    client.prefetchQuery(oauthClientListOptions()),
  ]);
}

export async function prefetchServiceAccount(client: QueryClient, id: string) {
  const account = await client.fetchQuery({
    ...serviceAccountByIdOptions(id),
    queryFn: async () => unwrap(await getServiceAccountCached(id)),
  });
  await client.prefetchQuery(oauthClientByIdOptions(account.oauthClientId));
}

/** Both lists feed "available clients"; neither failure should block the wizard. */
export async function prefetchServiceAccountWizard(client: QueryClient) {
  await Promise.all([
    client.prefetchQuery(oauthClientListOptions()),
    client.prefetchQuery(serviceAccountListOptions()),
  ]);
}
