import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { UserProfileActionsMenu } from "@/features/users/components/user-profile-actions-menu";

vi.mock("@igrp/igrp-framework-react-design-system", () => ({
  DropdownMenu: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children?: React.ReactNode; asChild?: boolean }) => (
    <>{children}</>
  ),
  DropdownMenuContent: ({ children }: { children?: React.ReactNode; align?: string }) => (
    <div role="menu">{children}</div>
  ),
  DropdownMenuItem: ({
    children,
    onSelect,
    disabled,
    className,
  }: {
    children?: React.ReactNode;
    onSelect?: () => void;
    disabled?: boolean;
    className?: string;
  }) => (
    <div
      role="menuitem"
      aria-disabled={disabled ? "true" : undefined}
      data-disabled={disabled ? "" : undefined}
      className={className}
      onClick={() => {
        if (!disabled) onSelect?.();
      }}
    >
      {children}
    </div>
  ),
  IGRPButton: ({
    children,
    onClick,
    disabled,
    type,
    "aria-label": ariaLabel,
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
    "aria-label"?: string;
  }) => (
    <button onClick={onClick} disabled={disabled} type={type ?? "button"} aria-label={ariaLabel}>
      {children}
    </button>
  ),
  IGRPIcon: () => <span />,
}));

it("calls onToggleStatus with the destructive item when active", async () => {
  const onToggleStatus = vi.fn();
  render(
    <UserProfileActionsMenu
      isActive={true}
      isPending={false}
      onToggleStatus={onToggleStatus}
    />,
  );

  await userEvent.click(screen.getByRole("button", { name: /ações do utilizador/i }));
  await userEvent.click(screen.getByRole("menuitem", { name: /desativar/i }));

  expect(onToggleStatus).toHaveBeenCalledTimes(1);
});

it("calls onToggleStatus with the activate label when inactive", async () => {
  const onToggleStatus = vi.fn();
  render(
    <UserProfileActionsMenu
      isActive={false}
      isPending={false}
      onToggleStatus={onToggleStatus}
    />,
  );

  await userEvent.click(screen.getByRole("button", { name: /ações do utilizador/i }));
  await userEvent.click(screen.getByRole("menuitem", { name: /ativar/i }));

  expect(onToggleStatus).toHaveBeenCalledTimes(1);
});

it("disables the menu item while isPending", async () => {
  const onToggleStatus = vi.fn();
  render(
    <UserProfileActionsMenu
      isActive={true}
      isPending={true}
      onToggleStatus={onToggleStatus}
    />,
  );

  const item = screen.getByRole("menuitem", { name: /desativar/i });
  expect(
    item.getAttribute("data-disabled") !== null ||
      item.getAttribute("aria-disabled") === "true",
  ).toBe(true);
});
