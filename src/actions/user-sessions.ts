"use server";

import type { SessionResponseDTO } from "@igrp/platform-access-management-client-ts";

import { callApi } from "./call-api";
import type { ActionResult } from "./types";

export async function getUserSession(
  userExternalId: string,
): Promise<ActionResult<SessionResponseDTO>> {
  return callApi(
    "[user-session] Erro ao carregar sessão do utilizador:",
    (client) => client.adminSessions.getUserSession(userExternalId),
  );
}

export async function killUserSession(
  sessionId: string,
  reason: string,
): Promise<ActionResult<void>> {
  return callApi("[user-session] Erro ao terminar sessão:", async (client) => {
    await client.adminSessions.killSession(sessionId, {
      reason,
      killedBy: "admin",
    });
    return { data: undefined };
  });
}
