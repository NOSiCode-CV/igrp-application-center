import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { UnsavedChangesBar } from "@/components/unsaved-changes-bar";

describe("UnsavedChangesBar", () => {
  it("announces itself politely to screen readers", () => {
    render(<UnsavedChangesBar onDiscard={vi.fn()} isSaving={false} />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Tem alterações por guardar.",
    );
  });

  it("wraps instead of squeezing on narrow screens", () => {
    render(<UnsavedChangesBar onDiscard={vi.fn()} isSaving={false} />);
    expect(
      screen.getByRole("region", { name: "Alterações por guardar" }),
    ).toHaveClass("flex-wrap");
  });
});
