// Deleting a menu: the dialog shows the subtree that goes away, asks for the
// name only when other menus go with it, closes only once the delete
// succeeded, and stays open when it fails.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The real design system pulls the whole lucide icon set through vitest's
// transform and exhausts the worker heap; plain elements stand in for it.
vi.mock("@igrp/igrp-framework-react-design-system", async () => {
  const { createContext, createElement, use } = await import("react");
  type Props = Record<string, unknown> & { children?: unknown };
  const NON_DOM_PROPS = new Set([
    "showIcon",
    "iconName",
    "variant",
    "size",
    "onOpenChange",
  ]);
  const domProps = (props: Props) =>
    Object.fromEntries(
      Object.entries(props).filter(([key]) => !NON_DOM_PROPS.has(key)),
    );
  const box =
    (tag: string, fixed: Record<string, unknown> = {}) =>
    ({ children, ...rest }: Props) =>
      createElement(tag, { ...domProps(rest), ...fixed }, children as never);
  const OpenChange = createContext<(open: boolean) => void>(() => {});
  return {
    cn: (...classes: unknown[]) => classes.filter(Boolean).join(" "),
    useIGRPToast: () => ({ igrpToast: toast }),
    IGRPIcon: () => null,
    IGRPButton: box("button"),
    AlertDialog: ({ open, onOpenChange, children }: Props) =>
      open
        ? createElement(
            OpenChange.Provider,
            { value: onOpenChange as never },
            children as never,
          )
        : null,
    AlertDialogContent: box("div", { role: "alertdialog" }),
    AlertDialogHeader: box("div"),
    AlertDialogFooter: box("div"),
    AlertDialogTitle: box("h2"),
    AlertDialogDescription: box("p"),
    AlertDialogCancel: ({ children, ...rest }: Props) => {
      const onOpenChange = use(OpenChange);
      return createElement(
        "button",
        { ...domProps(rest), onClick: () => onOpenChange(false) },
        children as never,
      );
    },
    Input: box("input"),
    Label: box("label"),
  };
});

const { toast, deleteMenu } = vi.hoisted(() => ({
  toast: vi.fn(),
  deleteMenu: vi.fn(),
}));
vi.mock("@/features/applications/use-applications", () => ({
  useDeleteMenu: () => ({ mutateAsync: deleteMenu, isPending: false }),
}));

import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";

import {
  MenuDeleteDialog,
  type MenuDeleteTarget,
} from "@/features/menus/components/menu-delete-dialog";

import { renderWithIntl } from "../../helpers/intl";

const PAGE: MenuDeleteTarget = {
  code: "HOME",
  name: "Home",
  type: "MENU_PAGE",
  children: [],
};

const FOLDER: MenuDeleteTarget = {
  code: "PASTA",
  name: "Pasta Menu",
  type: "FOLDER",
  children: Array.from({ length: 6 }, (_, i) => ({
    code: `P${i + 1}`,
    name: `Menu ${i + 1}`,
    type: "MENU_PAGE",
  })),
};

function renderDialog(
  menuToDelete: MenuDeleteTarget,
  locale: "en" | "pt" = "en",
) {
  const onOpenChange = vi.fn();
  renderWithIntl(
    <MenuDeleteDialog
      appCode="APP"
      open
      onOpenChange={onOpenChange}
      menuToDelete={menuToDelete}
    />,
    { locale },
  );
  return { onOpenChange };
}

beforeEach(() => {
  toast.mockReset();
  deleteMenu.mockReset();
});
afterEach(cleanup);

describe("MenuDeleteDialog", () => {
  it("deletes a page with one click and closes", async () => {
    deleteMenu.mockResolvedValue({ success: true, data: "HOME" });
    const { onOpenChange } = renderDialog(PAGE);

    expect(
      screen.getByRole("heading", { name: "Delete this page?" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Delete page" }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(deleteMenu).toHaveBeenCalledWith({
      appCode: "APP",
      menuCode: "HOME",
    });
  });

  it("shows what a folder takes with it and collapses the rest", () => {
    renderDialog(FOLDER);
    const contents = screen.getByRole("list", { name: "Contains 6 menus" });
    expect(contents).toHaveTextContent("Menu 1");
    expect(contents).toHaveTextContent("Menu 4");
    expect(contents).not.toHaveTextContent("Menu 5");
    expect(contents).toHaveTextContent("and 2 more");
  });

  it("asks for the name before deleting a folder with menus", () => {
    renderDialog(FOLDER);
    const button = screen.getByRole("button", { name: "Delete folder" });
    expect(button).toBeDisabled();

    fireEvent.change(screen.getByLabelText("To confirm, type Pasta Menu"), {
      target: { value: "Pasta Menu" },
    });
    expect(button).toBeEnabled();
  });

  it("stays open and reports the error when the delete fails", async () => {
    deleteMenu.mockResolvedValue({ success: false, error: "Menu in use" });
    const { onOpenChange } = renderDialog(PAGE);
    fireEvent.click(screen.getByRole("button", { name: "Delete page" }));
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ type: "error", description: "Menu in use" }),
      ),
    );
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("closes from Cancel", () => {
    const { onOpenChange } = renderDialog(PAGE);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("reads from the pt catalog", () => {
    renderDialog(FOLDER, "pt");
    expect(
      screen.getByRole("heading", { name: "Eliminar esta pasta?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: "Contém 6 menus" }),
    ).toHaveTextContent("e mais 2");
  });
});
