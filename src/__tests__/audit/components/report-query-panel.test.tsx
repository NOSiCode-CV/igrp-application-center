import type { ReactNode } from "react";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createTranslator } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  PanelOpenContext,
  queryLabel,
  ReportQueryPanel,
  usePanelOpenState,
} from "@/features/audit/components/report-query-panel";
import { panelOpenFromCookie } from "@/features/audit/lib/panel-cookie";
import enMessages from "@/i18n/messages/en.json";
import pt from "@/i18n/messages/pt.json";

/** Stands in for AuditScreen: owns the fold state, seeded like the server does. */
function Screen({
  initial,
  children,
}: {
  initial: boolean;
  children: ReactNode;
}) {
  const panel = usePanelOpenState(initial);
  return <PanelOpenContext value={panel}>{children}</PanelOpenContext>;
}

function panel(filterCount: number, onClear = vi.fn()) {
  return (
    <ReportQueryPanel
      period={<p>período</p>}
      filters={<p>filtros</p>}
      range={{ preset: "7d" }}
      filterCount={filterCount}
      onClearFilters={onClear}
    />
  );
}

function renderPanel(filterCount: number, onClear = vi.fn(), open = true) {
  return render(<Screen initial={open}>{panel(filterCount, onClear)}</Screen>);
}

describe("ReportQueryPanel", () => {
  afterEach(() => {
    // biome-ignore lint/suspicious/noDocumentCookie: clearing the cookie the panel writes.
    document.cookie = "audit-query-panel-open=; max-age=0; path=/";
    window.localStorage.clear();
  });

  it("keeps the fold when another report tab mounts its own panel", async () => {
    const { rerender } = render(
      <Screen initial={true}>
        <div key="access">{panel(0)}</div>
      </Screen>,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Período e filtros" }),
    );
    rerender(
      <Screen initial={true}>
        <div key="settings">{panel(0)}</div>
      </Screen>,
    );
    expect(
      screen.getByRole("button", { name: "Período e filtros" }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("moves a fold saved by the localStorage version into the cookie", async () => {
    window.localStorage.setItem("audit.query-panel.open", "false");
    renderPanel(0);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Período e filtros" }),
      ).toHaveAttribute("aria-expanded", "false"),
    );
    expect(document.cookie).toContain("audit-query-panel-open=0");
    expect(window.localStorage.getItem("audit.query-panel.open")).toBeNull();
  });

  it("keeps Limpar filtros in place, disabled until a filter is set", async () => {
    const onClear = vi.fn();
    const { unmount } = renderPanel(0, onClear);
    expect(
      screen.getByRole("button", { name: "Limpar filtros" }),
    ).toBeDisabled();
    unmount();

    renderPanel(2, onClear);
    await userEvent.click(
      screen.getByRole("button", { name: "Limpar filtros" }),
    );
    expect(onClear).toHaveBeenCalledOnce();
  });

  it("folds away, says what is still applied, and remembers it", async () => {
    const { unmount } = renderPanel(2);
    const toggle = screen.getByRole("button", { name: "Período e filtros" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("filtros")).toBeInTheDocument();

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("período")).not.toBeInTheDocument();
    expect(screen.getByText("Últimos 7 dias, 2 filtros")).toBeInTheDocument();
    expect(document.cookie).toContain("audit-query-panel-open=0");
    unmount();

    // The server reads that cookie and starts the next render folded.
    renderPanel(2, vi.fn(), panelOpenFromCookie("0"));
    expect(
      screen.getByRole("button", { name: "Período e filtros" }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("reads the cookie: only an explicit 0 folds it", () => {
    expect(panelOpenFromCookie(undefined)).toBe(true);
    expect(panelOpenFromCookie("1")).toBe(true);
    expect(panelOpenFromCookie("0")).toBe(false);
  });
});

describe("queryLabel", () => {
  const t = createTranslator({
    locale: "pt",
    messages: pt,
    namespace: "audit",
  });
  const formatDate = (ymd: string) => ymd.split("-").reverse().join("/");

  it("names the period and counts filters", () => {
    expect(queryLabel(t, formatDate, { preset: "24h" }, 0)).toBe(
      "Últimas 24 horas, sem filtros",
    );
    expect(
      queryLabel(
        t,
        formatDate,
        { preset: "custom", from: "2026-09-21", to: "2026-09-28" },
        1,
      ),
    ).toBe("21/09/2026 a 28/09/2026, 1 filtro");
    expect(queryLabel(t, formatDate, { preset: "7d" }, 3)).toBe(
      "Últimos 7 dias, 3 filtros",
    );
  });

  it("speaks English", () => {
    const en = createTranslator({
      locale: "en",
      messages: enMessages,
      namespace: "audit",
    });
    expect(
      queryLabel(
        en,
        formatDate,
        { preset: "custom", from: "2026-09-21", to: "2026-09-28" },
        2,
      ),
    ).toBe("21/09/2026 to 28/09/2026, 2 filters");
  });
});
