import type { OAuthClientDTO } from "@igrp/platform-access-management-client-ts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createOAuthClient,
  deleteOAuthClient,
  rotateOAuthClientSecret,
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

/**
 * Deliberately no setQueryData: the response carries the raw secret. For the
 * same reason `gcTime: 0` — the mutation (and its `data`) leaves the
 * MutationCache as soon as no component observes it, instead of lingering
 * for the default five minutes.
 */
export const useCreateOAuthClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: OAuthClientInput) => createOAuthClient(input),
    gcTime: 0,
    // Fire and forget: awaiting the list refetch would hold the mutation in
    // `pending` and delay the one-time secret pane.
    onSuccess: (result) => {
      if (result.success)
        void qc.invalidateQueries({ queryKey: oauthClientKeys.all });
    },
  });
};

/** Same secret handling as useCreateOAuthClient: no setQueryData, `gcTime: 0`. */
export const useRotateOAuthClientSecret = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rotateOAuthClientSecret(id),
    gcTime: 0,
    // Fire and forget, so the one-time secret pane isn't delayed.
    onSuccess: (result, id) => {
      if (result.success)
        void qc.invalidateQueries({ queryKey: oauthClientKeys.detail(id) });
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
    onSuccess: async (result, id) => {
      if (!result.success) {
        // 409 = a service account is bound to this client (backend FK guard).
        // Refresh the link so the UI's delete block reflects it.
        if (result.status === 409)
          await qc.invalidateQueries({ queryKey: serviceAccountKeys.all });
        return;
      }
      // Drop the deleted detail rather than invalidate it: a refetch would 404.
      qc.removeQueries({ queryKey: oauthClientKeys.detail(id) });
      await Promise.all([
        qc.invalidateQueries({ queryKey: oauthClientKeys.list() }),
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
