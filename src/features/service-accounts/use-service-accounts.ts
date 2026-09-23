import { useQuery } from "@tanstack/react-query";

import { findLinkedServiceAccount } from "@/features/oauth-clients/lib/oauth-client-utils";

import { serviceAccountListOptions } from "./query-options";

export const useServiceAccounts = () => useQuery(serviceAccountListOptions());

/** `isError` lets callers fail safe (treat as possibly linked) — see Task 9. */
export const useLinkedServiceAccount = (oauthClientId: string) => {
  const query = useServiceAccounts();
  return {
    ...findLinkedServiceAccount(query.data, oauthClientId),
    isLoading: query.isLoading,
    isError: query.isError,
  };
};
