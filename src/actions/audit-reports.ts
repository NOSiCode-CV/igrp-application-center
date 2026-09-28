"use server";

import { igrpAuthorize } from "@igrp/framework-next";
import type {
  AccessReportFilters,
  AccessReportRowDTO,
  PageResponse,
  SettingsReportFilters,
  SettingsReportRowDTO,
} from "@igrp/platform-access-management-client-ts";

import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZES,
} from "@/features/audit/lib/report-query";
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

/* The UI never sends a `size` outside PAGE_SIZES, but a direct action call
   (or a future caller) can request any size; clamp it to the allowed list
   before it reaches the SDK. A caller that omits `size` entirely is left
   alone — the SDK/API default applies, same as before this fix. */
function clampSize<T extends { size?: number }>(filters: T): T {
  if (
    filters.size === undefined ||
    (PAGE_SIZES as readonly number[]).includes(filters.size)
  ) {
    return filters;
  }
  return { ...filters, size: DEFAULT_PAGE_SIZE };
}

export async function getAccessReport(
  filters: AccessReportFilters,
): Promise<ActionResult<PageResponse<AccessReportRowDTO>>> {
  if (!(await igrpAuthorize(AUDIT_VIEW_PERMISSION))) return FORBIDDEN;
  const client = await getClientAccess();

  try {
    const result = await client.auditReports.getAccessReport(
      clampSize(filters),
    );
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
    const result = await client.auditReports.getSettingsReport(
      clampSize(filters),
    );
    return { success: true, data: result.data };
  } catch (error) {
    console.error(
      "[audit-reports] Erro ao carregar o relatório de configurações:",
      error,
    );
    return { success: false, ...toActionError(error) };
  }
}
