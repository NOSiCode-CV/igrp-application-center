import type {
  AddRolesToUserRequestDTO,
  ApplicationDTO,
  AuditLogFilters,
  DepartmentDTO,
  IGRPUserDTO,
  InviteUserDTO,
  PageResponse,
  RoleDTO,
  SecurityAuditLogDTO,
  SessionResponseDTO,
  UserFilters,
  InvitationDTO,
  UserInvitationResponseDTO,
  UserMetadataDTO,
} from "@igrp/platform-access-management-client-ts";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  addCurrentUserFavoriteApplication,
  addRolesToUser,
  cancelUserInvitation,
  getCurrentUser,
  getCurrentUserActiveRole,
  //getCurrentUserActiveRole,
  getCurrentUserApplications,
  getCurrentUserDepartments,
  getCurrentUserFavoriteApplications,
  getCurrentUserRecentApplications,
  getCurrentUserRoles,
  getUser,
  getUserApplications,
  getUserDepartments,
  getUserInvitationByToken,
  getUserInvitations,
  getUserMetadata,
  getUserRoles,
  getUsers,
  inviteUser,
  registerCurrentUserApplicationAccess,
  removeCurrentUserFavoriteApplication,
  removeRolesFromUser,
  resendUserInvitation,
  respondUserInvitation,
  setCurrentUserActiveRole,
  //setCurrentUserActiveRole,
  updateUser,
  updateUserMetadata,
  updateUserStatus,
  validateInvitationEmail,
  validateInvitationOtp,
} from "@/actions/user";
import { getUserAuditLogs } from "@/actions/user-audit";
import { getUserSession, killUserSession } from "@/actions/user-sessions";

export const useUsers = (
  params?: UserFilters,
  options?: { initialData?: IGRPUserDTO[] },
) => {
  return useQuery<IGRPUserDTO[], Error>({
    queryKey: ["users", params ?? null],
    queryFn: async () => {
      const result = await getUsers(params);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    initialData: options?.initialData,
    retry: false,
  });
};

export const useCurrentUser = () => {
  return useQuery<IGRPUserDTO, Error>({
    queryKey: ["current-user"],
    queryFn: async () => {
      const result = await getCurrentUser();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    retry: false,
  });
};

export const useInviteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user }: { user: InviteUserDTO }) => inviteUser(user),
    onSuccess: async (result) => {
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: ["users"] });
        await queryClient.refetchQueries({ queryKey: ["users"] });
      }
    },
    retry: false,
  });
};

export const useAddUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      departmentCode,
      request,
    }: {
      id: string;
      departmentCode: string;
      request: AddRolesToUserRequestDTO;
    }) => addRolesToUser(id, departmentCode, request),
    onSuccess: async (result) => {
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: ["users"] });
        await queryClient.refetchQueries({ queryKey: ["users"] });
      }
    },
    retry: false,
  });
};

export const useRemoveUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      departmentCode,
      roleCodes,
    }: {
      id: string;
      departmentCode: string;
      roleCodes: string[];
    }) => removeRolesFromUser(id, departmentCode, roleCodes),
    onSuccess: async (result, variables) => {
      if (result.success) {
        await queryClient.invalidateQueries({
          queryKey: ["userRoles", variables.id],
        });
        await queryClient.invalidateQueries({ queryKey: ["users"] });
      }
    },
    retry: false,
  });
};

export const useUserRoles = (id: string) => {
  return useQuery<RoleDTO[], Error>({
    queryKey: ["userRoles", id],
    queryFn: async () => {
      const result = await getUserRoles(id);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!id,
    retry: false,
  });
};

export const useUserRolesMulti = (id: string[]) => {
  return useQueries({
    queries: id.map((u) => ({
      queryKey: ["userRoles", u],
      queryFn: async () => {
        const result = await getUserRoles(u);
        if (!result.success) throw new Error(result.error);
        return result.data;
      },
      enabled: !!u,
      retry: false,
    })),
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, user }: { id: string; user: IGRPUserDTO }) =>
      updateUser(id, user),
    onSuccess: async (result) => {
      if (result.success) {
        await queryClient.refetchQueries({
          queryKey: ["users"],
          type: "active",
        });
      }
    },
    retry: false,
  });
};

export const useCurrentUserDepartments = (options?: { enabled?: boolean }) => {
  return useQuery<DepartmentDTO[], Error>({
    queryKey: ["current-user-departments"],
    queryFn: async () => {
      const result = await getCurrentUserDepartments();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    ...options,
    retry: false,
  });
};

export const useCurrentUserApplications = (options?: { enabled?: boolean }) => {
  return useQuery<ApplicationDTO[], Error>({
    queryKey: ["current-user-applications"],
    queryFn: async () => {
      const result = await getCurrentUserApplications();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    ...options,
    retry: false,
  });
};

export function useUserApplications(
  userId: string,
  options?: { enabled?: boolean },
) {
  return useQuery<ApplicationDTO[], Error>({
    queryKey: ["user-applications", userId],
    queryFn: async () => {
      const result = await getUserApplications(userId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!userId,
    ...options,
    retry: false,
  });
}

export function useUserDepartments(
  userId: string,
  options?: { enabled?: boolean },
) {
  return useQuery<DepartmentDTO[], Error>({
    queryKey: ["user-departments", userId],
    queryFn: async () => {
      const result = await getUserDepartments(userId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!userId,
    ...options,
    retry: false,
  });
}

export function useUser(userId: string) {
  return useQuery<IGRPUserDTO, Error>({
    queryKey: ["user", userId],
    queryFn: async () => {
      const result = await getUser(userId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!userId,
    retry: false,
  });
}

export function useCurrentUserFavoriteApplications(applicationName?: string) {
  return useQuery<ApplicationDTO[], Error>({
    queryKey: ["favorite-applications", applicationName],
    queryFn: async () => {
      const result = await getCurrentUserFavoriteApplications(applicationName);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    throwOnError: true,
    retry: false,
  });
}

export function useAddCurrentUserFavoriteApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (applicationCode: string) =>
      addCurrentUserFavoriteApplication(applicationCode),
    onSuccess: async (result) => {
      if (result.success) {
        await queryClient.invalidateQueries({
          queryKey: ["favorite-applications"],
        });
      }
    },
    retry: false,
  });
}

export function useRemoveCurrentUserFavoriteApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (applicationCode: string) =>
      removeCurrentUserFavoriteApplication(applicationCode),
    onSuccess: async (result) => {
      if (result.success) {
        await queryClient.invalidateQueries({
          queryKey: ["favorite-applications"],
        });
      }
    },
    retry: false,
  });
}

export function useRegisterCurrentUserApplicationAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (applicationCode: string) =>
      registerCurrentUserApplicationAccess(applicationCode),
    onSuccess: async (result) => {
      if (result.success) {
        await queryClient.invalidateQueries({
          queryKey: ["recent-applications"],
        });
      }
    },
    retry: false,
  });
}

export function useGetCurrentUserRecentApplications(applicationName?: string) {
  return useQuery<ApplicationDTO[], Error>({
    queryKey: ["recent-applications", applicationName],
    queryFn: async () => {
      const result = await getCurrentUserRecentApplications(applicationName);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    retry: false,
  });
}

export function useGetUserInvitations(
  email?: string,
  options?: { initialData?: InvitationDTO[] },
) {
  return useQuery({
    queryKey: ["user-invitations", email],
    queryFn: async () => {
      const result = await getUserInvitations(email);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    initialData: options?.initialData,
    retry: false,
  });
}

export function useResendUserInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => resendUserInvitation(id),
    onSuccess: async (result) => {
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: ["user-invitations"] });
      }
    },
    retry: false,
  });
}

export function useRespondUserInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      response,
      token,
    }: {
      response: UserInvitationResponseDTO;
      token: string;
    }) => respondUserInvitation(response, token),
    onSuccess: async (result) => {
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: ["user-invitations"] });
      }
    },
    retry: false,
  });
}

export function useCancelUserInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => cancelUserInvitation(id),
    onSuccess: async (result) => {
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: ["user-invitations"] });
      }
    },
    retry: false,
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, value }: { id: string; value: string }) =>
      updateUserStatus(id, value),
    onSuccess: async (result) => {
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: ["users"] });
      }
    },
    retry: false,
  });
}

export function useGetUserInvitationByToken(token: string) {
  return useQuery({
    queryKey: ["user-invitation-by-token", token],
    queryFn: async () => {
      const result = await getUserInvitationByToken(token);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!token,
    retry: false,
  });
}

export function useGetCurrentUserRoles() {
  return useQuery({
    queryKey: ["current-user-roles"],
    queryFn: async () => {
      const result = await getCurrentUserRoles();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    retry: false,
  });
}

export function useCurrentUserActiveRole(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["current-user-active-role"],
    queryFn: async () => {
      const result = await getCurrentUserActiveRole();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    ...options,
    retry: false,
  });
}

export function useSetCurrentUserActiveRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (role: { roleCode: string; departmentCode: string }) =>
      setCurrentUserActiveRole(role),
    onSuccess: async (result) => {
      if (result.success) {
        await queryClient.invalidateQueries({
          queryKey: ["current-user-active-role"],
        });
        await queryClient.invalidateQueries({
          queryKey: ["current-user"],
        });
      }
    },
    retry: false,
  });
}

export function useValidateInvitationEmail() {
  return useMutation({
    mutationFn: async (
      request: Parameters<typeof validateInvitationEmail>[0],
    ) => validateInvitationEmail(request),
    retry: false,
  });
}

export function useValidateInvitationOtp() {
  return useMutation({
    mutationFn: async (request: Parameters<typeof validateInvitationOtp>[0]) =>
      validateInvitationOtp(request),
    retry: false,
  });
}

export const useUserMetadata = (id: string) => {
  return useQuery<UserMetadataDTO, Error>({
    queryKey: ["userMetadata", id],
    queryFn: async () => {
      const result = await getUserMetadata(id);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!id,
    retry: false,
  });
};

export const useUpdateUserMetadata = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      metadata,
    }: {
      id: string;
      metadata: Record<string, unknown>;
    }) => updateUserMetadata(id, metadata),
    onSuccess: async (result, variables) => {
      if (result.success) {
        await queryClient.invalidateQueries({
          queryKey: ["userMetadata", variables.id],
        });
      }
    },
    retry: false,
  });
};

export const useUserSession = (userExternalId: string) => {
  return useQuery<SessionResponseDTO, Error>({
    queryKey: ["userSession", userExternalId],
    queryFn: async () => {
      const result = await getUserSession(userExternalId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!userExternalId,
    retry: false,
  });
};

export const useKillUserSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      reason,
      userExternalId,
    }: {
      sessionId: string;
      reason: string;
      userExternalId: string;
    }) => killUserSession(sessionId, reason),
    onSuccess: async (result, variables) => {
      if (result.success) {
        await queryClient.invalidateQueries({
          queryKey: ["userSession", variables.userExternalId],
        });
      }
    },
    retry: false,
  });
};

export const useUserAuditLogs = (userId: string, filters?: AuditLogFilters) => {
  return useQuery<PageResponse<SecurityAuditLogDTO>, Error>({
    queryKey: ["userAuditLogs", userId, filters],
    queryFn: async () => {
      const result = await getUserAuditLogs(userId, filters);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!userId,
    retry: false,
  });
};
