// The menus section of /settings/applications/[code] renders from the
// `menus` catalog in every platform language (docs/I18N.md, "Migrating the
// next feature").

import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";
import { afterEach, describe, expect, it, vi } from "vitest";

// The real design system pulls the whole lucide icon set through vitest's
// transform (IGRPIcon / IGRPIconList) and exhausts the worker heap, so the
// pieces these components render are replaced by plain elements.
vi.mock("@igrp/igrp-framework-react-design-system", async () => {
  const { createElement } = await import("react");
  type Props = Record<string, unknown> & { children?: unknown };
  const NON_DOM_PROPS = new Set([
    "showIcon",
    "iconName",
    "iconPlacement",
    "variant",
    "size",
    "asChild",
    "open",
    "onOpenChange",
    "strokeWidth",
  ]);
  const domProps = (props: Props) =>
    Object.fromEntries(
      Object.entries(props).filter(([key]) => !NON_DOM_PROPS.has(key)),
    );
  const box =
    (tag: string, fixed: Record<string, unknown> = {}) =>
    ({ children, ...rest }: Props) =>
      createElement(tag, { ...domProps(rest), ...fixed }, children as never);
  const Dialog = ({ open, children }: Props) =>
    open ? (children as never) : null;
  return {
    ...(await vi.importActual<object>(
      "@igrp/igrp-framework-react-design-system",
    )),
    cn: (...classes: unknown[]) => classes.filter(Boolean).join(" "),
    useIGRPToast: () => ({ igrpToast: vi.fn() }),
    IGRPIcon: () => null,
    Badge: box("span"),
    Button: box("button"),
    IGRPButton: box("button"),
    Card: box("div"),
    CardTitle: box("h2"),
    CardDescription: box("p"),
    Dialog,
    DialogContent: box("div", { role: "dialog" }),
    DialogHeader: box("div"),
    DialogFooter: box("div"),
    DialogTitle: box("h2"),
    DialogDescription: box("p"),
    Input: box("input"),
    Label: box("label"),
  };
});

vi.mock("@/components/button-link", () => ({ ButtonLink: () => null }));

// Never rendered while the form dialog is closed; stubbed so their own
// design-system imports are not resolved against the mock above.
vi.mock("@/features/menus/components/menu-form-dialog", () => ({
  MenuFormDialog: () => null,
}));
vi.mock("@/features/menus/components/menu-sortable-item", () => ({
  SortableMenuItem: () => null,
}));

// `data` must keep one reference across renders, as React Query's does:
// MenuList re-sorts into state whenever it changes.
const { NO_MENUS } = vi.hoisted(() => ({ NO_MENUS: [] as never[] }));
vi.mock("@/features/applications/use-applications", () => ({
  useMenus: () => ({ data: NO_MENUS, isLoading: false, error: null }),
  useUpdateMenu: () => ({ mutateAsync: vi.fn() }),
  useCreateMenu: () => ({ mutateAsync: vi.fn() }),
  useDeleteMenu: () => ({ mutateAsync: vi.fn() }),
}));

import { cleanup, screen } from "@testing-library/react";

import { MenuList } from "@/features/menus/components/menu-list";
import { MenuTypeSelector } from "@/features/menus/components/menu-type-selector";

import { renderWithIntl } from "../../helpers/intl";

const app = { code: "APP", name: "App", type: "INTERNAL" } as ApplicationDTO;

afterEach(cleanup);

describe("MenuList i18n", () => {
  it("renders the empty state from the pt catalog by default", () => {
    renderWithIntl(<MenuList app={app} />);
    expect(screen.getByText("Menus da Aplicação")).toBeInTheDocument();
    expect(screen.getByText("Nenhum menu encontrado")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Criar Primeiro Menu/ }),
    ).toBeInTheDocument();
  });

  it("renders the empty state in English", () => {
    renderWithIntl(<MenuList app={app} />, { locale: "en" });
    expect(screen.getByText("Application Menus")).toBeInTheDocument();
    expect(screen.getByText("No menus found")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Create First Menu/ }),
    ).toBeInTheDocument();
  });

  it("offers no create action on a system application", () => {
    renderWithIntl(
      <MenuList
        app={{ ...app, type: "SYSTEM" } as unknown as ApplicationDTO}
      />,
      { locale: "en" },
    );
    expect(
      screen.getByText(
        "Menus of system applications are managed by the platform.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Create First Menu/ }),
    ).not.toBeInTheDocument();
  });

  it("renders the empty state in French", () => {
    renderWithIntl(<MenuList app={app} />, { locale: "fr" });
    expect(screen.getByText("Menus de l’application")).toBeInTheDocument();
    expect(screen.getByText("Aucun menu trouvé")).toBeInTheDocument();
  });
});

describe("MenuTypeSelector i18n", () => {
  it("labels the three types from the catalog", () => {
    renderWithIntl(<MenuTypeSelector value="GROUP" onChange={() => {}} />, {
      locale: "en",
    });
    expect(screen.getByText("Group")).toBeInTheDocument();
    expect(screen.getByText("Folder")).toBeInTheDocument();
    expect(screen.getByText("Page")).toBeInTheDocument();
    expect(
      screen.getByText("Groups folders and menus at the top level"),
    ).toBeInTheDocument();
  });
});
