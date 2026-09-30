import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * These cover the four branches the catalogue can render, because the bug they
 * replace was a branch bug: a FAILED request fell through to "No applications
 * match your search", so a broken backend was indistinguishable from an empty
 * one — and told the user they had searched when they had not.
 */

const toggleGroup = vi.hoisted(() => ({
  onValueChange: undefined as ((value: string) => void) | undefined,
}));

vi.mock("@igrp/igrp-framework-react-design-system", () => ({
  // Mirrors a trap in the real component: for any `icon*` size, IGRPButton
  // DISCARDS children and renders `iconName` (default "ArrowLeft"). A mock
  // that renders children hides that, which is how three buttons shipped
  // showing a left arrow. Keep this faithful.
  IGRPButton: ({
    children,
    iconName,
    iconClassName,
    size,
    ...rest
  }: {
    children?: React.ReactNode;
    iconName?: string;
    iconClassName?: string;
    size?: string;
  } & React.ComponentProps<"button">) => (
    <button type="button" {...rest}>
      {size?.startsWith("icon") ? (
        <span data-icon={iconName ?? "ArrowLeft"} className={iconClassName} />
      ) : (
        children
      )}
    </button>
  ),
  IGRPIcon: () => null,
  Badge: ({ children }: { children?: React.ReactNode }) => (
    <span>{children}</span>
  ),
  Separator: () => null,
  // Faithful to the trap that matters: for `variant="single"` the real
  // IGRPCombobox emits "" when you pick the option that is ALREADY selected
  // (`selectedValue === currentValue ? "" : selectedValue`). A mock that
  // always echoes the clicked value would hide it, and "" cast to SortBy
  // falls through every sort branch while the trigger shows the placeholder.
  // Real IGRPLabel renders `<Label htmlFor={name ?? id}>` and returns null
  // when `label` is empty — both matter here: the sort control passes
  // `label=""` to the combobox and puts the visible label beside it instead.
  IGRPLabel: ({
    label,
    name,
    className,
  }: {
    label?: string;
    name?: string;
    className?: string;
  }) =>
    label ? (
      // Mirrors the real component, which points htmlFor at the combobox
      // wrapper's id.
      <label htmlFor={name} className={className}>
        {label}
      </label>
    ) : null,
  IGRPCombobox: ({
    label,
    options,
    value,
    onChange,
  }: {
    label?: string;
    options: { value: string; label: string }[];
    value?: string | string[];
    onChange?: (selected: string | string[]) => void;
  }) => (
    <div>
      {label ? <span>{label}</span> : null}
      {options.map((option) => (
        <button
          type="button"
          key={option.value}
          aria-pressed={option.value === value}
          onClick={() => onChange?.(option.value === value ? "" : option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  ),
  // The factory replaces the WHOLE module, so every symbol the component tree
  // imports has to be here or the import resolves to undefined at render.
  InputGroup: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
  InputGroupAddon: ({ children }: { children?: React.ReactNode }) => (
    <span>{children}</span>
  ),
  InputGroupInput: (props: React.ComponentProps<"input">) => (
    <input {...props} />
  ),
  Toggle: ({
    children,
    pressed,
    onPressedChange,
    ...rest
  }: {
    children?: React.ReactNode;
    pressed?: boolean;
    onPressedChange?: (next: boolean) => void;
  } & React.ComponentProps<"button">) => (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => onPressedChange?.(!pressed)}
      {...rest}
    >
      {children}
    </button>
  ),
  // Radix keeps the selection on the group and the value on the item, so the
  // mock has to reconnect them or clicking an item is a no-op.
  ToggleGroup: ({
    children,
    onValueChange,
  }: {
    children?: React.ReactNode;
    onValueChange?: (value: string) => void;
  }) => {
    toggleGroup.onValueChange = onValueChange;
    return <div>{children}</div>;
  },
  ToggleGroupItem: ({
    children,
    value,
    ...rest
  }: {
    children?: React.ReactNode;
    value: string;
  } & React.ComponentProps<"button">) => (
    <button
      type="button"
      onClick={() => toggleGroup.onValueChange?.(value)}
      {...rest}
    >
      {children}
    </button>
  ),
  // The list view is a real table, so these have to render real table
  // elements — `getByRole("columnheader")` and `getByRole("row")` are the
  // point of the change and a <div>-based mock would pass while the shipped
  // markup carried no table semantics at all.
  Table: ({ children, ...rest }: React.ComponentProps<"table">) => (
    <table {...rest}>{children}</table>
  ),
  TableHeader: ({ children, ...rest }: React.ComponentProps<"thead">) => (
    <thead {...rest}>{children}</thead>
  ),
  TableBody: ({ children, ...rest }: React.ComponentProps<"tbody">) => (
    <tbody {...rest}>{children}</tbody>
  ),
  TableHead: ({ children, ...rest }: React.ComponentProps<"th">) => (
    <th {...rest}>{children}</th>
  ),
  TableRow: ({ children, ...rest }: React.ComponentProps<"tr">) => (
    <tr {...rest}>{children}</tr>
  ),
  TableCell: ({ children, ...rest }: React.ComponentProps<"td">) => (
    <td {...rest}>{children}</td>
  ),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children?: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

// Hoisted to module scope so every render sees the SAME array identity — a
// fresh literal per call gives `useMemo`'s dep a new identity every render.
const NO_APPS: ApplicationDTO[] = [];
const APPS = [
  { code: "ALPHA", name: "Alpha", status: "ACTIVE", url: "https://a.test" },
  { code: "BETA", name: "Beta", status: "ACTIVE", url: "https://b.test" },
] as unknown as ApplicationDTO[];

const MIXED = [
  {
    code: "ALPHA",
    name: "Alpha",
    status: "ACTIVE",
    url: "https://a.test",
    description: "Primeira",
  },
  { code: "DEAD", name: "Dead", status: "ACTIVE", description: "Sem destino" },
] as unknown as ApplicationDTO[];

const NO_DESCRIPTION = [
  { code: "SOLO", name: "Solo", status: "ACTIVE", url: "https://s.test" },
] as unknown as ApplicationDTO[];

const refetch = vi.fn();
const appsQuery = {
  data: NO_APPS,
  isError: false,
  error: null as Error | null,
  refetch,
};

vi.mock("@/features/users/use-users", () => ({
  useCurrentUserApplications: () => appsQuery,
  useCurrentUserFavoriteApplications: () => ({ data: NO_APPS }),
  useAddCurrentUserFavoriteApplication: () => ({ mutate: vi.fn() }),
  useRemoveCurrentUserFavoriteApplication: () => ({ mutate: vi.fn() }),
}));

import { AppCatalog } from "@/features/workspace/components/home-apps/app-catalog";

beforeEach(() => {
  refetch.mockClear();
  appsQuery.data = NO_APPS;
  appsQuery.isError = false;
  appsQuery.error = null;
});

describe("AppCatalog empty and error states", () => {
  it("shows an error with a retry when the request failed", async () => {
    appsQuery.isError = true;
    appsQuery.error = new Error("Gateway timeout");
    render(<AppCatalog />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByText(/lista está temporariamente indisponível/i),
    ).toBeInTheDocument();
    // The raw SDK/browser string is a developer artefact — English, wrong
    // register, and nothing a public servant can act on.
    expect(screen.queryByText("Gateway timeout")).not.toBeInTheDocument();
    // The old copy blamed the user's input for a backend failure.
    expect(screen.queryByText(/corresponde a/i)).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /tentar novamente/i }),
    );
    expect(refetch).toHaveBeenCalledOnce();
  });

  it("distinguishes 'no access' from 'nothing matched'", () => {
    render(<AppCatalog />);

    expect(
      screen.getByText(/ainda não tem aplicações atribuídas/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText(/corresponde/i)).not.toBeInTheDocument();
  });

  it("offers a filter reset when a search hides everything", async () => {
    appsQuery.data = APPS;
    render(<AppCatalog />);

    await userEvent.type(
      screen.getByRole("searchbox", { name: /procurar aplicações/i }),
      "zzz",
    );
    expect(
      screen.getByText(/nenhuma aplicação corresponde/i),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /limpar filtros/i }),
    );
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(
      screen.queryByText(/nenhuma aplicação corresponde/i),
    ).not.toBeInTheDocument();
  });

  it("teaches the favourites gesture only when no search is hiding results", async () => {
    appsQuery.data = APPS;
    render(<AppCatalog />);

    await userEvent.click(screen.getByRole("button", { name: "Favoritos" }));
    expect(screen.getByText(/ainda sem favoritos/i)).toBeInTheDocument();

    // With a search ALSO active, the search is the real cause — telling the
    // user to click a star would send them after the wrong thing.
    await userEvent.type(
      screen.getByRole("searchbox", { name: /procurar aplicações/i }),
      "zzz",
    );
    expect(screen.queryByText(/ainda sem favoritos/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(/nenhum favorito corresponde/i),
    ).toBeInTheDocument();
  });
});

describe("AppCatalog view modes", () => {
  it("renders the list view as rows, not as one-column tiles", async () => {
    appsQuery.data = MIXED;
    render(<AppCatalog />);

    // Grid tiles carry the description as a <p>; the list view carries it in
    // a table cell. Excludes the sr-only live region, which is also a <p>.
    const descriptions = () =>
      document.querySelectorAll("p:not([role='status'])");
    expect(descriptions().length).toBeGreaterThan(0);

    await userEvent.click(
      screen.getByRole("button", { name: /vista em lista/i }),
    );
    expect(descriptions()).toHaveLength(0);
    // Same apps, different layout — not a different set.
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Dead")).toBeInTheDocument();
    // The copy survives the switch, it just stops being a paragraph.
    expect(screen.getByText("Primeira")).toBeInTheDocument();
  });

  it("gives the list view real table semantics and one row per app", async () => {
    appsQuery.data = MIXED;
    render(<AppCatalog />);

    // The grid is not a table, so nothing should claim to be one yet.
    expect(screen.queryByRole("table")).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /vista em lista/i }),
    );

    expect(screen.getByRole("table")).toBeInTheDocument();
    for (const name of [
      "Aplicação",
      "Código",
      "Descrição",
      "Estado",
      "Favorito",
    ]) {
      expect(screen.getByRole("columnheader", { name })).toBeInTheDocument();
    }
    // Header row plus one row per app — the columns exist because the data
    // fills them, not as empty chrome.
    expect(screen.getAllByRole("row")).toHaveLength(MIXED.length + 1);
    expect(screen.getByRole("cell", { name: "ALPHA" })).toBeInTheDocument();

    // The name is the link, and it warns that an external app leaves the
    // portal. `Dead` has no launch URL, so it must NOT be a link — a row that
    // looks clickable and does nothing is the defect this column replaced.
    expect(
      screen.getByRole("link", { name: "Alpha (abre num novo separador)" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Dead/ }),
    ).not.toBeInTheDocument();
  });

  it("does not assert a description it does not have", async () => {
    appsQuery.data = NO_DESCRIPTION;
    render(<AppCatalog />);
    await userEvent.click(
      screen.getByRole("button", { name: /vista em lista/i }),
    );

    // An em dash, not "Sem descrição" — `Solo` carries no `description`.
    expect(screen.getAllByRole("cell", { name: "—" })).toHaveLength(1);
    expect(screen.queryByText(/sem descrição/i)).not.toBeInTheDocument();
  });

  it("warns about a missing launch URL in both variants", async () => {
    appsQuery.data = MIXED;
    render(<AppCatalog />);
    expect(screen.getByText(/sem url definido/i)).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /vista em lista/i }),
    );
    // The old compact row omitted this, so a dead app looked launchable. The
    // table carries it in the Estado column, in the same words.
    expect(screen.getByText(/sem url definido/i)).toBeInTheDocument();
  });
});

describe("AppCatalog sort control", () => {
  it("labels the order control once instead of in every option", () => {
    appsQuery.data = APPS;
    render(<AppCatalog />);

    expect(screen.getByText("Ordenar por:")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Predefinido" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    // The word used to be repeated inside all four option labels.
    expect(screen.queryByText(/Ordenar: /)).not.toBeInTheDocument();
  });

  it("keeps an order selected when the active option is picked again", async () => {
    appsQuery.data = APPS;
    render(<AppCatalog />);

    await userEvent.click(screen.getByRole("button", { name: "Nome (A–Z)" }));
    expect(screen.getByRole("button", { name: "Nome (A–Z)" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    // The combobox emits "" here. Accepting it would leave the catalogue with
    // no order and the control with no selection.
    await userEvent.click(screen.getByRole("button", { name: "Nome (A–Z)" }));
    expect(screen.getByRole("button", { name: "Nome (A–Z)" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});

describe("AppCatalog keyboard access", () => {
  it("focuses the search box on /", async () => {
    appsQuery.data = APPS;
    render(<AppCatalog />);

    const search = screen.getByRole("searchbox", {
      name: /procurar aplicações/i,
    });
    expect(search).not.toHaveFocus();

    await userEvent.keyboard("/");
    expect(search).toHaveFocus();
  });

  it("does not hijack / while the user is typing", async () => {
    appsQuery.data = APPS;
    render(<AppCatalog />);

    const search = screen.getByRole("searchbox", {
      name: /procurar aplicações/i,
    });
    await userEvent.click(search);
    await userEvent.keyboard("a/b");

    // The slash has to reach the field, not be swallowed as a shortcut.
    expect(search).toHaveValue("a/b");
  });
});

describe("AppCatalog assistive announcements", () => {
  it("announces the filtered result count", async () => {
    appsQuery.data = APPS;
    render(<AppCatalog />);

    const live = document.querySelector("[role='status']");
    expect(live).toHaveTextContent("");

    await userEvent.type(
      screen.getByRole("searchbox", { name: /procurar aplicações/i }),
      "alp",
    );
    // Debounced, so it speaks once the user pauses rather than per keystroke.
    await waitFor(() =>
      expect(live).toHaveTextContent(/1 de 2 aplicações correspondem/i),
    );
  });

  it("says nothing while no filter is active", async () => {
    appsQuery.data = APPS;
    render(<AppCatalog />);

    const live = document.querySelector("[role='status']");
    await new Promise((r) => setTimeout(r, 400));
    expect(live).toHaveTextContent("");
  });
});

describe("AppCatalog icon buttons", () => {
  it("names the icon for every icon-only button", () => {
    appsQuery.data = APPS;
    render(<AppCatalog />);

    // IGRPButton drops children at `icon*` sizes and falls back to
    // "ArrowLeft", so a missing `iconName` ships a left arrow where a star
    // or a chevron belongs.
    for (const button of screen.getAllByRole("button", {
      name: /favoritos$/i,
    })) {
      const icon = button.querySelector("[data-icon]");
      if (icon) expect(icon).toHaveAttribute("data-icon", "Star");
    }
    expect(document.querySelectorAll('[data-icon="ArrowLeft"]')).toHaveLength(
      0,
    );
  });
});

describe("AppTileCard content", () => {
  it("shows the app code beneath the name", () => {
    appsQuery.data = MIXED;
    render(<AppCatalog />);

    // The code is how the app is identified in admin screens and support
    // calls, so the card has to carry it, not just the display name.
    expect(screen.getByText("ALPHA")).toBeInTheDocument();
    expect(screen.getByText("DEAD")).toBeInTheDocument();
    expect(screen.getByText("Alpha")).toBeInTheDocument();
  });

  it("says so when an app has no description", () => {
    appsQuery.data = NO_DESCRIPTION;
    render(<AppCatalog />);

    // Rendering nothing let cards collapse to different heights and left the
    // reader unsure whether the description was missing or just empty.
    expect(screen.getByText("Sem descrição")).toBeInTheDocument();
  });
});
