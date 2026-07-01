import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("@igrp/igrp-framework-react-design-system", () => ({
  AlertDialog: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
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
  Card: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
  IGRPButton: ({ children }: { children?: React.ReactNode }) => (
    <button type="button">{children}</button>
  ),
  IGRPIcon: () => <span />,
  IGRPInputText: () => <input />,
  IGRPTabs: () => <div />,
  IGRPUserAvatar: () => <div />,
  useIGRPToast: () => ({ igrpToast: vi.fn() }),
}));

vi.mock("@/components/loading", () => ({
  AppCenterLoading: () => <div>loading</div>,
}));
vi.mock("@/components/not-found", () => ({
  AppCenterNotFound: () => <div>not-found</div>,
}));
vi.mock("@/features/departments/components/dept-list-simple-container", () => ({
  DepartmentListSimple: () => <div />,
}));
vi.mock("@/features/profile/components/profile-role-list", () => ({
  default: () => <div />,
}));
vi.mock("@/features/users/components/user-applications", () => ({
  default: () => <div />,
}));
vi.mock("@/features/users/components/user-signature", () => ({
  default: () => <div />,
}));

vi.mock("@/features/users/use-users", () => ({
  useCurrentUser: () => ({
    data: undefined,
    isLoading: false,
    error: new Error("boom"),
    refetch: vi.fn(),
  }),
  useUpdateUser: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock("@/features/files/use-files", () => ({
  useFiles: () => ({ data: undefined, isLoading: false }),
  useUploadPublicFiles: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

const { UserProfile } = await import(
  "@/features/users/components/user-profile"
);

it("throws when the current-user query errors", () => {
  const client = new QueryClient();
  const spy = vi.spyOn(console, "error").mockImplementation(() => {});
  expect(() =>
    render(
      <QueryClientProvider client={client}>
        <UserProfile />
      </QueryClientProvider>,
    ),
  ).toThrow("boom");
  spy.mockRestore();
});
