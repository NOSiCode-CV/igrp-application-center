import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

/* F5 regression: rows are keyed by index and IGRPDataTable hardcodes
   autoResetExpanded: false (node_modules/@igrp/igrp-framework-react-design-
   system/dist/components/horizon/data-table/index.js ~202). With
   keepPreviousData the table instance survives a page/filter change, so an
   expanded row index stayed expanded, now showing a different event's diff.
   This renders the REAL DS table (no DS mock) so a regression to an
   unkeyed table would make this fail again. */

let current = pageOne();

vi.mock("@/features/audit/use-audit", () => ({
  useSettingsReport: () => current,
  useRedirectOnUnauthorized: () => undefined,
}));
const USERS = { data: [] };
vi.mock("@/features/users/use-users", () => ({ useUsers: () => USERS }));

import { SettingsReportTab } from "@/features/audit/components/settings-report-tab";
import type { ReportQuery } from "@/features/audit/lib/report-query";

function row(id: string, previousValue: string) {
  return {
    id,
    timestamp: "2026-09-23T10:00:00Z",
    performedBy: "ana@nosi.cv",
    area: "USERS",
    operation: "UPDATE",
    entityType: "USER",
    entityName: id,
    previousValue,
    newValue: "new-value",
    relatedEntity: null,
  };
}

function pageOne() {
  return {
    error: null,
    isPending: false,
    isError: false,
    isFetching: false,
    refetch: () => undefined,
    data: {
      content: [row("entity-a", "page-one-old-value")],
      totalElements: 2,
      totalPages: 2,
    },
  };
}

function pageTwo() {
  return {
    error: null,
    isPending: false,
    isError: false,
    isFetching: false,
    refetch: () => undefined,
    data: {
      content: [row("entity-b", "page-two-old-value")],
      totalElements: 2,
      totalPages: 2,
    },
  };
}

const baseQuery: ReportQuery = {
  tab: "settings",
  range: { preset: "7d" },
  page: 0,
  size: 20,
  filters: {},
};

describe("SettingsReportTab expanded row (real IGRPDataTable)", () => {
  it("does not keep a row expanded after the page changes", async () => {
    current = pageOne();
    const { rerender } = render(
      <SettingsReportTab query={baseQuery} onQueryChange={() => undefined} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Ver detalhes" }));
    expect(screen.getByText("page-one-old-value")).toBeInTheDocument();

    current = pageTwo();
    rerender(
      <SettingsReportTab
        query={{ ...baseQuery, page: 1 }}
        onQueryChange={() => undefined}
      />,
    );

    expect(screen.queryByText("page-one-old-value")).not.toBeInTheDocument();
    expect(screen.queryByText("page-two-old-value")).not.toBeInTheDocument();
  });
});
