"use server";

import type {
  AuditLogDTO,
  AuditLogFilters,
  PageResponse,
} from "@igrp/platform-access-management-client-ts";

import { toActionError } from "@/lib/app-utilities";

import { getClientAccess } from "./access-client";
import type { ActionResult } from "./types";

export async function getUserAuditLogs(
  userId: string,
  filters?: AuditLogFilters,
): Promise<ActionResult<PageResponse<AuditLogDTO>>> {
  const client = await getClientAccess();

  try {
    const result = await client.authAudit.listAuditLogs({ ...filters, userId });
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[user-audit] Erro ao carregar logs de auditoria:", error);
    return { success: false, ...toActionError(error) };
  }
}
