"use server";

import { igrpAuthorize } from "@igrp/framework-next";
import type {
  AccessReportFilters,
  AccessReportRowDTO,
  PageResponse,
  SettingsReportFilters,
  SettingsReportRowDTO,
} from "@igrp/platform-access-management-client-ts";

import { toActionError } from "@/lib/app-utilities";
import { AUDIT_VIEW_PERMISSION } from "@/lib/constants";

import { getClientAccess } from "./access-client";
import type { ActionResult } from "./types";

/* The page guard is navigation; these checks are the enforcement in front of
   the SDK call (docs/PERMISSIONS.md). The AM API enforces again. */
const FORBIDDEN = {
  success: false,
  error: "Não tem permissão para consultar a auditoria.",
  status: 403,
} as const;

export async function getAccessReport(
  filters: AccessReportFilters,
): Promise<ActionResult<PageResponse<AccessReportRowDTO>>> {
  if (!(await igrpAuthorize(AUDIT_VIEW_PERMISSION))) return FORBIDDEN;
  const client = await getClientAccess();

  try {
    const result = await client.auditReports.getAccessReport(filters);
    return { success: true, data: result.data };
  } catch (error) {
    console.error(
      "[audit-reports] Erro ao carregar o relatório de acessos:",
      error,
    );
    return { success: false, ...toActionError(error) };
  }
}

export async function getSettingsReport(
  filters: SettingsReportFilters,
): Promise<ActionResult<PageResponse<SettingsReportRowDTO>>> {
  if (!(await igrpAuthorize(AUDIT_VIEW_PERMISSION))) return FORBIDDEN;
  const client = await getClientAccess();

  try {
    const result = await client.auditReports.getSettingsReport(filters);
    return { success: true, data: result.data };
  } catch (error) {
    console.error(
      "[audit-reports] Erro ao carregar o relatório de configurações:",
      error,
    );
    return { success: false, ...toActionError(error) };
  }
}
