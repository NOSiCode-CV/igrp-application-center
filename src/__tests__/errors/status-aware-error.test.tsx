import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}));

vi.mock("@igrp/igrp-framework-react-design-system", () => ({
  IGRPButton: ({
    children,
  }: { children?: React.ReactNode } & Record<string, unknown>) => (
    <button type="button">{children}</button>
  ),
}));

import { StatusAwareError } from "@/components/errors/status-aware-error";
import { HttpStatusError } from "@/lib/errors";

describe("StatusAwareError", () => {
  it("renders StatusErrorPage when the digest carries an HTTP status", () => {
    const error = new HttpStatusError(403, "Sem permissão");
    render(
      <StatusAwareError error={error} fallback={<div>fallback ui</div>} />,
    );
    expect(screen.getByText("403")).toBeInTheDocument();
    expect(screen.getByText(/sem permissão/i)).toBeInTheDocument();
    expect(screen.queryByText("fallback ui")).not.toBeInTheDocument();
  });

  it("renders the fallback for errors without an HTTP digest", () => {
    const error = Object.assign(new Error("boom"), { digest: "abc123" });
    render(
      <StatusAwareError error={error} fallback={<div>fallback ui</div>} />,
    );
    expect(screen.getByText("fallback ui")).toBeInTheDocument();
  });
});
