import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MultiSelectField } from "@/components/multi-select-field";

const options = [
  { value: "ADMIN", label: "Administrador" },
  { value: "VIEWER", label: "Consulta" },
];

describe("MultiSelectField — controlled mode outside IGRPForm", () => {
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
});
