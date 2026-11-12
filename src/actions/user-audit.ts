"use server";

import type {
  AuditLogDTO,
  AuditLogFilters,
  PageResponse,
} from "@igrp/platform-access-management-client-ts";

import { callApi } from "./call-api";
import type { ActionResult } from "./types";

export async function getUserAuditLogs(
  userId: string,
  filters?: AuditLogFilters,
): Promise<ActionResult<PageResponse<AuditLogDTO>>> {
  return callApi("[user-audit] Erro ao carregar logs de auditoria:", (client) =>
    client.authAudit.listAuditLogs({ ...filters, userId }),
  );
}
