import type { OAuthClientDTO } from "@igrp/platform-access-management-client-ts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createOAuthClient,
  deleteOAuthClient,
  setOAuthClientActive,
  updateOAuthClient,
} from "@/actions/oauth-clients";
import type { SetActiveResult } from "@/actions/service-accounts";
import { setServiceAccountActive } from "@/actions/service-accounts";
import type { ActionResult } from "@/actions/types";
import { serviceAccountKeys } from "@/features/service-accounts/query-keys";

import type { OAuthClientInput } from "./lib/oauth-client-request";
import { oauthClientKeys } from "./query-keys";
import {
  oauthClientByIdOptions,
  oauthClientListOptions,
} from "./query-options";

export const useOAuthClients = () => useQuery(oauthClientListOptions());

export const useOAuthClient = (id: string) =>
  useQuery(oauthClientByIdOptions(id));

/** Deliberately no setQueryData: the response carries the raw secret. */
export const useCreateOAuthClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: OAuthClientInput) => createOAuthClient(input),
    onSuccess: async (result) => {
      if (result.success)
        await qc.invalidateQueries({ queryKey: oauthClientKeys.all });
    },
  });
};

export const useUpdateOAuthClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: OAuthClientInput }) =>
      updateOAuthClient(id, request),
    onSuccess: async (result) => {
      if (result.success)
        await qc.invalidateQueries({ queryKey: oauthClientKeys.all });
    },
  });
};

export const useDeleteOAuthClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteOAuthClient(id),
    onSuccess: async (result) => {
      if (!result.success) return;
      await Promise.all([
        qc.invalidateQueries({ queryKey: oauthClientKeys.all }),
        qc.invalidateQueries({ queryKey: serviceAccountKeys.all }),
      ]);
    },
  });
};

/** One entry point for both toggles so a linked pair never diverges (spec §6.1). */
export const useSetClientActive = () => {
  const qc = useQueryClient();
  return useMutation<
    ActionResult<unknown> | SetActiveResult,
    Error,
    { client: OAuthClientDTO; linkedAccountId?: string; active: boolean }
  >({
    mutationFn: ({
      client,
      linkedAccountId,
      active,
    }: {
      client: OAuthClientDTO;
      linkedAccountId?: string;
      active: boolean;
    }) =>
      linkedAccountId
        ? setServiceAccountActive(linkedAccountId, active)
        : setOAuthClientActive(client.id, active),
    // Invalidate on settle, not success: a partial combined failure still
    // changed server state (the first step went through).
    onSettled: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: oauthClientKeys.all }),
        qc.invalidateQueries({ queryKey: serviceAccountKeys.all }),
      ]);
    },
  });
};
