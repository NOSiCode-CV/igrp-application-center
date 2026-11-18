// Menu tree rows: child count on groups/folders, page route (a bare "#" is no
// route), and the rail elbow that ties each child to its parent.

import type { IGRPMenuItemArgs } from "@igrp/framework-next-types";
import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";
import { afterEach, describe, expect, it, vi } from "vitest";

// The real design system pulls the whole lucide icon set through vitest's
// transform and exhausts the worker heap; plain elements stand in for it.
vi.mock("@igrp/igrp-framework-react-design-system", async () => {
  const { createElement } = await import("react");
  type Props = Record<string, unknown> & { children?: unknown };
  const NON_DOM_PROPS = new Set(["asChild", "variant", "size", "align"]);
  const box =
    (tag: string) =>
    ({ children, ...rest }: Props) =>
      createElement(
        tag,
        Object.fromEntries(
          Object.entries(rest).filter(([key]) => !NON_DOM_PROPS.has(key)),
        ),
        children as never,
      );
  return {
    ...(await vi.importActual<object>(
      "@igrp/igrp-framework-react-design-system",
    )),
    cn: (...classes: unknown[]) => classes.filter(Boolean).join(" "),
    IGRPIcon: () => null,
    Badge: box("span"),
    Button: box("button"),
    DropdownMenu: box("div"),
    DropdownMenuTrigger: box("div"),
    DropdownMenuContent: () => null,
    DropdownMenuItem: box("div"),
    DropdownMenuSeparator: () => null,
  };
});

import { DndContext } from "@dnd-kit/core";
import { cleanup, screen } from "@testing-library/react";

import { SortableMenuItem } from "@/features/menus/components/menu-sortable-item";
import { MenuTreeContext } from "@/features/menus/components/menu-tree-context";

import { renderWithIntl } from "../../helpers/intl";

const MENUS = [
  { code: "FOLDER", name: "Pasta Menu", type: "FOLDER", position: 0 },
  {
    code: "P1",
    name: "Menu 1",
    type: "MENU_PAGE",
    parentCode: "FOLDER",
    url: "#",
    position: 0,
  },
  {
    code: "P2",
    name: "Menu 2",
    type: "MENU_PAGE",
    parentCode: "FOLDER",
    pageSlug: "/reports",
    position: 1,
  },
] as IGRPMenuItemArgs[];

function renderTree(locale: "en" | "pt" = "en") {
  const noop = () => {};
  return renderWithIntl(
    <DndContext>
      <MenuTreeContext
        value={{
          app: { code: "APP", type: "INTERNAL" } as ApplicationDTO,
          allMenus: MENUS,
          onView: noop,
          onEdit: noop,
          onAddInternalPage: noop,
          onAddExternalPage: noop,
        }}
      >
        <SortableMenuItem menu={MENUS[0]} />
      </MenuTreeContext>
    </DndContext>,
    { locale },
  );
}

afterEach(cleanup);

describe("SortableMenuItem", () => {
  it("shows how many menus a folder holds", () => {
    renderTree();
    expect(screen.getByText("2 items")).toBeInTheDocument();
  });

  it("pluralises the count from the catalog", () => {
    renderTree("pt");
    expect(screen.getByText("2 itens")).toBeInTheDocument();
  });

  it("shows the page route and treats a bare # as no URL", () => {
    renderTree();
    expect(screen.getByText("/reports")).toBeInTheDocument();
    expect(screen.getByText("No URL")).toBeInTheDocument();
    expect(screen.queryByText("#")).not.toBeInTheDocument();
  });

  it("ends the rail at the last child (└) and runs it past the others (├)", () => {
    renderTree();
    const rails = (name: string) => {
      const row = screen.getByText(name).closest(".group");
      return Array.from(row?.querySelectorAll("span[aria-hidden]") ?? []).map(
        (el) => el.className,
      );
    };
    expect(rails("Menu 1").some((c) => c.includes("h-full"))).toBe(true);
    expect(rails("Menu 2").some((c) => c.includes("h-1/2"))).toBe(true);
  });
});
