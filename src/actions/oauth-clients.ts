"use server";

import type {
  OAuthClientDTO,
  OAuthClientRequestDTO,
} from "@igrp/platform-access-management-client-ts";

import {
  type OAuthClientInput,
  withActive,
} from "@/features/oauth-clients/lib/oauth-client-request";
import { toActionError } from "@/lib/app-utilities";

import { getClientAccess } from "./access-client";
import type { AccessClient, ActionResult } from "./types";

function withoutSecret(dto: OAuthClientDTO): OAuthClientDTO {
  const { clientSecret: _secret, ...rest } = dto;
  return rest;
}

class UnknownApplicationError extends Error {
  constructor(readonly code: string) {
    super(`A aplicação «${code}» não existe.`);
  }
}

/**
 * The UI names applications by code; the SDK request wants the numeric id.
 * Same lookup as getApplicationByCode in ./applications.ts.
 */
async function toSdkRequest(
  client: AccessClient,
  { applicationCode, ...rest }: OAuthClientInput,
): Promise<OAuthClientRequestDTO> {
  if (!applicationCode) return { ...rest, applicationId: undefined };
  const result = await client.applications.getApplications({
    code: applicationCode,
  });
  const app = result.data.find((a) => a.code === applicationCode);
  if (!app) throw new UnknownApplicationError(applicationCode);
  return { ...rest, applicationId: app.id };
}

function failure(error: unknown) {
  if (error instanceof UnknownApplicationError) {
    return { success: false as const, status: 422, error: error.message };
  }
  return { success: false as const, ...toActionError(error) };
}

export async function listOAuthClients(): Promise<
  ActionResult<OAuthClientDTO[]>
> {
  const client = await getClientAccess();
  try {
    const result = await client.oauthClients.listOAuthClients();
    return { success: true, data: result.data.map(withoutSecret) };
  } catch (error) {
    console.error("[oauth-clients] Erro ao carregar clientes OAuth:", error);
    return { success: false, ...toActionError(error) };
  }
}

export async function getOAuthClient(
  id: string,
): Promise<ActionResult<OAuthClientDTO>> {
  const client = await getClientAccess();
  try {
    const result = await client.oauthClients.getOAuthClient(id);
    return { success: true, data: withoutSecret(result.data) };
  } catch (error) {
    console.error("[oauth-client] Erro ao carregar cliente OAuth:", error);
    return { success: false, ...toActionError(error) };
  }
}

/** The ONLY action whose data carries the raw clientSecret. Never cache it. */
export async function createOAuthClient(
  input: OAuthClientInput,
): Promise<ActionResult<OAuthClientDTO>> {
  const client = await getClientAccess();
  try {
    const request = await toSdkRequest(client, input);
    const result = await client.oauthClients.createOAuthClient(request);
    return { success: true, data: result.data };
  } catch (error) {
    console.error(
      "[oauth-client-create] Erro ao registar cliente OAuth:",
      error,
    );
    return failure(error);
  }
}

export async function updateOAuthClient(
  id: string,
  input: OAuthClientInput,
): Promise<ActionResult<OAuthClientDTO>> {
  const client = await getClientAccess();
  try {
    const request = await toSdkRequest(client, input);
    const result = await client.oauthClients.updateOAuthClient(id, request);
    return { success: true, data: withoutSecret(result.data) };
  } catch (error) {
    console.error(
      "[oauth-client-update] Erro ao atualizar cliente OAuth:",
      error,
    );
    return failure(error);
  }
}

export async function deleteOAuthClient(
  id: string,
): Promise<ActionResult<null>> {
  const client = await getClientAccess();
  try {
    await client.oauthClients.deleteOAuthClient(id);
    return { success: true, data: null };
  } catch (error) {
    console.error(
      "[oauth-client-delete] Erro ao eliminar cliente OAuth:",
      error,
    );
    return { success: false, ...toActionError(error) };
  }
}

/** Full-replacement PUT built from the freshly loaded client. */
export async function setOAuthClientActive(
  id: string,
  active: boolean,
): Promise<ActionResult<OAuthClientDTO>> {
  const client = await getClientAccess();
  try {
    const current = await client.oauthClients.getOAuthClient(id);
    const result = await client.oauthClients.updateOAuthClient(
      id,
      withActive(current.data, active),
    );
    return { success: true, data: withoutSecret(result.data) };
  } catch (error) {
    console.error(
      "[oauth-client-active] Erro ao alterar estado do cliente OAuth:",
      error,
    );
    return { success: false, ...toActionError(error) };
  }
}
