import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

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
    IGRPIcon: () => null,
  };
});

import { ReportEmptyState } from "@/features/audit/components/report-empty-state";

describe("ReportEmptyState", () => {
  it("offers to clear filters when filters are active", async () => {
    const onClear = vi.fn();
    render(<ReportEmptyState filtered onClearFilters={onClear} />);
    expect(
      screen.getByText("Nenhum evento corresponde aos filtros"),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Limpar filtros" }),
    );
    expect(onClear).toHaveBeenCalledOnce();
  });

  it("suggests widening the period when nothing is filtered", () => {
    render(<ReportEmptyState filtered={false} onClearFilters={vi.fn()} />);
    expect(screen.getByText("Sem eventos neste período")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
