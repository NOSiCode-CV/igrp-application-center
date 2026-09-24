import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const DEPTS = {
  data: [{ code: "INV", name: "Faturação" }],
  isLoading: false,
  error: null,
};
vi.mock("@/features/departments/use-departments", () => ({
  useDepartments: () => DEPTS,
}));

import { ScopedPickerDialog } from "@/features/service-accounts/components/scoped-picker-dialog";

const ITEMS = [
  { id: 1, label: "INV.reader", description: "Lê faturas" },
  { id: 2, label: "INV.exporter" },
  { id: 3, label: "INV.admin" },
];

describe("ScopedPickerDialog", () => {
  it("preselects current items and confirms the department's selection", async () => {
    const onConfirm = vi.fn();
    render(
      <ScopedPickerDialog
        open
        onOpenChange={() => {}}
        title="Atribuir perfis"
        description="d"
        departmentCode="INV"
        onDepartmentChange={() => {}}
        items={ITEMS}
        isLoading={false}
        isError={false}
        selectedIds={[1, 99]}
        onConfirm={onConfirm}
        isSaving={false}
        confirmLabel="Guardar perfis"
      />,
    );
    expect(screen.getByRole("checkbox", { name: /INV.reader/ })).toBeChecked();
    await userEvent.click(screen.getByRole("checkbox", { name: /INV.reader/ }));
    await userEvent.click(screen.getByRole("checkbox", { name: /INV.admin/ }));
    await userEvent.type(screen.getByLabelText("Filtrar"), "exp");
    expect(
      screen.queryByRole("checkbox", { name: /INV.admin/ }),
    ).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Guardar perfis" }),
    );
    expect(onConfirm).toHaveBeenCalledWith({
      scopeIds: [1, 2, 3],
      selectedIds: [3],
    });
  });
});
