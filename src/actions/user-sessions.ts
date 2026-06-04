"use server";

import type { SessionResponseDTO } from "@igrp/platform-access-management-client-ts";

import { extractApiError } from "@/lib/utilities";

import { getClientAccess } from "./access-client";
import type { ActionResult } from "./types";

export async function getUserSession(
  userExternalId: string,
): Promise<ActionResult<SessionResponseDTO>> {
  const client = await getClientAccess();

  try {
    const result = await client.adminSessions.getUserSession(userExternalId);
    return { success: true, data: result.data };
  } catch (error) {
    console.error(
      "[user-session] Erro ao carregar sessão do utilizador:",
      error,
    );
    return { success: false, error: extractApiError(error) };
  }
}

export async function killUserSession(
  sessionId: string,
  reason: string,
): Promise<ActionResult<void>> {
  const client = await getClientAccess();

  try {
    await client.adminSessions.killSession(sessionId, {
      reason,
      killedBy: "admin",
    });
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[user-session] Erro ao terminar sessão:", error);
    return { success: false, error: extractApiError(error) };
  }
}
