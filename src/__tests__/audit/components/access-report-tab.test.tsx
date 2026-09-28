import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseAccessReport = vi.fn();

vi.mock("@/features/audit/use-audit", () => ({
  useAccessReport: (q: unknown) => mockUseAccessReport(q),
  useRedirectOnUnauthorized: () => undefined,
}));
const USERS = { data: [] };
const APPS = { data: [] };
vi.mock("@/features/users/use-users", () => ({ useUsers: () => USERS }));
vi.mock("@/features/applications/use-applications", () => ({
  useApplications: () => APPS,
}));

vi.mock("@igrp/igrp-framework-react-design-system", () => {
  const Pass = ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  );
  return {
    Button: ({
      children,
      onClick,
    }: {
      children?: React.ReactNode;
      onClick?: () => void;
    }) => (
      <button type="button" onClick={onClick}>
        {children}
      </button>
    ),
    Empty: Pass,
    EmptyContent: Pass,
    EmptyDescription: Pass,
    EmptyHeader: Pass,
    EmptyMedia: Pass,
    EmptyTitle: Pass,
    IGRPBadge: Pass,
    IGRPCombobox: () => null,
    IGRPDataTable: ({ data }: { data: { username?: string }[] }) => (
      <table>
        <tbody>
          {data.map((r) => (
            <tr key={r.username}>
              <td>{r.username}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    IGRPDataTableHeaderDefault: ({ title }: { title: string }) => (
      <span>{title}</span>
    ),
    IGRPIcon: () => null,
    IGRPSelect: () => null,
    Input: () => null,
    Label: Pass,
    Skeleton: () => <div data-testid="skeleton" />,
  };
});
vi.mock("@/components/inline-error", () => ({
  InlineError: ({
    title,
    onRetry,
  }: {
    title?: string;
    onRetry?: () => void;
  }) => (
    <button type="button" onClick={onRetry}>
      {title}
    </button>
  ),
}));

import { AccessReportTab } from "@/features/audit/components/access-report-tab";
import type { ReportQuery } from "@/features/audit/lib/report-query";

const query: ReportQuery = {
  tab: "access",
  range: { preset: "7d" },
  page: 0,
  size: 20,
  filters: { status: "ACCESS_DENIED" },
};

const LOADED = {
  error: null,
  isPending: false,
  isError: false,
  isFetching: false,
  refetch: vi.fn(),
  data: {
    content: [{ username: "ana@nosi.cv", status: "ACCESS_DENIED" }],
    totalElements: 1,
    totalPages: 1,
  },
};
const EMPTY = {
  ...LOADED,
  data: { content: [], totalElements: 0, totalPages: 0 },
};
const FAILED = { ...LOADED, isError: true, data: undefined, refetch: vi.fn() };

beforeEach(() => vi.clearAllMocks());

describe("AccessReportTab", () => {
  it("renders the page of rows", () => {
    mockUseAccessReport.mockReturnValue(LOADED);
    render(<AccessReportTab query={query} onQueryChange={vi.fn()} />);
    expect(screen.getByText("ana@nosi.cv")).toBeInTheDocument();
    expect(screen.getByText("1 evento")).toBeInTheDocument();
  });

  it("offers to clear filters on an empty filtered page", async () => {
    mockUseAccessReport.mockReturnValue(EMPTY);
    const onQueryChange = vi.fn();
    render(<AccessReportTab query={query} onQueryChange={onQueryChange} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Limpar filtros" }),
    );
    expect(onQueryChange).toHaveBeenCalledWith({ ...query, filters: {} });
  });

  it("shows an inline error with retry", async () => {
    mockUseAccessReport.mockReturnValue(FAILED);
    render(<AccessReportTab query={query} onQueryChange={vi.fn()} />);
    await userEvent.click(
      screen.getByRole("button", {
        name: "Não foi possível carregar o relatório de acessos.",
      }),
    );
    expect(FAILED.refetch).toHaveBeenCalled();
  });
});
