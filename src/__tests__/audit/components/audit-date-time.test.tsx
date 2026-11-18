import { IGRPIntlTestProvider } from "@igrp/framework-next/i18n/testing";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuditDateTime } from "@/features/audit/components/audit-date-time";

function renderAt(timeZone: string, value?: string | null) {
  return render(
    <IGRPIntlTestProvider locale="pt" timeZone={timeZone}>
      <p data-testid="out">
        <AuditDateTime value={value} />
      </p>
    </IGRPIntlTestProvider>,
  );
}

describe("AuditDateTime", () => {
  it("renders in the platform zone it is given", () => {
    renderAt("Atlantic/Cape_Verde", "2026-07-16T11:35:10Z");
    expect(screen.getByTestId("out").textContent).toContain("16/07/2026");
    expect(screen.getByTestId("out").textContent).toContain("10:35:10");
  });

  it("moves with the zone", () => {
    renderAt("UTC", "2026-07-16T11:35:10Z");
    expect(screen.getByTestId("out").textContent).toContain("11:35:10");
  });

  it("renders a dash for missing or invalid values", () => {
    const { unmount } = renderAt("UTC", null);
    expect(screen.getByTestId("out")).toHaveTextContent("—");
    unmount();
    renderAt("UTC", "not a date");
    expect(screen.getByTestId("out")).toHaveTextContent("—");
  });
});
