// "Add page" on a folder opens the menu form with the hierarchy fixed to that
// folder: parent type FOLDER, the folder selected, and both controls disabled.

import type { IGRPMenuItemArgs } from "@igrp/framework-next-types";
import { afterEach, describe, expect, it, vi } from "vitest";

// The real design system pulls the whole lucide icon set through vitest's
// transform and exhausts the worker heap; plain elements stand in for it.
vi.mock("@igrp/igrp-framework-react-design-system", async () => {
  const { cloneElement, createElement } = await import("react");
  const { useController } = await import("react-hook-form");
  type Props = Record<string, unknown> & { children?: unknown };
  const NON_DOM_PROPS = new Set([
    "asChild",
    "iconName",
    "variant",
    "align",
    "onValueChange",
    "onSelect",
  ]);
  const domProps = (props: Props) =>
    Object.fromEntries(
      Object.entries(props).filter(([key]) => !NON_DOM_PROPS.has(key)),
    );
  const box =
    (tag: string) =>
    ({ children, ...rest }: Props) =>
      createElement(tag, domProps(rest), children as never);
  const RadioGroup = ({ children, value, disabled, className }: Props) =>
    createElement(
      "div",
      {
        role: "radiogroup",
        "data-value": value,
        "aria-disabled": disabled ? "true" : undefined,
        className,
      },
      children as never,
    );
  const FormField = ({
    control,
    name,
    render,
  }: {
    control: never;
    name: string;
    render: (args: { field: unknown }) => unknown;
  }) => render({ field: useController({ control, name }).field }) as never;
  return {
    cn: (...classes: unknown[]) => classes.filter(Boolean).join(" "),
    IGRPIcon: () => null,
    Button: box("button"),
    Command: box("div"),
    CommandEmpty: box("div"),
    CommandGroup: box("div"),
    CommandInput: () => null,
    CommandItem: box("div"),
    CommandList: box("div"),
    CommandSeparator: () => null,
    FormControl: ({ children, ...rest }: Props) =>
      cloneElement(children as never, rest as never),
    FormField,
    FormItem: box("div"),
    FormLabel: box("label"),
    FormMessage: () => null,
    Popover: ({ children }: Props) => children as never,
    // Radix `asChild` merges the trigger's props (incl. `disabled`) into the child.
    PopoverTrigger: ({ children, disabled }: Props) =>
      cloneElement(children as never, { disabled } as never),
    PopoverContent: () => null,
    RadioGroup,
    RadioGroupItem: () => null,
  };
});

import { cleanup, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";

import { MenuParentCombobox } from "@/features/menus/components/menu-parent-combobox";
import type { CreateMenu } from "@/features/menus/menu-schemas";

import { renderWithIntl } from "../../helpers/intl";

const GROUPS = [
  { code: "GROUP_A", name: "Group A", type: "GROUP" },
] as IGRPMenuItemArgs[];
const FOLDERS = [
  { code: "FOLDER_A", name: "Folder A", type: "FOLDER", parentCode: "GROUP_A" },
] as IGRPMenuItemArgs[];

function Harness({
  parentCode,
  locked,
}: {
  parentCode?: string;
  locked?: boolean;
}) {
  const form = useForm<CreateMenu>({
    defaultValues: { type: "MENU_PAGE", parentCode } as CreateMenu,
  });
  return (
    <FormProvider {...form}>
      <MenuParentCombobox
        control={form.control}
        menuType="MENU_PAGE"
        groupOptions={GROUPS}
        folderOptions={FOLDERS}
        locked={locked}
      />
      <output data-testid="parent">{form.watch("parentCode") ?? ""}</output>
    </FormProvider>
  );
}

afterEach(cleanup);

describe("MenuParentCombobox", () => {
  it("opens on the FOLDER parent type with the folder selected", () => {
    renderWithIntl(<Harness parentCode="FOLDER_A" />, { locale: "en" });
    expect(screen.getByRole("radiogroup")).toHaveAttribute(
      "data-value",
      "FOLDER",
    );
    expect(screen.getByRole("combobox")).toHaveTextContent("Folder A");
    expect(screen.getByTestId("parent")).toHaveTextContent("FOLDER_A");
  });

  it("disables the hierarchy when it is locked to the folder", () => {
    renderWithIntl(<Harness parentCode="FOLDER_A" locked />, { locale: "en" });
    expect(screen.getByRole("radiogroup")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByRole("combobox")).toBeDisabled();
    expect(screen.getByTestId("parent")).toHaveTextContent("FOLDER_A");
  });

  it("opens on the GROUP parent type for a page added to a group", () => {
    renderWithIntl(<Harness parentCode="GROUP_A" locked />, { locale: "en" });
    expect(screen.getByRole("radiogroup")).toHaveAttribute(
      "data-value",
      "GROUP",
    );
    expect(screen.getByRole("combobox")).toHaveTextContent("Group A");
  });
});
