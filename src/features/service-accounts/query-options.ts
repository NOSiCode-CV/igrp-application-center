import { queryOptions } from "@tanstack/react-query";

import {
  getServiceAccount,
  listServiceAccounts,
} from "@/actions/service-accounts";
import { unwrap } from "@/actions/types";

import { serviceAccountKeys } from "./query-keys";

export const serviceAccountListOptions = () =>
  queryOptions({
    queryKey: serviceAccountKeys.list(),
    queryFn: async () => unwrap(await listServiceAccounts()),
  });

export const serviceAccountByIdOptions = (id: string) =>
  queryOptions({
    queryKey: serviceAccountKeys.detail(id),
    queryFn: async () => unwrap(await getServiceAccount(id)),
    enabled: !!id,
  });
