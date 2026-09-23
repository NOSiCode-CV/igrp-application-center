import { queryOptions } from "@tanstack/react-query";

import { listServiceAccounts } from "@/actions/service-accounts";
import { unwrap } from "@/actions/types";

import { serviceAccountKeys } from "./query-keys";

export const serviceAccountListOptions = () =>
  queryOptions({
    queryKey: serviceAccountKeys.list(),
    queryFn: async () => unwrap(await listServiceAccounts()),
  });
