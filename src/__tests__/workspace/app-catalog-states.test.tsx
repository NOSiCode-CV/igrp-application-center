import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";
import { render, screen } from "@testing-library/react";
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
  IGRPButton: ({
    children,
    ...rest
  }: { children?: React.ReactNode } & React.ComponentProps<"button">) => (
    <button type="button" {...rest}>
      {children}
    </button>
  ),
  IGRPIcon: () => null,
  Badge: ({ children }: { children?: React.ReactNode }) => (
    <span>{children}</span>
  ),
  Separator: () => null,
  IGRPDropdownMenu: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
  IGRPDropdownMenuTrigger: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
  IGRPDropdownMenuContent: () => null,
  IGRPDropdownMenuRadioGroup: () => null,
  IGRPDropdownMenuRadioItem: () => null,
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
    expect(screen.getByText("Gateway timeout")).toBeInTheDocument();
    // The old copy blamed the user's input for a backend failure.
    expect(screen.queryByText(/corresponde/i)).not.toBeInTheDocument();

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

    // Grid tiles carry the description as a <p>; compact rows do not.
    expect(document.querySelectorAll("p").length).toBeGreaterThan(0);

    await userEvent.click(
      screen.getByRole("button", { name: /vista em lista/i }),
    );
    expect(document.querySelectorAll("p")).toHaveLength(0);
    // Same apps, different layout — not a different set.
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Dead")).toBeInTheDocument();
    // The copy survives the switch, it just stops being a paragraph.
    expect(screen.getByText("Primeira")).toBeInTheDocument();
  });

  it("warns about a missing launch URL in both variants", async () => {
    appsQuery.data = MIXED;
    render(<AppCatalog />);
    expect(screen.getByText(/sem url definido/i)).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /vista em lista/i }),
    );
    // The compact row used to omit this, so a dead app looked launchable.
    expect(screen.getByText(/sem url definido/i)).toBeInTheDocument();
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
