import type { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { UserNameEditor } from "@/features/users/components/user-name-editor";

const mutateAsync = vi.fn().mockResolvedValue({ success: true });

vi.mock("@/features/users/use-users", () => ({
  useUpdateUser: () => ({ mutateAsync }),
}));

vi.mock("@igrp/igrp-framework-react-design-system", async () => ({
  // biome-ignore lint/suspicious/noExplicitAny: <any is not recommmend to use>
  IGRPButton: ({ children, onClick }: any) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
  IGRPIcon: () => null,
  // biome-ignore lint/suspicious/noExplicitAny: <any is not recommmend to use>
  IGRPInputText: (props: any) => <input {...props} />,
  useIGRPToast: () => ({ igrpToast: vi.fn() }),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

describe("UserNameEditor", () => {
  it("calls updateUser with trimmed new name", async () => {
    render(
      <UserNameEditor
        user={{ id: "u1", name: "Old", email: "a@b" } as unknown as IGRPUserDTO}
      />,
      {
        wrapper,
      },
    );

    await userEvent.click(screen.getByRole("button", { name: "" }));
    const input = screen.getByDisplayValue("Old");
    await userEvent.clear(input);
    await userEvent.type(input, "  New name  ");
    await userEvent.keyboard("{Enter}");

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "u1",
          user: expect.objectContaining({ name: "New name" }),
        }),
      );
    });
  });

  it("does not call updateUser when name is unchanged", async () => {
    mutateAsync.mockClear();
    render(
      <UserNameEditor
        user={
          { id: "u1", name: "Same", email: "a@b" } as unknown as IGRPUserDTO
        }
      />,
      {
        wrapper,
      },
    );

    await userEvent.click(screen.getByRole("button", { name: "" }));
    await userEvent.keyboard("{Enter}");
    expect(mutateAsync).not.toHaveBeenCalled();
  });
});
