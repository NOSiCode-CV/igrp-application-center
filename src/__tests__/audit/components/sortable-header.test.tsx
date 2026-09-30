import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@igrp/igrp-framework-react-design-system", () => ({
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
  IGRPIcon: ({ iconName }: { iconName: string }) => (
    <span data-testid="icon">{iconName}</span>
  ),
}));

import { SortableHeader } from "@/features/audit/components/sortable-header";

describe("SortableHeader", () => {
  it("asks for its field when clicked", async () => {
    const onSort = vi.fn();
    render(<SortableHeader title="IP" field="ipAddress" onSort={onSort} />);
    await userEvent.click(screen.getByRole("button", { name: /IP/ }));
    expect(onSort).toHaveBeenCalledWith("ipAddress");
    expect(screen.getByTestId("icon")).toHaveTextContent("ArrowUpDown");
  });

  it("shows and announces the direction only for the sorted column", () => {
    const { rerender } = render(
      <SortableHeader
        title="Estado"
        field="status"
        sort={{ field: "status", direction: "desc" }}
        onSort={vi.fn()}
      />,
    );
    expect(screen.getByTestId("icon")).toHaveTextContent("ChevronDown");
    expect(screen.getByRole("button")).toHaveTextContent("ordem decrescente");

    rerender(
      <SortableHeader
        title="Estado"
        field="status"
        sort={{ field: "role", direction: "asc" }}
        onSort={vi.fn()}
      />,
    );
    expect(screen.getByTestId("icon")).toHaveTextContent("ArrowUpDown");
  });
});
