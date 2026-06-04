import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { UserProfileEditableName } from "@/features/users/components/user-profile-editable-name";

vi.mock("@igrp/igrp-framework-react-design-system", () => ({
  IGRPButton: ({
    children,
    onClick,
    disabled,
    "aria-label": ariaLabel,
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    "aria-label"?: string;
  }) => (
    <button onClick={onClick} disabled={disabled} aria-label={ariaLabel}>
      {children}
    </button>
  ),
  IGRPIcon: () => <span />,
  IGRPInputText: ({
    value,
    onChange,
    onKeyDown,
    autoFocus,
    maxLength,
    disabled,
  }: {
    value?: string;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
    autoFocus?: boolean;
    maxLength?: number;
    disabled?: boolean;
  }) => (
    <input
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      autoFocus={autoFocus}
      maxLength={maxLength}
      disabled={disabled}
    />
  ),
}));

describe("UserProfileEditableName", () => {
  it("submits the trimmed name on Enter and exits edit mode", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<UserProfileEditableName name="Old" onSave={onSave} />);

    await userEvent.click(screen.getByRole("button", { name: /editar nome/i }));
    const input = screen.getByRole("textbox");
    await userEvent.clear(input);
    await userEvent.type(input, "  New Name  ");
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onSave).toHaveBeenCalledWith("New Name");
  });

  it("does not call onSave when the name is unchanged", async () => {
    const onSave = vi.fn();
    render(<UserProfileEditableName name="Same" onSave={onSave} />);
    await userEvent.click(screen.getByRole("button", { name: /editar nome/i }));
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
    expect(onSave).not.toHaveBeenCalled();
  });

  it("cancels with Escape", async () => {
    render(<UserProfileEditableName name="Old" onSave={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /editar nome/i }));
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("respects maxLength on the input (default 120)", async () => {
    render(<UserProfileEditableName name="Old" onSave={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /editar nome/i }));
    expect(screen.getByRole("textbox")).toHaveAttribute("maxLength", "120");
  });

  it("disables save while onSave is in flight", async () => {
    let resolveSave: () => void = () => {};
    const onSave = vi.fn().mockImplementation(
      () =>
        new Promise<void>((r) => {
          resolveSave = r;
        }),
    );

    render(<UserProfileEditableName name="Old" onSave={onSave} />);
    await userEvent.click(screen.getByRole("button", { name: /editar nome/i }));
    const input = screen.getByRole("textbox");
    await userEvent.clear(input);
    await userEvent.type(input, "New");

    fireEvent.keyDown(input, { key: "Enter" });

    const save = await screen.findByRole("button", { name: /guardar nome/i });
    expect(save).toBeDisabled();

    resolveSave();
  });

  it("shows inline error when onSave rejects and stays in edit mode", async () => {
    const onSave = vi.fn().mockRejectedValue(new Error("nope"));
    render(<UserProfileEditableName name="Old" onSave={onSave} />);

    await userEvent.click(screen.getByRole("button", { name: /editar nome/i }));
    const input = screen.getByRole("textbox");
    await userEvent.clear(input);
    await userEvent.type(input, "New");
    fireEvent.keyDown(input, { key: "Enter" });

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("nope");
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });
});
