import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

type MockProps = {
  children?: React.ReactNode;
  [key: string]: unknown;
};

vi.mock("@igrp/igrp-framework-react-design-system", () => {
  const React = require("react");
  return {
    IGRPButton: ({ children, ...props }: MockProps) =>
      React.createElement("button", { type: "button", ...props }, children),
    IGRPIcon: (props: MockProps) =>
      React.createElement("span", { "data-icon": true, ...props }),
    Input: (props: MockProps) => React.createElement("input", { ...props }),
  };
});

// FacetedFilter pulls in the dropdown primitives; stub it out — not under test here.
vi.mock("@/components/data-table/faceted-filter", () => ({
  FacetedFilter: () => null,
}));

import { ApplicationsToolbar } from "@/features/applications/components/applications-toolbar";

describe("ApplicationsToolbar", () => {
  const baseProps = {
    searchTerm: "",
    onSearchChange: () => {},
    statusFilter: [],
    onStatusFilterChange: () => {},
    onClearFilters: () => {},
  };

  it("exposes an accessible name for the search field", () => {
    render(<ApplicationsToolbar {...baseProps} />);
    expect(
      screen.getByRole("searchbox", { name: /pesquisar aplicações/i }),
    ).toBeInTheDocument();
  });

  it("disables the search field when disabled", () => {
    render(<ApplicationsToolbar {...baseProps} disabled />);
    expect(screen.getByRole("searchbox")).toBeDisabled();
  });

  it("hides the clear button while the search is empty", () => {
    render(<ApplicationsToolbar {...baseProps} />);
    expect(
      screen.queryByRole("button", { name: /limpar pesquisa/i }),
    ).not.toBeInTheDocument();
  });

  it("clears the search term when the clear button is pressed", async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    render(
      <ApplicationsToolbar
        {...baseProps}
        searchTerm="portal"
        onSearchChange={onSearchChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /limpar pesquisa/i }));

    expect(onSearchChange).toHaveBeenCalledWith("");
  });

  it("clears the search term on Escape", async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    render(
      <ApplicationsToolbar
        {...baseProps}
        searchTerm="portal"
        onSearchChange={onSearchChange}
      />,
    );

    await user.type(screen.getByRole("searchbox"), "{Escape}");

    expect(onSearchChange).toHaveBeenCalledWith("");
  });

  it("keeps the clear button hidden while the toolbar is disabled", () => {
    render(<ApplicationsToolbar {...baseProps} searchTerm="portal" disabled />);
    expect(
      screen.queryByRole("button", { name: /limpar pesquisa/i }),
    ).not.toBeInTheDocument();
  });

  it("hides the clear button while nothing is filtered", () => {
    render(<ApplicationsToolbar {...baseProps} />);
    expect(
      screen.queryByRole("button", { name: /^limpar$/i }),
    ).not.toBeInTheDocument();
  });

  it("drops the search term and the status selection in one press", async () => {
    const user = userEvent.setup();
    const onClearFilters = vi.fn();
    render(
      <ApplicationsToolbar
        {...baseProps}
        searchTerm="portal"
        statusFilter={["ACTIVE"]}
        onClearFilters={onClearFilters}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^limpar$/i }));

    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });
});
