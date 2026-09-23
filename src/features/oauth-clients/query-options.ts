import { queryOptions } from "@tanstack/react-query";

import { getOAuthClient, listOAuthClients } from "@/actions/oauth-clients";
import { unwrap } from "@/actions/types";

import { oauthClientKeys } from "./query-keys";

export const oauthClientListOptions = () =>
  queryOptions({
    queryKey: oauthClientKeys.list(),
    queryFn: async () => unwrap(await listOAuthClients()),
  });

export const oauthClientByIdOptions = (id: string) =>
  queryOptions({
    queryKey: oauthClientKeys.detail(id),
    queryFn: async () => unwrap(await getOAuthClient(id)),
    enabled: !!id,
  });
