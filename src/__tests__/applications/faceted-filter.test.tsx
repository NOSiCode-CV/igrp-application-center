import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

type MockProps = {
  children?: React.ReactNode;
  disabled?: boolean;
  checked?: boolean;
  onClick?: () => void;
  onCheckedChange?: (next: boolean) => void;
};

vi.mock("@igrp/igrp-framework-react-design-system", () => {
  const React = require("react");
  return {
    Button: ({ children, disabled, ...rest }: MockProps) =>
      React.createElement(
        "button",
        { type: "button", disabled, ...rest },
        children,
      ),
    IGRPIcon: () => null,
    DropdownMenu: ({ children }: MockProps) =>
      React.createElement(React.Fragment, null, children),
    DropdownMenuTrigger: ({ children }: MockProps) =>
      React.createElement(React.Fragment, null, children),
    DropdownMenuContent: ({ children }: MockProps) =>
      React.createElement("div", { role: "menu" }, children),
    DropdownMenuCheckboxItem: ({
      children,
      checked,
      onCheckedChange,
    }: MockProps) =>
      React.createElement(
        "div",
        {
          role: "menuitemcheckbox",
          "aria-checked": checked ? "true" : "false",
          "aria-label": typeof children === "string" ? children : undefined,
          onClick: () => onCheckedChange?.(!checked),
        },
        children,
      ),
    DropdownMenuItem: ({ children, onClick }: MockProps) =>
      React.createElement("div", { role: "menuitem", onClick }, children),
    DropdownMenuSeparator: () => null,
  };
});

import { FacetedFilter } from "@/components/data-table/faceted-filter";

const OPTIONS = [
  { value: "ACTIVE", label: "Ativo" },
  { value: "INACTIVE", label: "Inativo" },
];

describe("FacetedFilter", () => {
  it("calls onChange when toggling an option", async () => {
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
    await user.click(screen.getByRole("button", { name: /Estado/i }));
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Ativo" }));
    expect(onChange).toHaveBeenCalledWith(["ACTIVE"]);
  });

  it("renders count when value is non-empty", () => {
    render(
      <FacetedFilter
        label="Estado"
        options={OPTIONS}
        value={["ACTIVE", "INACTIVE"]}
        onChange={() => {}}
      />,
    );
    expect(
      screen.getByRole("button", { name: /Estado \(2\)/ }),
    ).toBeInTheDocument();
  });
});
