import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

type MockProps = {
  children?: React.ReactNode;
  disabled?: boolean;
  checked?: boolean;
  onSelect?: () => void;
  onCheckedChange?: (next: boolean) => void;
  [key: string]: unknown;
};

/**
 * The filter is now built from Popover + Command + Checkbox, the same
 * primitives the design system's own faceted filter uses on /settings/users.
 * The popover is stubbed open so the option rows are always in the tree.
 */
vi.mock("@igrp/igrp-framework-react-design-system", () => {
  const React = require("react");
  const passthrough = ({ children }: MockProps) =>
    React.createElement(React.Fragment, null, children);

  return {
    Button: ({ children, disabled }: MockProps) =>
      React.createElement("button", { type: "button", disabled }, children),
    IGRPIcon: () => null,
    Separator: () => null,
    IGRPBadge: ({ children }: MockProps) =>
      React.createElement("span", null, children),
    Popover: passthrough,
    PopoverTrigger: passthrough,
    PopoverContent: ({ children }: MockProps) =>
      React.createElement("div", null, children),
    Command: passthrough,
    CommandList: passthrough,
    CommandGroup: passthrough,
    CommandSeparator: () => null,
    CommandEmpty: () => null,
    CommandItem: ({ children, onSelect }: MockProps) =>
      React.createElement("div", { onClick: onSelect }, children),
    Checkbox: ({ checked, onCheckedChange, ...rest }: MockProps) =>
      React.createElement("input", {
        type: "checkbox",
        checked: Boolean(checked),
        onChange: () => onCheckedChange?.(!checked),
        ...rest,
      }),
  };
});

import { FacetedFilter } from "@/components/data-table/faceted-filter";

const OPTIONS = [
  { value: "ACTIVE", label: "Ativo" },
  { value: "INACTIVE", label: "Inativo" },
];

describe("FacetedFilter", () => {
  it("calls onChange when checking an option", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <FacetedFilter
        label="Estado"
        options={OPTIONS}
        value={[]}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole("checkbox", { name: "Ativo" }));
    expect(onChange).toHaveBeenCalledWith(["ACTIVE"]);
  });

  it("removes an option that is already selected", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <FacetedFilter
        label="Estado"
        options={OPTIONS}
        value={["ACTIVE", "INACTIVE"]}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole("checkbox", { name: "Ativo" }));
    expect(onChange).toHaveBeenCalledWith(["INACTIVE"]);
  });

  it("shows the number of selected options in the trigger", () => {
    render(
      <FacetedFilter
        label="Estado"
        options={OPTIONS}
        value={["ACTIVE", "INACTIVE"]}
        onChange={() => {}}
      />,
    );
    expect(
      screen.getByRole("button", { name: /Estado\s*2/ }),
    ).toBeInTheDocument();
  });

  // The count is a fact about the data; when the caller does not supply it the
  // filter says nothing rather than rendering a zero it cannot vouch for.
  it("omits per-option counts when none are provided", () => {
    render(
      <FacetedFilter
        label="Estado"
        options={OPTIONS}
        value={[]}
        onChange={() => {}}
      />,
    );
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("renders per-option counts when provided", () => {
    render(
      <FacetedFilter
        label="Estado"
        options={OPTIONS}
        value={[]}
        onChange={() => {}}
        counts={{ ACTIVE: 7, INACTIVE: 2 }}
      />,
    );
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});
