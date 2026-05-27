import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { UserMetadataPanel } from "@/features/users/components/user-metadata-panel";

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
  Input: ({
    placeholder,
    value,
    onChange,
  }: {
    placeholder?: string;
    value?: string;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
  }) => <input placeholder={placeholder} value={value} onChange={onChange} />,
  Label: ({
    children,
    className,
  }: {
    children?: React.ReactNode;
    className?: string;
  }) => <label className={className}>{children}</label>,
  useIGRPToast: () => ({ igrpToast: vi.fn() }),
}));

vi.mock("@/features/users/use-users", () => ({
  useUserMetadata: vi.fn(() => ({
    data: { userId: 1, metadata: { dept: "TI" } },
    isLoading: false,
  })),
  useUpdateUserMetadata: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({ success: true }),
    isPending: false,
  })),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("UserMetadataPanel", () => {
  it("renders existing metadata key-value pairs", () => {
    render(<UserMetadataPanel userId={1} />, { wrapper });
    expect(screen.getByDisplayValue("dept")).toBeInTheDocument();
    expect(screen.getByDisplayValue("TI")).toBeInTheDocument();
  });

  it("adds a new empty row when '+ Add field' is clicked", async () => {
    render(<UserMetadataPanel userId={1} />, { wrapper });
    const addButton = screen.getByRole("button", { name: /add field/i });
    await userEvent.click(addButton);
    const keyInputs = screen.getAllByPlaceholderText("chave");
    expect(keyInputs).toHaveLength(2);
  });

  it("removes a row when the delete button is clicked", async () => {
    render(<UserMetadataPanel userId={1} />, { wrapper });
    const deleteButtons = screen.getAllByRole("button", { name: /remover/i });
    await userEvent.click(deleteButtons[0]);
    expect(screen.queryByDisplayValue("dept")).not.toBeInTheDocument();
  });

  it("calls updateUserMetadata with current rows on save", async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ success: true });
    const { useUpdateUserMetadata } = await import(
      "@/features/users/use-users"
    );
    vi.mocked(useUpdateUserMetadata).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as any);

    render(<UserMetadataPanel userId={1} />, { wrapper });
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        id: 1,
        metadata: { dept: "TI" },
      });
    });
  });
});
