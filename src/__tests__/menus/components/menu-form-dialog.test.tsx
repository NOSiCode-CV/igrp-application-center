// The menu form dialog on /settings/applications/[code]: titles name what is
// being created, the code follows the name until edited by hand, view mode
// only closes, and external pages have no "open in new tab" switch.

import type { IGRPMenuItemArgs } from "@igrp/framework-next-types";
import { afterEach, describe, expect, it, vi } from "vitest";

// The real design system pulls the whole lucide icon set through vitest's
// transform and exhausts the worker heap; plain elements stand in for it.
vi.mock("@igrp/igrp-framework-react-design-system", async () => {
  const { cloneElement, createContext, createElement, use } = await import(
    "react"
  );
  const { FormProvider, useController } = await import("react-hook-form");
  type Props = Record<string, unknown> & { children?: unknown };
  const NON_DOM_PROPS = new Set([
    "showIcon",
    "iconName",
    "iconPlacement",
    "variant",
    "size",
    "asChild",
    "onOpenChange",
    "onValueChange",
    "onCheckedChange",
  ]);
  const domProps = (props: Props) =>
    Object.fromEntries(
      Object.entries(props).filter(([key]) => !NON_DOM_PROPS.has(key)),
    );
  const box =
    (tag: string, fixed: Record<string, unknown> = {}) =>
    ({ children, ...rest }: Props) =>
      createElement(tag, { ...domProps(rest), ...fixed }, children as never);
  const RadioGroup = ({ children, value, onValueChange }: Props) =>
    createElement(
      "div",
      {
        role: "radiogroup",
        "data-value": value,
        onChange: (e: { target: { value: string } }) =>
          (onValueChange as (v: string) => void)(e.target.value),
      },
      children as never,
    );
  const Switch = ({ checked, onCheckedChange, id, disabled }: Props) =>
    createElement("button", {
      type: "button",
      role: "switch",
      id,
      disabled,
      "aria-checked": Boolean(checked),
      onClick: () => (onCheckedChange as (v: boolean) => void)(!checked),
    });
  const FormField = ({
    control,
    name,
    render,
  }: {
    control: never;
    name: string;
    render: (args: { field: unknown }) => unknown;
  }) => render({ field: useController({ control, name }).field }) as never;
  const OpenChange = createContext<(open: boolean) => void>(() => {});
  const closing = ({ children, onClick, ...rest }: Props) => {
    const onOpenChange = use(OpenChange);
    return createElement(
      "button",
      {
        ...domProps(rest),
        onClick: () => {
          (onClick as (() => void) | undefined)?.();
          onOpenChange(false);
        },
      },
      children as never,
    );
  };
  return {
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
    AlertDialogCancel: closing,
    AlertDialogAction: closing,
    cn: (...classes: unknown[]) => classes.filter(Boolean).join(" "),
    useIGRPToast: () => ({ igrpToast: vi.fn() }),
    IGRPIcon: () => null,
    IGRPIconList: {},
    IGRPButton: box("button"),
    Dialog: ({ open, children }: Props) => (open ? (children as never) : null),
    DialogContent: box("div", { role: "dialog" }),
    DialogHeader: box("div"),
    DialogFooter: box("div"),
    DialogTitle: box("h2"),
    DialogDescription: box("p"),
    FieldSet: box("fieldset"),
    FieldLegend: box("legend"),
    FieldSeparator: () => null,
    Form: ({ children, ...form }: Props) =>
      createElement(FormProvider as never, form, children as never),
    FormField,
    FormItem: box("div"),
    FormLabel: box("label"),
    FormControl: ({ children, ...rest }: Props) =>
      cloneElement(children as never, rest as never),
    FormDescription: box("p"),
    FormMessage: () => null,
    Input: box("input"),
    ScrollArea: box("div"),
    Switch,
    RadioGroup,
    RadioGroupItem: ({ value, id }: Props) =>
      createElement("input", { type: "radio", value, id, name: "radio" }),
  };
});

vi.mock("@/features/menus/components/menu-icon-picker", () => ({
  MenuIconPicker: () => null,
}));
vi.mock("@/features/menus/components/menu-parent-combobox", () => ({
  MenuParentCombobox: () => null,
}));
vi.mock("@/features/applications/use-applications", () => ({
  useCreateMenu: () => ({ mutateAsync: vi.fn() }),
  useUpdateMenu: () => ({ mutateAsync: vi.fn() }),
}));

import { cleanup, fireEvent, screen } from "@testing-library/react";

import { MenuFormDialog } from "@/features/menus/components/menu-form-dialog";

import { renderWithIntl } from "../../helpers/intl";

const FOLDER = {
  code: "PASTA",
  name: "Pasta Menu",
  type: "FOLDER",
  status: "ACTIVE",
  position: 0,
} as IGRPMenuItemArgs;

function renderDialog(
  props: Partial<React.ComponentProps<typeof MenuFormDialog>> = {},
) {
  return renderWithIntl(
    <MenuFormDialog
      appCode="APP"
      open
      onOpenChange={() => {}}
      setMenus={() => {}}
      allMenus={[FOLDER]}
      groupMenus={[]}
      folderMenus={[FOLDER]}
      {...props}
    />,
    { locale: "en" },
  );
}

afterEach(cleanup);

describe("MenuFormDialog", () => {
  it("names the type picked in the first step", () => {
    renderDialog();
    expect(screen.getByRole("heading", { name: "New Menu" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /^Page/ }));
    expect(screen.getByRole("heading", { name: "New page" })).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Create page" }),
    ).toBeInTheDocument();
  });

  it("derives the code from the name until the code is edited", () => {
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: /^Group/ }));
    const name = screen.getByPlaceholderText("Menu name");
    const code = screen.getByPlaceholderText("MENU_CODE");

    fireEvent.change(name, { target: { value: "Página Inicial" } });
    expect(code).toHaveValue("PAGINA_INICIAL");

    fireEvent.change(code, { target: { value: "home-1" } });
    expect(code).toHaveValue("HOME_1");

    fireEvent.change(name, { target: { value: "Página Inicial 2" } });
    expect(code).toHaveValue("HOME_1");
  });

  it("tells where an added page goes", () => {
    renderDialog({
      menu: {
        parentCode: "PASTA",
        code: "",
        name: "",
        type: "MENU_PAGE",
        status: "ACTIVE",
        applicationCode: "APP",
      } as IGRPMenuItemArgs,
    });
    expect(screen.getByRole("heading", { name: "Add page" })).toBeVisible();
    expect(
      screen.getByText("It will be added to Pasta Menu."),
    ).toBeInTheDocument();
  });

  it("drops the new-tab switch for external pages", () => {
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: /^Page/ }));
    expect(
      screen.getByRole("switch", { name: /Open in new tab/ }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("External Page"));
    expect(
      screen.queryByRole("switch", { name: /Open in new tab/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("External pages always open in a new tab."),
    ).toBeInTheDocument();
  });

  it("only offers Close in view mode", () => {
    renderDialog({ menu: FOLDER, openType: "view" });
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Create|Update/ }),
    ).not.toBeInTheDocument();
  });

  it("goes straight back when nothing was entered", () => {
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: /^Group/ }));
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "New Menu" })).toBeVisible();
  });

  it("asks before going back over entered values", () => {
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: /^Group/ }));
    fireEvent.change(screen.getByPlaceholderText("Menu name"), {
      target: { value: "Reports" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(
      screen.getByRole("heading", { name: "Discard your changes?" }),
    ).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("Menu name")).toHaveValue("Reports");

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    fireEvent.click(screen.getByRole("button", { name: "Discard" }));
    expect(screen.getByRole("heading", { name: "New Menu" })).toBeVisible();
  });

  it("previews the menu where it will sit in the tree", () => {
    renderDialog({
      menu: {
        parentCode: "PASTA",
        code: "",
        name: "",
        type: "MENU_PAGE",
        status: "ACTIVE",
        applicationCode: "APP",
      } as IGRPMenuItemArgs,
    });
    const preview = screen.getByRole("region", { name: "Preview in the menu" });
    expect(preview).toHaveTextContent("Untitled");
    expect(preview).toHaveTextContent("Pasta Menu");

    fireEvent.change(screen.getByPlaceholderText("Menu name"), {
      target: { value: "Reports" },
    });
    expect(preview).toHaveTextContent("Reports");
  });
});
