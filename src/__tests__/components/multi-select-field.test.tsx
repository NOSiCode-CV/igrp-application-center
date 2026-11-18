import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { MultiSelectField } from "@/components/multi-select-field";

const options = [
  { value: "ADMIN", label: "Administrador" },
  { value: "VIEWER", label: "Consulta" },
];

describe("MultiSelectField — controlled mode outside IGRPForm", () => {
  // cmdk scrolls the active item into view; jsdom does not implement it.
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("renders without an IGRPForm provider", () => {
    render(
      <MultiSelectField options={options} value={[]} onChange={vi.fn()} />,
    );

    expect(screen.getByRole("combobox").textContent).toContain(
      "Selecione as opções",
    );
  });

  it("echoes the selected options as removable chips", async () => {
    const onChange = vi.fn();
    render(
      <MultiSelectField
        options={options}
        value={["ADMIN"]}
        onChange={onChange}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Remover Administrador" }),
    );

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("closes the dropdown from the check button, keeping the selection", async () => {
    const onChange = vi.fn();
    render(
      <MultiSelectField
        options={options}
        value={["ADMIN"]}
        onChange={onChange}
      />,
    );

    const trigger = screen.getByRole("combobox");
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(screen.getByRole("button", { name: "Concluir" }));

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(onChange).not.toHaveBeenCalled();
  });
});
