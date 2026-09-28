import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

/* These tests render the REAL DS IGRPSelect / IGRPCombobox (no DS mock) so
   F3/F4 regressions in filter-controls.tsx would fail here again. */

import {
  FilterCombobox,
  FilterSelect,
} from "@/features/audit/components/filter-controls";

const OPTIONS = [
  { label: "Ana Silva", value: "ana" },
  { label: "Bruno Costa", value: "bruno" },
];

describe("FilterSelect (F3 — no remount key)", () => {
  it("keeps the same trigger element across a value change from the parent", () => {
    const { container, rerender } = render(
      <FilterSelect
        id="f-select"
        label="Estado"
        options={OPTIONS}
        value={undefined}
        onChange={vi.fn()}
      />,
    );
    const before = container.querySelector('[data-slot="select-trigger"]');
    expect(before).not.toBeNull();

    rerender(
      <FilterSelect
        id="f-select"
        label="Estado"
        options={OPTIONS}
        value="ana"
        onChange={vi.fn()}
      />,
    );
    const after = container.querySelector('[data-slot="select-trigger"]');

    // Same DOM node identity: the trigger was not remounted, so focus placed
    // on it by the user survives the selection.
    expect(after).toBe(before);
  });

  it("still shows 'Todos' when value goes back to undefined", () => {
    render(
      <FilterSelect
        id="f-select"
        label="Estado"
        options={OPTIONS}
        value="ana"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Ana Silva")).toBeInTheDocument();
  });
});

describe("FilterCombobox (F4 — value missing from options)", () => {
  it("shows the raw value instead of the placeholder when it isn't in options", () => {
    render(
      <FilterCombobox
        id="f-combo"
        label="Utilizador"
        options={OPTIONS}
        value="carlos@nosi.cv"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText("carlos@nosi.cv")).toBeInTheDocument();
    expect(screen.queryByText("Todos")).not.toBeInTheDocument();
  });

  it("shows the option label when the value is in options", () => {
    render(
      <FilterCombobox
        id="f-combo"
        label="Utilizador"
        options={OPTIONS}
        value="ana"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Ana Silva")).toBeInTheDocument();
  });

  it("shows the placeholder when there is no value", () => {
    render(
      <FilterCombobox
        id="f-combo"
        label="Utilizador"
        options={OPTIONS}
        value={undefined}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Todos")).toBeInTheDocument();
  });
});
