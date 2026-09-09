import { useIGRPToast } from "@igrp/igrp-framework-react-design-system";
import type {
  AddRolesToUserRequestDTO,
  ApplicationDTO,
  AuditLogDTO,
  AuditLogFilters,
  DepartmentDTO,
  IGRPUserDTO,
  InvitationDTO,
  InviteUserDTO,
  PageResponse,
  RoleDTO,
  SessionResponseDTO,
  UserFilters,
  UserInvitationResponseDTO,
  UserMetadataDTO,
} from "@igrp/platform-access-management-client-ts";
import {
  keepPreviousData,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { unwrap } from "@/actions/types";
import {
  addCurrentUserFavoriteApplication,
  addRolesToUser,
  cancelUserInvitation,
  getCurrentUserActiveRole,
  //getCurrentUserActiveRole,
  getCurrentUserApplications,
  getCurrentUserDepartments,
  getCurrentUserFavoriteApplications,
  getCurrentUserRecentApplications,
  getCurrentUserRoles,
  getUserApplications,
  getUserDepartments,
  getUserInvitationByToken,
  getUserInvitations,
  getUserMetadata,
  getUserRoles,
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

import { currentUserKeys, invitationKeys, userKeys } from "./query-keys";
import {
  currentUserOptions,
  userByIdOptions,
  userListOptions,
} from "./query-options";

export const useUsers = (
  params?: UserFilters,
  options?: { initialData?: IGRPUserDTO[] },
) => {
  return useQuery({
    ...userListOptions(params),
    initialData: options?.initialData,
    placeholderData: keepPreviousData,
  });
};

export const useCurrentUser = (options?: { enabled?: boolean }) => {
  return useQuery({
    ...currentUserOptions(),
    ...options,
  });
};

export const useInviteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user }: { user: InviteUserDTO }) => inviteUser(user),
    onSuccess: async (result) => {
      if (result.success) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: userKeys.all }),
          queryClient.invalidateQueries({ queryKey: invitationKeys.all }),
        ]);
      }
    },
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
        await queryClient.invalidateQueries({ queryKey: userKeys.all });
      }
    },
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
          queryKey: userKeys.roles(variables.id),
        });
        await queryClient.invalidateQueries({ queryKey: userKeys.all });
      }
    },
  });
};

export const useUserRoles = (id: string) => {
  return useQuery<RoleDTO[], Error>({
    queryKey: userKeys.roles(id),
    queryFn: async () => unwrap(await getUserRoles(id)),
    enabled: !!id,
  });
};

export const useUserRolesMulti = (id: string[]) => {
  return useQueries({
    queries: id.map((u) => ({
      queryKey: userKeys.roles(u),
      queryFn: async () => unwrap(await getUserRoles(u)),
      enabled: !!u,
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
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: currentUserKeys.detail() }),
          queryClient.invalidateQueries({ queryKey: userKeys.all }),
        ]);
      }
    },
  });
};

export const useCurrentUserDepartments = (options?: { enabled?: boolean }) => {
  return useQuery<DepartmentDTO[], Error>({
    queryKey: currentUserKeys.departments(),
    queryFn: async () => unwrap(await getCurrentUserDepartments()),
    ...options,
  });
};

export const useCurrentUserApplications = (options?: { enabled?: boolean }) => {
  return useQuery<ApplicationDTO[], Error>({
    queryKey: currentUserKeys.applications(),
    queryFn: async () => unwrap(await getCurrentUserApplications()),
    ...options,
  });
};

export function useUserApplications(
  userId: string,
  options?: { enabled?: boolean },
) {
  return useQuery<ApplicationDTO[], Error>({
    queryKey: userKeys.applications(userId),
    queryFn: async () => unwrap(await getUserApplications(userId)),
    enabled: !!userId,
    ...options,
  });
}

export function useUserDepartments(
  userId: string,
  options?: { enabled?: boolean },
) {
  return useQuery<DepartmentDTO[], Error>({
    queryKey: userKeys.departments(userId),
    queryFn: async () => unwrap(await getUserDepartments(userId)),
    enabled: !!userId,
    ...options,
  });
}

export function useUser(userId: string) {
  return useQuery(userByIdOptions(userId));
}

export function useCurrentUserFavoriteApplications(applicationName?: string) {
  return useQuery<ApplicationDTO[], Error>({
    queryKey: currentUserKeys.favoriteApplications(applicationName),
    queryFn: async () =>
      unwrap(await getCurrentUserFavoriteApplications(applicationName)),
  });
}

export function useAddCurrentUserFavoriteApplication() {
  const queryClient = useQueryClient();
  const { igrpToast } = useIGRPToast();

  return useMutation({
    mutationFn: async (variables: {
      applicationCode: string;
      app?: ApplicationDTO;
    }) => addCurrentUserFavoriteApplication(variables.applicationCode),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: currentUserKeys.favoriteApplicationsRoot(),
      });
      const previous = queryClient.getQueriesData<ApplicationDTO[]>({
        queryKey: currentUserKeys.favoriteApplicationsRoot(),
      });
      if (variables.app) {
        queryClient.setQueriesData<ApplicationDTO[]>(
          { queryKey: currentUserKeys.favoriteApplicationsRoot() },
          (old) => {
            if (!old) return old;
            if (old.some((fav) => fav.code === variables.applicationCode))
              return old;
            return [...old, variables.app as ApplicationDTO];
          },
        );
      }
      return { previous };
    },
    onError: (err, _variables, context) => {
      if (context?.previous) {
        for (const [key, data] of context.previous) {
          queryClient.setQueryData(key, data);
        }
      }
      igrpToast({
        type: "error",
        title: "Não foi possível atualizar os favoritos.",
        description: (err as Error).message,
        duration: 4000,
      });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: currentUserKeys.favoriteApplicationsRoot(),
      });
    },
  });
}

export function useRemoveCurrentUserFavoriteApplication() {
  const queryClient = useQueryClient();
  const { igrpToast } = useIGRPToast();

  return useMutation({
    mutationFn: async (applicationCode: string) =>
      removeCurrentUserFavoriteApplication(applicationCode),
    onMutate: async (applicationCode) => {
      await queryClient.cancelQueries({
        queryKey: currentUserKeys.favoriteApplicationsRoot(),
      });
      const previous = queryClient.getQueriesData<ApplicationDTO[]>({
        queryKey: currentUserKeys.favoriteApplicationsRoot(),
      });
      queryClient.setQueriesData<ApplicationDTO[]>(
        { queryKey: currentUserKeys.favoriteApplicationsRoot() },
        (old) => old?.filter((fav) => fav.code !== applicationCode),
      );
      return { previous };
    },
    onError: (err, _variables, context) => {
      if (context?.previous) {
        for (const [key, data] of context.previous) {
          queryClient.setQueryData(key, data);
        }
      }
      igrpToast({
        type: "error",
        title: "Não foi possível atualizar os favoritos.",
        description: (err as Error).message,
        duration: 4000,
      });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: currentUserKeys.favoriteApplicationsRoot(),
      });
    },
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
          queryKey: currentUserKeys.recentApplicationsRoot(),
        });
      }
    },
  });
}

export function useGetCurrentUserRecentApplications(applicationName?: string) {
  return useQuery<ApplicationDTO[], Error>({
    queryKey: currentUserKeys.recentApplications(applicationName),
    queryFn: async () =>
      unwrap(await getCurrentUserRecentApplications(applicationName)),
  });
}

export function useGetUserInvitations(
  email?: string,
  options?: { initialData?: InvitationDTO[] },
) {
  return useQuery({
    queryKey: invitationKeys.list(email),
    queryFn: async () => unwrap(await getUserInvitations(email)),
    initialData: options?.initialData,
  });
}

export function useResendUserInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => resendUserInvitation(id),
    onSuccess: async (result) => {
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: invitationKeys.all });
      }
    },
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
    onSuccess: async (result, { token }) => {
      if (result.success) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: invitationKeys.all }),
          queryClient.invalidateQueries({
            queryKey: invitationKeys.byToken(token),
          }),
        ]);
      }
    },
  });
}

export function useCancelUserInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => cancelUserInvitation(id),
    onSuccess: async (result) => {
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: invitationKeys.all });
      }
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, value }: { id: string; value: string }) =>
      updateUserStatus(id, value),
    onSuccess: async (result, variables) => {
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: userKeys.all });
        await queryClient.invalidateQueries({
          queryKey: userKeys.detail(variables.id),
        });
      }
    },
  });
}

export function useGetUserInvitationByToken(
  token: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: invitationKeys.byToken(token),
    queryFn: async () => unwrap(await getUserInvitationByToken(token)),
    ...options,
    enabled: !!token && (options?.enabled ?? true),
  });
}

export function useGetCurrentUserRoles() {
  return useQuery({
    queryKey: currentUserKeys.roles(),
    queryFn: async () => unwrap(await getCurrentUserRoles()),
  });
}

export function useCurrentUserActiveRole(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: currentUserKeys.activeRole(),
    queryFn: async () => unwrap(await getCurrentUserActiveRole()),
    ...options,
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
          queryKey: currentUserKeys.activeRole(),
        });
        await queryClient.invalidateQueries({
          queryKey: currentUserKeys.detail(),
        });
      }
    },
  });
}

export function useValidateInvitationEmail() {
  return useMutation({
    mutationFn: async (
      request: Parameters<typeof validateInvitationEmail>[0],
    ) => validateInvitationEmail(request),
  });
}

export function useValidateInvitationOtp() {
  return useMutation({
    mutationFn: async (request: Parameters<typeof validateInvitationOtp>[0]) =>
      validateInvitationOtp(request),
  });
}

export const useUserMetadata = (id: string) => {
  return useQuery<UserMetadataDTO, Error>({
    queryKey: userKeys.metadata(id),
    queryFn: async () => unwrap(await getUserMetadata(id)),
    enabled: !!id,
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
          queryKey: userKeys.metadata(variables.id),
        });
      }
    },
  });
};

export const useUserSession = (userExternalId: string) => {
  return useQuery<SessionResponseDTO, Error>({
    queryKey: userKeys.session(userExternalId),
    queryFn: async () => unwrap(await getUserSession(userExternalId)),
    enabled: !!userExternalId,
  });
};

export const useKillUserSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      reason,
    }: {
      sessionId: string;
      reason: string;
      userExternalId: string;
    }) => killUserSession(sessionId, reason),
    onSuccess: async (result, variables) => {
      if (result.success) {
        await queryClient.invalidateQueries({
          queryKey: userKeys.session(variables.userExternalId),
        });
      }
    },
  });
};

export const useUserAuditLogs = (userId: string, filters?: AuditLogFilters) => {
  return useQuery<PageResponse<AuditLogDTO>, Error>({
    queryKey: userKeys.auditLogs(userId, filters),
    queryFn: async () => unwrap(await getUserAuditLogs(userId, filters)),
    enabled: !!userId,
    placeholderData: keepPreviousData,
  });
};
