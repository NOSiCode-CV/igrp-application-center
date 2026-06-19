import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { UserProfileStatusButton } from "@/features/users/components/user-profile-status-button";

vi.mock("@igrp/igrp-framework-react-design-system", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
  IGRPButton: ({
    children,
    onClick,
    disabled,
    type,
    className,
    "aria-label": ariaLabel,
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
    className?: string;
    "aria-label"?: string;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      type={type ?? "button"}
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  ),
  IGRPIcon: () => <span />,
}));

it("renders a destructive deactivate action when active and calls onToggleStatus", async () => {
  const onToggleStatus = vi.fn();
  render(
    <UserProfileStatusButton
      isActive={true}
      isPending={false}
      onToggleStatus={onToggleStatus}
    />,
  );

  await userEvent.click(
    screen.getByRole("button", { name: /desativar utilizador/i }),
  );

  expect(onToggleStatus).toHaveBeenCalledTimes(1);
});

it("renders a green activate action when inactive", async () => {
  const onToggleStatus = vi.fn();
  render(
    <UserProfileStatusButton
      isActive={false}
      isPending={false}
      onToggleStatus={onToggleStatus}
    />,
  );

  const button = screen.getByRole("button", { name: /ativar utilizador/i });
  expect(button.className).toContain("bg-success");

  await userEvent.click(button);
  expect(onToggleStatus).toHaveBeenCalledTimes(1);
});

it("disables the button while isPending", () => {
  const onToggleStatus = vi.fn();
  render(
    <UserProfileStatusButton
      isActive={true}
      isPending={true}
      onToggleStatus={onToggleStatus}
    />,
  );

  expect(
    screen.getByRole("button", { name: /desativar utilizador/i }),
  ).toBeDisabled();
});
