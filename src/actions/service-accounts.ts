"use server";

import type {
  OAuthClientDTO,
  ServiceAccountDTO,
  ServiceAccountRequestDTO,
} from "@igrp/platform-access-management-client-ts";

import {
  type OAuthClientInput,
  withActive,
} from "@/features/oauth-clients/lib/oauth-client-request";
import { toServiceAccountRequest } from "@/features/service-accounts/lib/service-account-request";
import { mergeScopedSelection } from "@/features/service-accounts/lib/service-account-utils";
import { toActionError } from "@/lib/app-utilities";

import { getClientAccess } from "./access-client";
import { createOAuthClient } from "./oauth-clients";
import type { AccessClient, ActionResult } from "./types";

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
        // A service account never has its own application (spec §1): send
        // the client's, so any earlier drift is healed on the next toggle.
        applicationId: oauth.applicationId,
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

/** What the UI sends: never an applicationId — it always comes from the client (spec §1). */
export type ServiceAccountInput = Omit<
  ServiceAccountRequestDTO,
  "applicationId"
>;
export type ServiceAccountIdentity = { name: string; description?: string };
/**
 * What the UI sends to change access: a CHANGE, never a full set. The server
 * applies it to a fresh GET so a stale cache (or a concurrent save from
 * another section) can't overwrite ids it never saw.
 */
export type AccessChange = {
  roles?: { scope: number[]; selected: number[] } | { remove: number[] };
  permissions?:
    | { scope: number[]; selected: number[] }
    | { remove: { id: number; name: string }[] };
};

async function applicationOf(client: AccessClient, oauthClientId: string) {
  return (await client.oauthClients.getOAuthClient(oauthClientId)).data
    .applicationId;
}

/**
 * PUT replaces everything: start from a fresh GET, heal applicationId, apply
 * the patch (computed from that same fresh account when it is a function).
 */
async function putFromFresh(
  client: AccessClient,
  id: string,
  patch:
    | Partial<ServiceAccountRequestDTO>
    | ((fresh: ServiceAccountDTO) => Partial<ServiceAccountRequestDTO>),
) {
  const sa = (await client.serviceAccounts.getServiceAccount(id)).data;
  const applicationId = await applicationOf(client, sa.oauthClientId);
  const request: ServiceAccountRequestDTO = {
    ...toServiceAccountRequest(sa),
    applicationId,
    ...(typeof patch === "function" ? patch(sa) : patch),
  };
  const result = await client.serviceAccounts.updateServiceAccount(id, request);
  return { fresh: sa, request, data: result.data };
}

function applyChange(
  fresh: readonly number[],
  change: { scope: number[]; selected: number[] } | { remove: number[] },
): number[] {
  if ("remove" in change) {
    const removed = new Set(change.remove);
    return fresh.filter((id) => !removed.has(id));
  }
  return mergeScopedSelection(fresh, change.scope, change.selected);
}

function countNames(names: readonly string[] | undefined) {
  const counts = new Map<string, number>();
  for (const name of names ?? []) counts.set(name, (counts.get(name) ?? 0) + 1);
  return counts;
}

/**
 * Direct-permission removal pairs ids with names by position (see
 * `pairDirectPermissions`), which may be wrong. Confirm from the PUT
 * response: every removed name went away once, every other name stayed.
 * Counted, because a name can repeat across departments.
 */
function removalConfirmed(
  before: readonly string[] | undefined,
  after: readonly string[] | undefined,
  removed: readonly string[],
) {
  const expected = countNames(before);
  for (const name of removed) {
    expected.set(name, Math.max(0, (expected.get(name) ?? 0) - 1));
  }
  const actual = countNames(after);
  for (const [name, count] of expected) {
    if ((actual.get(name) ?? 0) !== count) return false;
  }
  return true;
}

const REMOVAL_UNCONFIRMED =
  "Não foi possível confirmar qual permissão remover. Nada foi alterado. Remova-a pelo seletor de permissões.";

export async function getServiceAccount(
  id: string,
): Promise<ActionResult<ServiceAccountDTO>> {
  const client = await getClientAccess();
  try {
    const result = await client.serviceAccounts.getServiceAccount(id);
    return { success: true, data: result.data };
  } catch (error) {
    console.error(
      "[service-account] Erro ao carregar conta de serviço:",
      error,
    );
    return { success: false, ...toActionError(error) };
  }
}

export async function createServiceAccount(
  input: ServiceAccountInput,
): Promise<ActionResult<ServiceAccountDTO>> {
  const client = await getClientAccess();
  try {
    const applicationId = await applicationOf(client, input.oauthClientId);
    const result = await client.serviceAccounts.createServiceAccount({
      ...input,
      applicationId,
    });
    return { success: true, data: result.data };
  } catch (error) {
    console.error(
      "[service-account-create] Erro ao criar conta de serviço:",
      error,
    );
    return { success: false, ...toActionError(error) };
  }
}

export async function updateServiceAccountIdentity(
  id: string,
  identity: ServiceAccountIdentity,
): Promise<ActionResult<ServiceAccountDTO>> {
  const client = await getClientAccess();
  try {
    const { data } = await putFromFresh(client, id, {
      name: identity.name,
      description: identity.description,
    });
    return { success: true, data };
  } catch (error) {
    console.error(
      "[service-account-identity] Erro ao guardar identidade:",
      error,
    );
    return { success: false, ...toActionError(error) };
  }
}

export async function setServiceAccountAccess(
  id: string,
  change: AccessChange,
): Promise<ActionResult<ServiceAccountDTO>> {
  const client = await getClientAccess();
  try {
    const { fresh, request, data } = await putFromFresh(client, id, (sa) => {
      const patch: Partial<ServiceAccountRequestDTO> = {};
      if (change.roles) {
        patch.roleIds = applyChange(sa.roleIds ?? [], change.roles);
      }
      if (change.permissions) {
        const p = change.permissions;
        patch.permissionIds = applyChange(
          sa.permissionIds ?? [],
          "remove" in p ? { remove: p.remove.map((r) => r.id) } : p,
        );
      }
      return patch;
    });
    const permissions = change.permissions;
    if (
      permissions &&
      "remove" in permissions &&
      !removalConfirmed(
        fresh.permissionNames,
        data.permissionNames,
        permissions.remove.map((r) => r.name),
      )
    ) {
      // Positional pairing guessed wrong: put the previous set back.
      await client.serviceAccounts.updateServiceAccount(id, {
        ...request,
        permissionIds: [...(fresh.permissionIds ?? [])],
      });
      return { success: false, error: REMOVAL_UNCONFIRMED };
    }
    return { success: true, data };
  } catch (error) {
    console.error("[service-account-access] Erro ao guardar acessos:", error);
    return { success: false, ...toActionError(error) };
  }
}

export type CreateWithClientResult =
  | {
      success: true;
      data: { client: OAuthClientDTO; account: ServiceAccountDTO };
    }
  | { success: false; failedStep: "client"; error: string; status?: number }
  | {
      success: false;
      failedStep: "serviceAccount";
      error: string;
      status?: number;
      /** Carries the raw clientSecret — the UI must still disclose it. */
      client: OAuthClientDTO;
    };

/**
 * Spec §3.1: POST client → POST account. If the account step fails the new
 * client (and its one-time secret) is returned so the UI can still show the
 * secret and retry `createServiceAccount` against it.
 */
export async function createServiceAccountWithNewClient(
  clientInput: OAuthClientInput,
  account: Omit<ServiceAccountInput, "oauthClientId">,
): Promise<CreateWithClientResult> {
  if (!clientInput.grantTypes.includes("client_credentials")) {
    return {
      success: false,
      failedStep: "client",
      status: 422,
      error: "Uma conta de serviço exige o grant type client_credentials.",
    };
  }
  // Before creating the client: a session that expires after the POST would
  // throw here and lose the one-time secret.
  const client = await getClientAccess();
  const created = await createOAuthClient(clientInput);
  if (!created.success) {
    return {
      success: false,
      failedStep: "client",
      error: created.error,
      status: created.status,
    };
  }
  try {
    const result = await client.serviceAccounts.createServiceAccount({
      ...account,
      oauthClientId: created.data.id,
      applicationId: created.data.applicationId,
    });
    return {
      success: true,
      data: { client: created.data, account: result.data },
    };
  } catch (error) {
    console.error(
      "[service-account-create-with-client] Cliente criado, conta falhou:",
      error,
    );
    return {
      success: false,
      failedStep: "serviceAccount",
      client: created.data,
      ...toActionError(error),
    };
  }
}

export type DeleteServiceAccountResult =
  | { success: true; data: null }
  | {
      success: false;
      failedStep: ActivationStep;
      error: string;
      status?: number;
      oauthClientId?: string;
    };

/** Spec §5.6: DELETE account → (optional) DELETE its client. */
export async function deleteServiceAccount(
  id: string,
  { alsoDeleteClient }: { alsoDeleteClient: boolean },
): Promise<DeleteServiceAccountResult> {
  const client = await getClientAccess();
  let step: ActivationStep = "serviceAccount";
  let oauthClientId: string | undefined;
  try {
    const sa = (await client.serviceAccounts.getServiceAccount(id)).data;
    oauthClientId = sa.oauthClientId;
    await client.serviceAccounts.deleteServiceAccount(id);
    if (alsoDeleteClient) {
      step = "client";
      await client.oauthClients.deleteOAuthClient(sa.oauthClientId);
    }
    return { success: true, data: null };
  } catch (error) {
    console.error(`[service-account-delete] Falhou no passo ${step}:`, error);
    return {
      success: false,
      failedStep: step,
      oauthClientId,
      ...toActionError(error),
    };
  }
}
