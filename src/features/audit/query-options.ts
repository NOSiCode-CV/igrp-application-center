import { queryOptions } from "@tanstack/react-query";

import { getAccessReport, getSettingsReport } from "@/actions/audit-reports";
import { unwrap } from "@/actions/types";

import {
  type ReportQuery,
  toAccessReportFilters,
  toSettingsReportFilters,
} from "./lib/report-query";
import { auditKeys } from "./query-keys";

export const accessReportOptions = (q: ReportQuery) =>
  queryOptions({
    queryKey: auditKeys.report("access", q),
    queryFn: async () =>
      unwrap(await getAccessReport(toAccessReportFilters(q, new Date()))),
  });

export const settingsReportOptions = (q: ReportQuery) =>
  queryOptions({
    queryKey: auditKeys.report("settings", q),
    queryFn: async () =>
      unwrap(await getSettingsReport(toSettingsReportFilters(q, new Date()))),
  });
