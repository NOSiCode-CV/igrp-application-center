import type {
  ApplicationDTO,
  DepartmentDTO,
  IGRPUserDTO,
  InviteUserDTO,
  RoleDTO,
  UserFilters,
  UserInvitationResponseDTO,
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
  getCurrentUserApplications,
  getCurrentUserDepartments,
  getCurrentUserFavoriteApplications,
  getCurrentUserRecentApplications,
  getUser,
  getUserApplications,
  getUserDepartments,
  getUserInvitationByToken,
  getUserInvitations,
  getUserRoles,
  getUsers,
  inviteUser,
  registerCurrentUserApplicationAccess,
  removeCurrentUserFavoriteApplication,
  removeRolesFromUser,
  resendUserInvitation,
  respondUserInvitation,
  updateUser,
  updateUserStatus,
} from "@/actions/user";

export const useUsers = (params?: UserFilters) => {
  return useQuery<IGRPUserDTO[], Error>({
    queryKey: ["users"],
    queryFn: async () => {
      const result = await getUsers(params);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
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
      roleCodes,
    }: {
      id: number;
      departmentCode: string;
      roleCodes: string[];
    }) => addRolesToUser(id, departmentCode, roleCodes),
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
      id: number;
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

export const useUserRoles = (id: number) => {
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

export const useUserRolesMulti = (id: number[]) => {
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
    mutationFn: async ({ id, user }: { id: number; user: IGRPUserDTO }) =>
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
  userId: number,
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
  userId: number,
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

export function useUser(userId: number) {
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

export function useGetUserInvitations(email?: string) {
  return useQuery<any[], Error>({
    queryKey: ["user-invitations", email],
    queryFn: async () => {
      const result = await getUserInvitations(email);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
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
    mutationFn: async ({ id, value }: { id: number; value: string }) =>
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
  return useQuery<any, Error>({
    queryKey: ["user-invitation-by-token"],
    queryFn: async () => {
      const result = await getUserInvitationByToken(token);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    retry: false,
  });
}
