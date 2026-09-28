import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@igrp/igrp-framework-react-design-system", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    "aria-label": ariaLabel,
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    "aria-label"?: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  ),
  IGRPIcon: () => null,
  IGRPSelect: () => <div data-testid="page-size" />,
}));

import { ReportPager } from "@/features/audit/components/report-pager";

const props = {
  size: 20,
  totalPages: 3,
  totalElements: 42,
  onPageChange: vi.fn(),
  onSizeChange: vi.fn(),
};

describe("ReportPager", () => {
  it("shows the total and the current page", () => {
    render(<ReportPager {...props} page={0} />);
    expect(screen.getByText("42 eventos")).toBeInTheDocument();
    expect(screen.getByText("Página 1 de 3")).toBeInTheDocument();
  });

  it("disables 'previous' on the first page and moves forward", async () => {
    const onPageChange = vi.fn();
    render(<ReportPager {...props} page={0} onPageChange={onPageChange} />);
    expect(
      screen.getByRole("button", { name: "Página anterior" }),
    ).toBeDisabled();
    await userEvent.click(
      screen.getByRole("button", { name: "Página seguinte" }),
    );
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("disables 'next' on the last page", () => {
    render(<ReportPager {...props} page={2} />);
    expect(
      screen.getByRole("button", { name: "Página seguinte" }),
    ).toBeDisabled();
  });

  it("uses the singular for one event", () => {
    render(
      <ReportPager {...props} page={0} totalPages={1} totalElements={1} />,
    );
    expect(screen.getByText("1 evento")).toBeInTheDocument();
  });
});
