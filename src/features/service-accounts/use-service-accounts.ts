import { useMemo } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createServiceAccount,
  createServiceAccountWithNewClient,
  deleteServiceAccount,
  type ServiceAccountAccess,
  type ServiceAccountIdentity,
  type ServiceAccountInput,
  setServiceAccountAccess,
  setServiceAccountActive,
  updateServiceAccountIdentity,
} from "@/actions/service-accounts";
import type { OAuthClientInput } from "@/features/oauth-clients/lib/oauth-client-request";
import { findLinkedServiceAccount } from "@/features/oauth-clients/lib/oauth-client-utils";
import { oauthClientKeys } from "@/features/oauth-clients/query-keys";
import { oauthClientListOptions } from "@/features/oauth-clients/query-options";

import { getAvailableOAuthClients } from "./lib/service-account-utils";
import { serviceAccountKeys } from "./query-keys";
import {
  serviceAccountByIdOptions,
  serviceAccountListOptions,
} from "./query-options";

export const useServiceAccounts = () => useQuery(serviceAccountListOptions());

export const useServiceAccount = (id: string) =>
  useQuery(serviceAccountByIdOptions(id));

/** `isError` lets callers fail safe (treat as possibly linked). */
export const useLinkedServiceAccount = (oauthClientId: string) => {
  const query = useServiceAccounts();
  return {
    ...findLinkedServiceAccount(query.data, oauthClientId),
    isLoading: query.isLoading,
    isError: query.isError,
  };
};

export const useAvailableOAuthClients = () => {
  const clients = useQuery(oauthClientListOptions());
  const accounts = useServiceAccounts();
  const data = useMemo(
    () => getAvailableOAuthClients(clients.data, accounts.data),
    [clients.data, accounts.data],
  );
  return {
    data,
    isLoading: clients.isLoading || accounts.isLoading,
    isError: clients.isError || accounts.isError,
  };
};

function useInvalidateBoth() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: serviceAccountKeys.all }),
      qc.invalidateQueries({ queryKey: oauthClientKeys.all }),
    ]);
}

export const useCreateServiceAccount = () => {
  const invalidateBoth = useInvalidateBoth();
  return useMutation({
    mutationFn: (input: ServiceAccountInput) => createServiceAccount(input),
    onSuccess: async (result) => {
      if (result.success) await invalidateBoth();
    },
  });
};

/**
 * The result may carry a raw clientSecret (success or partial failure), so:
 * no setQueryData, `gcTime: 0`, and a fire-and-forget refresh that doesn't
 * hold the mutation pending (Plan 1's useCreateOAuthClient pattern).
 */
export const useCreateServiceAccountWithNewClient = () => {
  const invalidateBoth = useInvalidateBoth();
  return useMutation({
    mutationFn: ({
      client,
      account,
    }: {
      client: OAuthClientInput;
      account: Omit<ServiceAccountInput, "oauthClientId">;
    }) => createServiceAccountWithNewClient(client, account),
    gcTime: 0,
    onSettled: () => {
      void invalidateBoth();
    },
  });
};

export const useUpdateServiceAccountIdentity = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      identity,
    }: {
      id: string;
      identity: ServiceAccountIdentity;
    }) => updateServiceAccountIdentity(id, identity),
    onSuccess: async (result) => {
      if (result.success)
        await qc.invalidateQueries({ queryKey: serviceAccountKeys.all });
    },
  });
};

export const useSetServiceAccountAccess = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      access,
    }: {
      id: string;
      access: ServiceAccountAccess;
    }) => setServiceAccountAccess(id, access),
    onSuccess: async (result) => {
      if (result.success)
        await qc.invalidateQueries({ queryKey: serviceAccountKeys.all });
    },
  });
};

export const useDeleteServiceAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      alsoDeleteClient,
    }: {
      id: string;
      alsoDeleteClient: boolean;
    }) => deleteServiceAccount(id, { alsoDeleteClient }),
    // Settled, not success: a client-step failure still deleted the account.
    onSettled: async (result, _error, { id }) => {
      if (result?.success || result?.failedStep === "client") {
        qc.removeQueries({ queryKey: serviceAccountKeys.detail(id) });
      }
      await Promise.all([
        qc.invalidateQueries({ queryKey: serviceAccountKeys.list() }),
        qc.invalidateQueries({ queryKey: oauthClientKeys.all }),
      ]);
    },
  });
};

export const useSetServiceAccountActive = () => {
  const invalidateBoth = useInvalidateBoth();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      setServiceAccountActive(id, active),
    onSettled: async () => {
      await invalidateBoth();
    },
  });
};
