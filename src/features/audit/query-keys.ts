import type { AuditTab, ReportQuery } from "./lib/report-query";

/* Keys carry the SELECTION (preset / days, filters, page, sort) — never the
   instants derived from it. "Last 7 days" keeps one cache entry while "now"
   moves; each fetch resolves its own now. */
export const auditKeys = {
  all: ["audit"] as const,
  report: (tab: AuditTab, q: ReportQuery) =>
    [
      "audit",
      "report",
      tab,
      {
        range: q.range,
        page: q.page,
        size: q.size,
        filters: q.filters,
        sort: q.sort,
      },
    ] as const,
};
