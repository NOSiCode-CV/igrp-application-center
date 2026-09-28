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
    IGRPButton: ({
      onClick,
      disabled,
      "aria-label": ariaLabel,
    }: {
      onClick?: () => void;
      disabled?: boolean;
      "aria-label"?: string;
    }) => (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
      />
    ),
    /* Shows the draft it was given and lets a test pick 1–10 Sept. */
    IGRPCalendarRange: ({
      date,
      onDateChange,
    }: {
      date?: { from?: Date; to?: Date };
      onDateChange?: (d: { from?: Date; to?: Date } | undefined) => void;
    }) => (
      <div>
        <span data-testid="draft">
          {date?.from ? `${date.from.getDate()}-${date.to?.getDate()}` : "none"}
        </span>
        <button
          type="button"
          onClick={() =>
            onDateChange?.({
              from: new Date(2026, 8, 1),
              to: new Date(2026, 8, 10),
            })
          }
        >
          pick
        </button>
      </div>
    ),
    IGRPCombobox: ({
      options,
      onChange,
      label,
    }: {
      options: { label: string; value: string }[];
      onChange?: (v: string) => void;
      label?: string;
    }) => (
      // biome-ignore lint/a11y/useAriaPropsSupportedByRole: mock only, used to query the label in tests
      <div aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange?.(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    ),
    IGRPIcon: () => null,
    Popover: ({
      children,
      open,
    }: {
      children?: React.ReactNode;
      open?: boolean;
    }) => <div data-open={open ? "true" : "false"}>{children}</div>,
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

  it("opens the box on 'Personalizado' without searching, starting on today in Cabo Verde", async () => {
    const onChange = vi.fn();
    render(<ReportDateRange range={{ preset: "7d" }} onChange={onChange} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Personalizado" }),
    );
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByTestId("draft")).toHaveTextContent("23-23");
    expect(screen.getByText("Escolher datas")).toBeInTheDocument();
  });

  it("does not search while picking days; OK applies the range", async () => {
    const onChange = vi.fn();
    render(<ReportDateRange range={{ preset: "7d" }} onChange={onChange} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Personalizado" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "pick" }));
    expect(onChange).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "OK" }));
    expect(onChange).toHaveBeenCalledWith({
      preset: "custom",
      from: "2026-09-01",
      to: "2026-09-10",
    });
  });

  it("'Limpar' clears the chosen days and disables OK", async () => {
    const onChange = vi.fn();
    render(<ReportDateRange range={{ preset: "7d" }} onChange={onChange} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Personalizado" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Limpar" }));

    expect(screen.getByTestId("draft")).toHaveTextContent("none");
    expect(screen.getByRole("button", { name: "OK" })).toBeDisabled();
    expect(onChange).not.toHaveBeenCalled();
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
