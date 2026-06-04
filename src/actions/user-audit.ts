"use server";

import type {
  AuditLogFilters,
  PageResponse,
  SecurityAuditLogDTO,
} from "@igrp/platform-access-management-client-ts";

import { extractApiError } from "@/lib/utilities";

import { getClientAccess } from "./access-client";
import type { ActionResult } from "./types";

export async function getUserAuditLogs(
  userId: string,
  filters?: AuditLogFilters,
): Promise<ActionResult<PageResponse<SecurityAuditLogDTO>>> {
  const client = await getClientAccess();

  try {
    const result = await client.authAudit.getAuditLogsByUserId(userId, filters);
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[user-audit] Erro ao carregar logs de auditoria:", error);
    return { success: false, error: extractApiError(error) };
  }
}
