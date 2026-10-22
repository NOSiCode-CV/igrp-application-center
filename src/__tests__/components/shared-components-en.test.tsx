import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { IGRPDialogDelete } from "@/components/dialog-delete";
import { SensitiveValueDisclosure } from "@/components/sensitive-value-disclosure";

import { renderWithIntl } from "../helpers/intl";

const toDelete = { name: "acme" };

describe("shared components in English", () => {
  it("renders SensitiveValueDisclosure in English", async () => {
    renderWithIntl(
      <SensitiveValueDisclosure
        label="Client secret"
        value="s3cret"
        onConfirmedChange={vi.fn()}
      />,
      { locale: "en" },
    );
    await userEvent.click(screen.getByRole("button", { name: "Show" }));
    expect(screen.getByRole("button", { name: "Hide" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", {
        name: "I saved the secret in a safe place",
      }),
    ).toBeInTheDocument();
  });

  it("renders IGRPDialogDelete in English", async () => {
    renderWithIntl(
      <IGRPDialogDelete
        open
        onOpenChange={vi.fn()}
        toDelete={toDelete}
        confirmDelete={vi.fn()}
        isDeleting={false}
        description="Removes it."
        label="Name"
      />,
      { locale: "en" },
    );
    expect(screen.getByText(/To confirm, type/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    const input = screen.getByPlaceholderText("Type 'acme' to confirm");
    await userEvent.type(input, "ac");
    expect(
      screen.getByText("The text does not match «acme»."),
    ).toBeInTheDocument();
  });
});
