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
  IGRPCombobox: () => <div data-testid="page-size" />,
}));

import {
  pageWindow,
  ReportPager,
} from "@/features/audit/components/report-pager";

const props = {
  size: 20,
  totalPages: 3,
  totalElements: 42,
  onPageChange: vi.fn(),
  onSizeChange: vi.fn(),
};

describe("ReportPager", () => {
  it("shows which rows are on screen and the current page", () => {
    render(<ReportPager {...props} page={1} />);
    expect(screen.getByText("21–40 de 42 eventos")).toBeInTheDocument();
    expect(screen.getByText("Página 2 de 3")).toBeInTheDocument();
  });

  it("stops the range at the total on the last page", () => {
    render(<ReportPager {...props} page={2} />);
    expect(screen.getByText("41–42 de 42 eventos")).toBeInTheDocument();
  });

  it("disables 'first' and 'previous' on the first page and moves forward", async () => {
    const onPageChange = vi.fn();
    render(<ReportPager {...props} page={0} onPageChange={onPageChange} />);
    expect(
      screen.getByRole("button", { name: "Primeira página" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Página anterior" }),
    ).toBeDisabled();
    await userEvent.click(
      screen.getByRole("button", { name: "Página seguinte" }),
    );
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("disables 'next' and 'last' on the last page", () => {
    render(<ReportPager {...props} page={2} />);
    expect(
      screen.getByRole("button", { name: "Página seguinte" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Última página" }),
    ).toBeDisabled();
  });

  it("jumps to a numbered page and to the last page", async () => {
    const onPageChange = vi.fn();
    render(<ReportPager {...props} page={0} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Página 3" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
    await userEvent.click(
      screen.getByRole("button", { name: "Última página" }),
    );
    expect(onPageChange).toHaveBeenLastCalledWith(2);
  });

  it("uses the singular for one event", () => {
    render(
      <ReportPager {...props} page={0} totalPages={1} totalElements={1} />,
    );
    expect(screen.getByText("1 de 1 evento")).toBeInTheDocument();
  });
});

describe("pageWindow", () => {
  it("lists every page when there are few", () => {
    expect(pageWindow(0, 3)).toEqual([0, 1, 2]);
    expect(pageWindow(4, 7)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("keeps first, last and the current page's neighbours, with gaps", () => {
    expect(pageWindow(0, 20)).toEqual([0, 1, 2, 3, 4, "gap", 19]);
    expect(pageWindow(10, 20)).toEqual([0, "gap", 9, 10, 11, "gap", 19]);
    expect(pageWindow(19, 20)).toEqual([0, "gap", 15, 16, 17, 18, 19]);
  });
});
