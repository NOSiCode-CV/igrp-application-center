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

  it("keeps a tick after a rerender with the same items/selectedIds references", async () => {
    const STABLE_SELECTED_IDS: number[] = [1];
    const props = {
      open: true,
      onOpenChange: () => {},
      title: "Atribuir perfis",
      description: "d",
      departmentCode: "INV",
      onDepartmentChange: () => {},
      items: ITEMS,
      isLoading: false,
      isError: false,
      selectedIds: STABLE_SELECTED_IDS,
      onConfirm: vi.fn(),
      isSaving: false,
      confirmLabel: "Guardar perfis",
    };
    const { rerender } = render(<ScopedPickerDialog {...props} />);
    await userEvent.click(screen.getByRole("checkbox", { name: /INV.admin/ }));
    expect(screen.getByRole("checkbox", { name: /INV.admin/ })).toBeChecked();

    // Same object references for `items` and `selectedIds` (as a stable
    // empty/unchanged array would be) — a re-render here must not re-seed
    // the selection and wipe the tick the admin just made.
    rerender(<ScopedPickerDialog {...props} />);

    expect(screen.getByRole("checkbox", { name: /INV.reader/ })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /INV.admin/ })).toBeChecked();
  });

  it("keeps ticks when an account refetch hands over a new selectedIds array", async () => {
    const props = {
      open: true,
      onOpenChange: () => {},
      title: "Atribuir perfis",
      description: "d",
      departmentCode: "INV",
      onDepartmentChange: () => {},
      items: ITEMS,
      isLoading: false,
      isError: false,
      selectedIds: [1],
      onConfirm: vi.fn(),
      isSaving: false,
      confirmLabel: "Guardar perfis",
    };
    const { rerender } = render(<ScopedPickerDialog {...props} />);
    await userEvent.click(screen.getByRole("checkbox", { name: /INV.reader/ }));
    await userEvent.click(screen.getByRole("checkbox", { name: /INV.admin/ }));

    // Same content, new reference — what a detail refetch produces.
    rerender(<ScopedPickerDialog {...props} selectedIds={[1]} />);

    expect(
      screen.getByRole("checkbox", { name: /INV.reader/ }),
    ).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: /INV.admin/ })).toBeChecked();
  });

  it("re-seeds from selectedIds when the department's items change", async () => {
    const props = {
      open: true,
      onOpenChange: () => {},
      title: "Atribuir perfis",
      description: "d",
      departmentCode: "INV",
      onDepartmentChange: () => {},
      items: ITEMS,
      isLoading: false,
      isError: false,
      selectedIds: [1],
      onConfirm: vi.fn(),
      isSaving: false,
      confirmLabel: "Guardar perfis",
    };
    const { rerender } = render(<ScopedPickerDialog {...props} />);
    await userEvent.click(screen.getByRole("checkbox", { name: /INV.admin/ }));
    rerender(
      <ScopedPickerDialog
        {...props}
        departmentCode="HR"
        items={[
          { id: 1, label: "HR.reader" },
          { id: 4, label: "HR.admin" },
        ]}
      />,
    );
    expect(screen.getByRole("checkbox", { name: /HR.reader/ })).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: /HR.admin/ }),
    ).not.toBeChecked();
  });
});
