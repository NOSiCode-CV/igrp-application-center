import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useUpdateUser } from "@/features/users/use-users";

vi.mock("server-only", () => ({}));
vi.mock("@/actions/access-client", () => ({
  getClientAccess: vi.fn(),
}));
vi.mock("@/actions/user-audit", () => ({
  getUserAuditLogs: vi.fn(),
}));
vi.mock("@/actions/user-sessions", () => ({
  getUserSession: vi.fn(),
  killUserSession: vi.fn(),
}));
vi.mock("@/actions/user", () => ({
  addCurrentUserFavoriteApplication: vi.fn(),
  addRolesToUser: vi.fn(),
  cancelUserInvitation: vi.fn(),
  getCurrentUser: vi.fn(),
  getCurrentUserActiveRole: vi.fn(),
  getCurrentUserApplications: vi.fn(),
  getCurrentUserDepartments: vi.fn(),
  getCurrentUserFavoriteApplications: vi.fn(),
  getCurrentUserRecentApplications: vi.fn(),
  getCurrentUserRoles: vi.fn(),
  getUser: vi.fn(),
  getUserApplications: vi.fn(),
  getUserDepartments: vi.fn(),
  getUserInvitationByToken: vi.fn(),
  getUserInvitations: vi.fn(),
  getUserMetadata: vi.fn(),
  getUserRoles: vi.fn(),
  getUsers: vi.fn(),
  inviteUser: vi.fn(),
  registerCurrentUserApplicationAccess: vi.fn(),
  removeCurrentUserFavoriteApplication: vi.fn(),
  removeRolesFromUser: vi.fn(),
  resendUserInvitation: vi.fn(),
  respondUserInvitation: vi.fn(),
  setCurrentUserActiveRole: vi.fn(),
  updateUser: vi.fn().mockResolvedValue({ success: true, data: { id: "u1" } }),
  updateUserMetadata: vi.fn(),
  updateUserStatus: vi.fn(),
  validateInvitationEmail: vi.fn(),
  validateInvitationOtp: vi.fn(),
}));

describe("useUpdateUser", () => {
  it("invalidates current-user after a successful update", async () => {
    const client = new QueryClient();
    const spy = vi.spyOn(client, "invalidateQueries");
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useUpdateUser(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({
        id: "u1",
        user: { id: "u1" } as never,
      });
    });

    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith({ queryKey: ["current-user"] }),
    );
  });
});
