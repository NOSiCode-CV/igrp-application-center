import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

// Mock the DS surface inline — the real package has heavy transitive imports
// (server-only, IGRP framework wiring) that break under vitest/jsdom.
// We only need light stand-ins that render children so the row action menu
// items are visible without dropdown interaction.
vi.mock("@igrp/igrp-framework-react-design-system", () => {
  const Passthrough = ({ children }: { children?: React.ReactNode }) => (
    <>{children}</>
  );
  return {
    Badge: Passthrough,
    DropdownMenu: Passthrough,
    DropdownMenuContent: Passthrough,
    DropdownMenuItem: ({
      children,
      onSelect,
    }: {
      children?: React.ReactNode;
      onSelect?: () => void;
    }) => (
      <button type="button" onClick={onSelect}>
        {children}
      </button>
    ),
    DropdownMenuTrigger: ({ children }: { children?: React.ReactNode }) => (
      <button type="button" aria-label="row-actions">
        {children}
      </button>
    ),
    IGRPDataTable: ({ columns, data }: { columns: any[]; data: any[] }) => (
      <table>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {columns.map((col, j) => {
                const cell = col.cell;
                const original = row;
                const tableRow = {
                  original,
                  getValue: (k: string) => row[k],
                };
                return (
                  <td key={j}>
                    {typeof cell === "function"
                      ? cell({ row: tableRow })
                      : null}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    ),
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
    IGRPDataTableFacetedFilterFn: () => true,
    IGRPDataTableFilterFaceted: () => null,
    IGRPDataTableFilterInput: () => null,
    IGRPDataTableHeaderDefault: () => null,
    IGRPDataTableHeaderSortToggle: () => null,
    IGRPIcon: () => null,
    IGRPUserAvatar: () => null,
    Tabs: ({ children }: { children?: React.ReactNode }) => (
      <div>{children}</div>
    ),
    TabsContent: ({ children }: { children?: React.ReactNode }) => (
      <div>{children}</div>
    ),
    TabsList: ({ children }: { children?: React.ReactNode }) => (
      <div>{children}</div>
    ),
    TabsTrigger: ({ children }: { children?: React.ReactNode }) => (
      <div>{children}</div>
    ),
    useIGRPToast: () => ({ igrpToast: vi.fn() }),
  };
});

// Stub local components / utils that have unrelated imports.
vi.mock("@/components/confirmation-modal", () => ({
  ConfirmDialog: () => null,
}));
vi.mock("@/components/loading", () => ({
  AppCenterLoading: () => null,
}));
vi.mock("@/components/page-header", () => ({
  PageHeader: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
vi.mock("@/features/users/components/user-invite-dialog", () => ({
  UserInviteDialog: () => null,
}));

vi.mock("@/features/users/use-users", () => ({
  useUsers: () => ({ data: [], error: null }),
  useGetUserInvitations: () => ({
    data: [
      {
        id: 1,
        email: "pending@x.cv",
        status: "PENDING",
        invitationDate: "2026-05-01",
      },
      {
        id: 2,
        email: "canceled@x.cv",
        status: "CANCELED",
        invitationDate: "2026-05-01",
      },
    ],
    isLoading: false,
  }),
  useUpdateUserStatus: () => ({ mutate: vi.fn(), isPending: false }),
  useCancelUserInvitation: () => ({ mutate: vi.fn(), isPending: false }),
  useResendUserInvitation: () => ({ mutate: vi.fn(), isPending: false }),
}));

import { UserListTable } from "@/features/users/components/user-list-table";

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

describe("UserListTable invite actions", () => {
  it("hides Reenviar on canceled invites", async () => {
    render(<UserListTable initialUsers={[]} initialInvitations={[]} />, {
      wrapper,
    });

    // With the DS mocks above, all tabs and dropdown items are rendered inline.
    // The canceled invite row should NOT contain a "Reenviar Convite" button.
    // The pending invite row WILL — so we need to check by row, not globally.
    // We assert by counting: pre-fix there are 2 Reenviar buttons; post-fix only 1.
    const resendButtons = screen.queryAllByText(/Reenviar Convite/i);
    expect(resendButtons).toHaveLength(1);
  });

  it("still shows Reenviar on pending invites", () => {
    render(<UserListTable initialUsers={[]} initialInvitations={[]} />, {
      wrapper,
    });

    // Pending row keeps the action.
    expect(screen.getAllByText(/Reenviar Convite/i).length).toBeGreaterThan(0);
  });
});

// Silence unused import warning when userEvent isn't used.
void userEvent;
