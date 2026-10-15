import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  queryLabel,
  ReportQueryPanel,
} from "@/features/audit/components/report-query-panel";

function renderPanel(filterCount: number, onClear = vi.fn()) {
  return render(
    <ReportQueryPanel
      period={<p>período</p>}
      filters={<p>filtros</p>}
      range={{ preset: "7d" }}
      filterCount={filterCount}
      onClearFilters={onClear}
    />,
  );
}

describe("ReportQueryPanel", () => {
  beforeEach(() => window.localStorage.clear());

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
    unmount();

    renderPanel(2);
    expect(
      screen.getByRole("button", { name: "Período e filtros" }),
    ).toHaveAttribute("aria-expanded", "false");
  });
});

describe("queryLabel", () => {
  it("names the period and counts filters", () => {
    expect(queryLabel({ preset: "24h" }, 0)).toBe(
      "Últimas 24 horas, sem filtros",
    );
    expect(
      queryLabel({ preset: "custom", from: "2026-09-21", to: "2026-09-28" }, 1),
    ).toBe("21/09/2026 a 28/09/2026, 1 filtro");
  });
});
