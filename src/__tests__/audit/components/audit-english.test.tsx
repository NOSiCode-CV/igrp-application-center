import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ReportQuery } from "@/features/audit/lib/report-query";

import { renderWithIntl } from "../../helpers/intl";

const QUERY: ReportQuery = {
  tab: "access",
  range: { preset: "7d" },
  page: 0,
  size: 20,
  filters: {},
};
// One state object for every render: a new one per call would re-render forever.
const STATE = [QUERY, vi.fn()] as const;

vi.mock("@/features/audit/use-audit", () => ({ useReportQuery: () => STATE }));
vi.mock("@/features/audit/components/access-report-tab", () => ({
  AccessReportTab: () => <p>access tab</p>,
}));
vi.mock("@/features/audit/components/settings-report-tab", () => ({
  SettingsReportTab: () => <p>settings tab</p>,
}));
vi.mock("@/features/audit/components/report-date-range", () => ({
  ReportDateRange: () => null,
}));
vi.mock("@igrp/igrp-framework-react-design-system", async () => ({
  ...(await vi.importActual<object>(
    "@igrp/igrp-framework-react-design-system",
  )),
  IGRPIcon: () => null,
  IGRPPageHeader: ({
    title,
    description,
  }: {
    title: string;
    description: string;
  }) => (
    <header>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  ),
  IGRPCombobox: ({ label }: { label: string }) => <span>{label}</span>,
}));

import { AuditScreen } from "@/features/audit/components/audit-screen";
import { ReportEmptyState } from "@/features/audit/components/report-empty-state";
import { ReportPager } from "@/features/audit/components/report-pager";
import { SettingsChangeDetail } from "@/features/audit/components/settings-change-detail";

describe("audit in English", () => {
  it("renders the page header and the two report tiles", () => {
    renderWithIntl(<AuditScreen />, { locale: "en" });
    expect(
      screen.getByRole("heading", { name: "Audit and Reports" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Review the sign-ins and configuration changes recorded on the platform.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("tablist", { name: "Reports" })).toBeVisible();
    expect(
      screen.getByText(
        "Who signed in to the platform and what they did in each module.",
      ),
    ).toBeVisible();
    expect(screen.getByText("Settings")).toBeVisible();
  });

  it("renders the pager in French, with the count in the plural", () => {
    renderWithIntl(
      <ReportPager
        page={0}
        size={20}
        totalPages={3}
        totalElements={45}
        onPageChange={vi.fn()}
        onSizeChange={vi.fn()}
      />,
      { locale: "fr" },
    );
    expect(
      screen.getByRole("navigation", { name: "Pagination du rapport" }),
    ).toBeVisible();
    expect(screen.getByText(/1–20 sur 45 événements/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Page suivante" })).toBeVisible();
  });

  it("renders the pager in English", () => {
    renderWithIntl(
      <ReportPager
        page={0}
        size={20}
        totalPages={1}
        totalElements={1}
        onPageChange={vi.fn()}
        onSizeChange={vi.fn()}
      />,
      { locale: "en" },
    );
    expect(screen.getByText("1 of 1 event")).toBeVisible();
    expect(screen.getByRole("button", { name: "Next page" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Last page" })).toBeVisible();
  });

  it("renders the empty state in English", () => {
    renderWithIntl(<ReportEmptyState filtered onClearFilters={vi.fn()} />, {
      locale: "en",
    });
    expect(screen.getByText("No events match the filters")).toBeVisible();
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeVisible();
  });

  it("renders the change detail in English", () => {
    renderWithIntl(
      <SettingsChangeDetail
        row={
          {
            ipAddress: "10.0.0.1",
            relatedEntity: "ADMIN",
            previousValue: "name=A",
            newValue: "name=B",
          } as never
        }
      />,
      { locale: "en" },
    );
    expect(screen.getByText("IP address:")).toBeVisible();
    expect(screen.getByText("Related entity:")).toBeVisible();
    expect(screen.getByText("Before:")).toBeInTheDocument();
  });
});
