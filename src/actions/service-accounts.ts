"use server";

import type { ServiceAccountDTO } from "@igrp/platform-access-management-client-ts";

import { withActive } from "@/features/oauth-clients/lib/oauth-client-request";
import { toServiceAccountRequest } from "@/features/service-accounts/lib/service-account-request";
import { toActionError } from "@/lib/app-utilities";

import { getClientAccess } from "./access-client";
import type { ActionResult } from "./types";

export type ActivationStep = "client" | "serviceAccount";

export type SetActiveResult =
  | { success: true; data: null }
  | {
      success: false;
      error: string;
      status?: number;
      failedStep: ActivationStep;
    };

export async function listServiceAccounts(): Promise<
  ActionResult<ServiceAccountDTO[]>
> {
  const client = await getClientAccess();
  try {
    const result = await client.serviceAccounts.listServiceAccounts();
    return { success: true, data: result.data };
  } catch (error) {
    console.error(
      "[service-accounts] Erro ao carregar contas de serviço:",
      error,
    );
    return { success: false, ...toActionError(error) };
  }
}

/**
 * Deactivation turns off BOTH the service account and its OAuth client
 * (CONTEXT.md → Deactivation). Order matters: on deactivate the client goes
 * first because that is what actually blocks authentication; on reactivate
 * the service account goes first so the identity never authenticates without
 * its roles. Stops at the first failure and reports the step.
 */
export async function setServiceAccountActive(
  id: string,
  active: boolean,
): Promise<SetActiveResult> {
  const client = await getClientAccess();

  let step: ActivationStep = "serviceAccount";
  try {
    const sa = (await client.serviceAccounts.getServiceAccount(id)).data;
    step = "client";
    const oauth = (await client.oauthClients.getOAuthClient(sa.oauthClientId))
      .data;

    const updateClient = async () => {
      step = "client";
      await client.oauthClients.updateOAuthClient(
        oauth.id,
        withActive(oauth, active),
      );
    };
    const updateAccount = async () => {
      step = "serviceAccount";
      await client.serviceAccounts.updateServiceAccount(id, {
        ...toServiceAccountRequest(sa),
        active,
      });
    };

    if (active) {
      await updateAccount();
      await updateClient();
    } else {
      await updateClient();
      await updateAccount();
    }
    return { success: true, data: null };
  } catch (error) {
    console.error(`[service-account-active] Falhou no passo ${step}:`, error);
    return { success: false, failedStep: step, ...toActionError(error) };
  }
}
