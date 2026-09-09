import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { UserProfileStatusDialog } from "@/features/users/components/user-profile-status-dialog";

vi.mock("@igrp/igrp-framework-react-design-system", () => ({
  AlertDialog: ({
    open,
    children,
  }: {
    open?: boolean;
    children?: React.ReactNode;
  }) => (open ? <div role="dialog">{children}</div> : null),
  AlertDialogContent: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogDescription: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogFooter: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogHeader: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogTitle: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
  IGRPButton: ({
    children,
    onClick,
    disabled,
    type,
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
  }) => (
    <button onClick={onClick} disabled={disabled} type={type ?? "button"}>
      {children}
    </button>
  ),
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
  IGRPIcon: () => <span />,
}));

it("calls onConfirm with INACTIVE when active user confirms", async () => {
  const onConfirm = vi.fn().mockResolvedValue(undefined);
  render(
    <UserProfileStatusDialog
      open
      isActive
      userName="Ana"
      onOpenChange={() => {}}
      onConfirm={onConfirm}
    />,
  );
  await userEvent.click(
    screen.getByRole("button", { name: /confirmar desativar/i }),
  );
  expect(onConfirm).toHaveBeenCalledWith("INACTIVE");
});

it("calls onConfirm with ACTIVE when inactive user confirms", async () => {
  const onConfirm = vi.fn().mockResolvedValue(undefined);
  render(
    <UserProfileStatusDialog
      open
      isActive={false}
      userName="Ana"
      onOpenChange={() => {}}
      onConfirm={onConfirm}
    />,
  );
  await userEvent.click(
    screen.getByRole("button", { name: /confirmar ativar/i }),
  );
  expect(onConfirm).toHaveBeenCalledWith("ACTIVE");
});
