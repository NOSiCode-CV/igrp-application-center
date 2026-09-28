import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ReportQuery } from "@/features/audit/lib/report-query";

const setQuery = vi.fn();
const QUERY: ReportQuery = {
  tab: "access",
  range: { preset: "30d" },
  page: 3,
  size: 20,
  filters: { status: "SUCCESS" },
};
const STATE = [QUERY, setQuery] as const;

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
vi.mock("@igrp/igrp-framework-react-design-system", () => {
  const Pass = ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  );
  return {
    IGRPPageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
    Tabs: ({
      children,
      onValueChange,
    }: {
      children?: React.ReactNode;
      onValueChange?: (v: string) => void;
    }) => (
      <div>
        <button type="button" onClick={() => onValueChange?.("settings")}>
          switch
        </button>
        {children}
      </div>
    ),
    TabsContent: Pass,
    TabsList: Pass,
    TabsTrigger: ({ children }: { children?: React.ReactNode }) => (
      <span>{children}</span>
    ),
  };
});

import { AuditScreen } from "@/features/audit/components/audit-screen";

beforeEach(() => vi.clearAllMocks());

describe("AuditScreen", () => {
  it("renders only the active tab", () => {
    render(<AuditScreen />);
    expect(
      screen.getByRole("heading", { name: "Auditoria e Relatórios" }),
    ).toBeInTheDocument();
    expect(screen.getByText("access tab")).toBeInTheDocument();
    expect(screen.queryByText("settings tab")).not.toBeInTheDocument();
  });

  it("switching tab keeps the range and clears filters and page", async () => {
    render(<AuditScreen />);
    await userEvent.click(screen.getByRole("button", { name: "switch" }));
    expect(setQuery).toHaveBeenCalledWith({
      ...QUERY,
      tab: "settings",
      page: 0,
      filters: {},
    });
  });
});
