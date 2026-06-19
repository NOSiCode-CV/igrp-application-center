import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

type MockProps = {
  children?: React.ReactNode;
  [key: string]: unknown;
};

vi.mock("@igrp/igrp-framework-react-design-system", () => {
  const React = require("react");
  return {
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
});
