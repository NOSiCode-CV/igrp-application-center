import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createTranslator } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  PanelOpenProvider,
  queryLabel,
  ReportQueryPanel,
} from "@/features/audit/components/report-query-panel";
import enMessages from "@/i18n/messages/en.json";
import pt from "@/i18n/messages/pt.json";

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
  return render(
    <PanelOpenProvider initial={open}>
      {panel(filterCount, onClear)}
    </PanelOpenProvider>,
  );
}

describe("ReportQueryPanel", () => {
  afterEach(() => {
    // biome-ignore lint/suspicious/noDocumentCookie: clearing the cookie the panel writes.
    document.cookie = "audit-query-panel-open=; max-age=0; path=/";
  });

  it("keeps the fold when another report tab mounts its own panel", async () => {
    const { rerender } = render(
      <PanelOpenProvider initial={true}>
        <div key="access">{panel(0)}</div>
      </PanelOpenProvider>,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Período e filtros" }),
    );
    rerender(
      <PanelOpenProvider initial={true}>
        <div key="settings">{panel(0)}</div>
      </PanelOpenProvider>,
    );
    expect(
      screen.getByRole("button", { name: "Período e filtros" }),
    ).toHaveAttribute("aria-expanded", "false");
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

    // The server reads that cookie and seeds the next render folded.
    renderPanel(2, vi.fn(), false);
    expect(
      screen.getByRole("button", { name: "Período e filtros" }),
    ).toHaveAttribute("aria-expanded", "false");
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
