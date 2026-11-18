"use server";

import type {
  OAuthClientDTO,
  OAuthClientRequestDTO,
} from "@igrp/platform-access-management-client-ts";

import {
  type OAuthClientInput,
  withActive,
} from "@/features/oauth-clients/lib/oauth-client-request";
import { toActionError } from "@/lib/utilities";

import { getClientAccess } from "./access-client";
import { callApi } from "./call-api";
import type { AccessClient, ActionResult } from "./types";

function withoutSecret(dto: OAuthClientDTO): OAuthClientDTO {
  const { clientSecret: _secret, ...rest } = dto;
  return rest;
}

class UnknownApplicationError extends Error {
  // Escaped so a CR/LF in the caller's code cannot forge server log lines.
  constructor(code: string) {
    super(
      `A aplicação «${JSON.stringify(String(code)).slice(1, -1)}» não existe.`,
    );
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
  return callApi(
    "[oauth-clients] Erro ao carregar clientes OAuth:",
    async (client) => ({
      data: (await client.oauthClients.listOAuthClients()).data.map(
        withoutSecret,
      ),
    }),
  );
}

export async function getOAuthClient(
  id: string,
): Promise<ActionResult<OAuthClientDTO>> {
  return callApi(
    "[oauth-client] Erro ao carregar cliente OAuth:",
    async (client) => ({
      data: withoutSecret((await client.oauthClients.getOAuthClient(id)).data),
    }),
  );
}

/** Carries the raw clientSecret (as does rotateOAuthClientSecret). Never cache it. */
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

/**
 * New secret for an existing client. `id` and `clientId` stay, the old secret
 * stops working at once, issued tokens stay valid until they expire. Like
 * createOAuthClient, the data carries the raw clientSecret: never cache it.
 */
export async function rotateOAuthClientSecret(
  id: string,
): Promise<ActionResult<OAuthClientDTO>> {
  return callApi(
    "[oauth-client-rotate] Erro ao gerar novo segredo do cliente OAuth:",
    (client) => client.oauthClients.rotateOAuthClientSecret(id),
  );
}

export async function deleteOAuthClient(
  id: string,
): Promise<ActionResult<null>> {
  return callApi(
    "[oauth-client-delete] Erro ao eliminar cliente OAuth:",
    async (client) => {
      await client.oauthClients.deleteOAuthClient(id);
      return { data: null };
    },
  );
}

/** Full-replacement PUT built from the freshly loaded client. */
export async function setOAuthClientActive(
  id: string,
  active: boolean,
): Promise<ActionResult<OAuthClientDTO>> {
  return callApi(
    "[oauth-client-active] Erro ao alterar estado do cliente OAuth:",
    async (client) => {
      const current = await client.oauthClients.getOAuthClient(id);
      const result = await client.oauthClients.updateOAuthClient(
        id,
        withActive(current.data, active),
      );
      return { data: withoutSecret(result.data) };
    },
  );
}
