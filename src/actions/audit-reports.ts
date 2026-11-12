"use server";

import { igrpAuthorize } from "@igrp/framework-next";
import type {
  AccessReportFilters,
  AccessReportRowDTO,
  PageResponse,
  SettingsReportFilters,
  SettingsReportRowDTO,
} from "@igrp/platform-access-management-client-ts";
import { getTranslations } from "next-intl/server";

import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZES,
} from "@/features/audit/lib/report-query";
import { AUDIT_VIEW_PERMISSION } from "@/lib/constants";

import { callApi } from "./call-api";
import type { ActionResult } from "./types";

/* The page guard is navigation; these checks are the enforcement in front of
   the SDK call (docs/PERMISSIONS.md). The AM API enforces again. */
async function forbidden() {
  const t = await getTranslations("errors.actions");
  return { success: false as const, error: t("auditForbidden"), status: 403 };
}

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
  if (!(await igrpAuthorize(AUDIT_VIEW_PERMISSION))) return forbidden();
  return callApi(
    "[audit-reports] Erro ao carregar o relatório de acessos:",
    (client) => client.auditReports.getAccessReport(clampSize(filters)),
  );
}

export async function getSettingsReport(
  filters: SettingsReportFilters,
): Promise<ActionResult<PageResponse<SettingsReportRowDTO>>> {
  if (!(await igrpAuthorize(AUDIT_VIEW_PERMISSION))) return forbidden();
  return callApi(
    "[audit-reports] Erro ao carregar o relatório de configurações:",
    (client) => client.auditReports.getSettingsReport(clampSize(filters)),
  );
}
