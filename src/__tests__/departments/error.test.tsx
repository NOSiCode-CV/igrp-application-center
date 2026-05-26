import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/report-error", () => ({
  reportError: vi.fn(),
}));

vi.mock("@igrp/igrp-framework-react-design-system", () => ({
  Button: ({
    children,
    onClick,
    ...rest
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
  } & Record<string, unknown>) => (
    <button onClick={onClick} {...rest}>
      {children}
    </button>
  ),
  IGRPIcon: ({ iconName }: { iconName: string }) => (
    <span data-icon={iconName} />
  ),
}));

import { reportError } from "@/lib/report-error";
import DepartmentsError from "@/app/(igrp)/(home)/settings/departments/error";

describe("DepartmentsError", () => {
  beforeEach(() => {
    vi.mocked(reportError).mockClear();
  });

  it("renders the error heading, body, and retry button", () => {
    render(<DepartmentsError error={new Error("boom")} reset={() => {}} />);
    expect(
      screen.getByRole("heading", {
        name: /não foi possível carregar departamentos/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/tenta novamente/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /tentar novamente/i }),
    ).toBeInTheDocument();
  });

  it("calls reset when the retry button is clicked", async () => {
    const reset = vi.fn();
    render(<DepartmentsError error={new Error("boom")} reset={reset} />);
    await userEvent.click(
      screen.getByRole("button", { name: /tentar novamente/i }),
    );
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("reports the error on mount with the segment scope", () => {
    const error = new Error("boom");
    render(<DepartmentsError error={error} reset={() => {}} />);
    expect(reportError).toHaveBeenCalledTimes(1);
    expect(reportError).toHaveBeenCalledWith(error, {
      segment: "settings/departments",
    });
  });

  it("shows the digest when present", () => {
    const error = Object.assign(new Error("boom"), { digest: "abc123" });
    render(<DepartmentsError error={error} reset={() => {}} />);
    expect(screen.getByText(/ref:\s*abc123/i)).toBeInTheDocument();
  });

  it("hides the digest when absent", () => {
    render(<DepartmentsError error={new Error("boom")} reset={() => {}} />);
    expect(screen.queryByText(/ref:/i)).not.toBeInTheDocument();
  });
});
