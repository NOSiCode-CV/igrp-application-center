import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

/* F1 regression: the real IGRPDataTable applies getPaginationRowModel() and
   seeds its internal pageSize from pageSizePagination[0] (default 50, see
   node_modules/@igrp/igrp-framework-react-design-system/dist/components/
   horizon/data-table/index.js ~105-111), regardless of showPagination={false}.
   This renders the REAL DS table (no DS mock) so a regression to the default
   pageSizePagination would make this fail again. */

vi.mock("@/features/audit/use-audit", () => ({
  useAccessReport: () => LOADED,
  useRedirectOnUnauthorized: () => undefined,
}));
const USERS = { data: [] };
const APPS = { data: [] };
vi.mock("@/features/users/use-users", () => ({ useUsers: () => USERS }));
vi.mock("@/features/applications/use-applications", () => ({
  useApplications: () => APPS,
}));

import { AccessReportTab } from "@/features/audit/components/access-report-tab";
import type { ReportQuery } from "@/features/audit/lib/report-query";

const query: ReportQuery = {
  tab: "access",
  range: { preset: "7d" },
  page: 0,
  size: 100,
  filters: {},
};

const rows = Array.from({ length: 100 }, (_, i) => ({
  username: `user-${i}@nosi.cv`,
  status: "SUCCESS",
}));

const LOADED = {
  error: null,
  isPending: false,
  isError: false,
  isFetching: false,
  refetch: () => undefined,
  data: { content: rows, totalElements: 100, totalPages: 1 },
};

describe("AccessReportTab pagination (real IGRPDataTable)", () => {
  it("renders every row of a 100-row page, not just the first 50", () => {
    render(<AccessReportTab query={query} onQueryChange={() => undefined} />);

    expect(screen.getByText("user-0@nosi.cv")).toBeInTheDocument();
    expect(screen.getByText("user-49@nosi.cv")).toBeInTheDocument();
    expect(screen.getByText("user-99@nosi.cv")).toBeInTheDocument();
  });
});
