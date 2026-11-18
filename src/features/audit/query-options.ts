import { queryOptions } from "@tanstack/react-query";

import { getAccessReport, getSettingsReport } from "@/actions/audit-reports";
import { unwrap } from "@/actions/types";

import {
  type ReportQuery,
  toAccessReportFilters,
  toSettingsReportFilters,
} from "./lib/report-query";
import { auditKeys } from "./query-keys";

/* `timeZone` is the platform zone. It stays out of the query key: it is one
   value per deployment, so it never splits the cache. */
export const accessReportOptions = (
  q: ReportQuery,
  timeZone: string | undefined,
) =>
  queryOptions({
    queryKey: auditKeys.report("access", q),
    queryFn: async () =>
      unwrap(
        await getAccessReport(toAccessReportFilters(q, new Date(), timeZone)),
      ),
  });

export const settingsReportOptions = (
  q: ReportQuery,
  timeZone: string | undefined,
) =>
  queryOptions({
    queryKey: auditKeys.report("settings", q),
    queryFn: async () =>
      unwrap(
        await getSettingsReport(
          toSettingsReportFilters(q, new Date(), timeZone),
        ),
      ),
  });
