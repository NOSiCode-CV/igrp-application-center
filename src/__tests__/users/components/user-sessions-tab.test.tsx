import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserSessionsTab } from "@/features/users/components/user-sessions-tab";
import {
  useUserSession,
  useKillUserSession,
} from "@/features/users/use-users";

const mockSession = {
  sessionId: "abc123def456",
  status: "ACTIVE",
  startedAt: "2026-05-14T09:00:00Z",
  lastSeenAt: "2026-05-14T09:10:00Z",
  clientIp: "197.220.1.1",
};

vi.mock("@igrp/igrp-framework-react-design-system", () => ({
  IGRPButton: ({
    children,
    onClick,
    disabled,
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Input: ({
    placeholder,
    value,
    onChange,
  }: {
    placeholder?: string;
    value?: string;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
  }) => (
    <input placeholder={placeholder} value={value} onChange={onChange} />
  ),
  Label: ({ children }: { children?: React.ReactNode }) => (
    <label>{children}</label>
  ),
  AlertDialog: ({
    children,
    open,
  }: {
    children?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
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
}));

vi.mock("@/features/users/use-users", () => ({
  useUserSession: vi.fn(() => ({
    data: mockSession,
    isLoading: false,
  })),
  useKillUserSession: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({ success: true }),
    isPending: false,
  })),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

describe("UserSessionsTab", () => {
  it("renders the active session row", () => {
    render(<UserSessionsTab username="fidel.luz" />, { wrapper });
    expect(screen.getByText(/abc123/i)).toBeInTheDocument();
    expect(screen.getByText(/197\.220\.1\.1/)).toBeInTheDocument();
  });

  it("shows 'sem sessões ativas' when session data is undefined", () => {
    vi.mocked(useUserSession).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as ReturnType<typeof useUserSession>);
    render(<UserSessionsTab username="fidel.luz" />, { wrapper });
    expect(screen.getByText(/sem sessões ativas/i)).toBeInTheDocument();
  });

  it("prompts for reason and calls killSession on confirm", async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ success: true });
    vi.mocked(useKillUserSession).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useKillUserSession>);
    vi.mocked(useUserSession).mockReturnValue({
      data: mockSession,
      isLoading: false,
    } as ReturnType<typeof useUserSession>);

    render(<UserSessionsTab username="fidel.luz" />, { wrapper });

    await userEvent.click(screen.getByRole("button", { name: /terminar/i }));
    const reasonInput = screen.getByPlaceholderText(/motivo/i);
    await userEvent.type(reasonInput, "Suspicious activity");
    await userEvent.click(screen.getByRole("button", { name: /confirmar/i }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: "abc123def456",
          reason: "Suspicious activity",
          userExternalId: "fidel.luz",
        }),
      );
    });
  });
});
