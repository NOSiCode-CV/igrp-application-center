import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@igrp/igrp-framework-react-design-system", () => {
  const Pass = ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  );
  return {
    Button: ({ children }: { children?: React.ReactNode }) => (
      <button type="button">{children}</button>
    ),
    IGRPCalendarRange: () => <div data-testid="calendar" />,
    IGRPIcon: () => null,
    IGRPSelect: ({
      options,
      onValueChange,
      label,
    }: {
      options: { label: string; value: string }[];
      onValueChange?: (v: string) => void;
      label?: string;
    }) => (
      // biome-ignore lint/a11y/useAriaPropsSupportedByRole: mock only, used to query the label in tests
      <div aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onValueChange?.(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    ),
    Popover: Pass,
    PopoverContent: Pass,
    PopoverTrigger: Pass,
  };
});

import { ReportDateRange } from "@/features/audit/components/report-date-range";

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date("2026-09-24T00:30:00Z")); // 23:30 on the 23rd in CV
});
afterEach(() => vi.useRealTimers());

describe("ReportDateRange", () => {
  it("switches to a preset", async () => {
    const onChange = vi.fn();
    render(<ReportDateRange range={{ preset: "7d" }} onChange={onChange} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Últimas 24 horas" }),
    );
    expect(onChange).toHaveBeenCalledWith({ preset: "24h" });
  });

  it("starts a custom range on today in Cabo Verde time", async () => {
    const onChange = vi.fn();
    render(<ReportDateRange range={{ preset: "7d" }} onChange={onChange} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Personalizado" }),
    );
    expect(onChange).toHaveBeenCalledWith({
      preset: "custom",
      from: "2026-09-23",
      to: "2026-09-23",
    });
  });

  it("shows the chosen days and the time zone", () => {
    render(
      <ReportDateRange
        range={{ preset: "custom", from: "2026-09-01", to: "2026-09-10" }}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText("01/09/2026 – 10/09/2026")).toBeInTheDocument();
    expect(screen.getByText("Hora de Cabo Verde")).toBeInTheDocument();
  });
});
