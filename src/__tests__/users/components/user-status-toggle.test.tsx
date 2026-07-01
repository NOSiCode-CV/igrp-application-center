import type { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { UserStatusToggle } from "@/features/users/components/user-status-toggle";

const mutateAsync = vi.fn().mockResolvedValue({ success: true });

vi.mock("@/features/users/use-users", () => ({
  useUpdateUserStatus: () => ({ mutateAsync, isPending: false }),
}));

vi.mock("@igrp/igrp-framework-react-design-system", async () => ({
  IGRPButton: ({
    children,
    onClick,
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
  }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
  IGRPIcon: () => null,
  AlertDialog: ({
    open,
    children,
  }: {
    open?: boolean;
    children?: React.ReactNode;
  }) => (open ? <div>{children}</div> : null),
  AlertDialogContent: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogHeader: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogTitle: ({ children }: { children?: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
  AlertDialogDescription: ({ children }: { children?: React.ReactNode }) => (
    <p>{children}</p>
  ),
  AlertDialogFooter: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useIGRPToast: () => ({ igrpToast: vi.fn() }),
  cn: (...c: string[]) => c.filter(Boolean).join(" "),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

describe("UserStatusToggle", () => {
  it("invokes updateStatus with INACTIVE when toggling an active user", async () => {
    render(
      <UserStatusToggle
        user={
          { id: "u1", name: "A", status: "ACTIVE" } as unknown as IGRPUserDTO
        }
      />,
      { wrapper },
    );

    await userEvent.click(screen.getByRole("button", { name: /desativar/i }));
    await userEvent.click(
      screen.getByRole("button", { name: /confirmar desativar/i }),
    );

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({ id: "u1", value: "INACTIVE" });
    });
  });
});
