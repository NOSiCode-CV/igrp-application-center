import type {
  IGRPUserDTO,
  InviteUserDTO,
  RoleDTO,
  UserFilters,
} from "@igrp/platform-access-management-client-ts";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  addRolesToUser,
  getCurrentUser,
  getCurrentUserApplications,
  getCurrentUserDepartments,
  getUser,
  getUserApplications,
  getUserDepartments,
  getUserRoles,
  getUsers,
  inviteUser,
  removeRolesFromUser,
  updateUser,
} from "@/actions/user";

export const useUsers = (params?: UserFilters) => {
  return useQuery<IGRPUserDTO[]>({
    queryKey: ["users"],
    queryFn: () => getUsers(params),
    retry: false,
    throwOnError: true,
  });
};

export const useCurrentUser = () => {
  return useQuery<IGRPUserDTO>({
    queryKey: ["current-user"],
    queryFn: async () => getCurrentUser(),
    retry: false,
    throwOnError: true,
  });
};

export const useInviteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user }: { user: InviteUserDTO }) => inviteUser(user),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      await queryClient.refetchQueries({ queryKey: ["users"] });
    },
    retry: false,
    throwOnError: true,
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      await queryClient.refetchQueries({ queryKey: ["users"] });
    },
    retry: false,
    throwOnError: true,
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
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["userRoles", variables.id],
      });
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    retry: false,
    throwOnError: true,
  });
};

export const useUserRoles = (id: number) => {
  return useQuery<RoleDTO[]>({
    queryKey: ["userRoles", id],
    queryFn: () => getUserRoles(id),
    enabled: !!id,
    retry: false,
    throwOnError: true,
  });
};

export const useUserRolesMulti = (id: number[]) => {
  return useQueries({
    queries: id.map((u) => ({
      queryKey: ["userRoles", u],
      queryFn: () => getUserRoles(u),
      enabled: !!u,
      retry: false,
      throwOnError: true,
    })),
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, user }: { id: number; user: IGRPUserDTO }) =>
      updateUser(id, user),
    onSuccess: async () => {
      await queryClient.refetchQueries({
        queryKey: ["users"],
        type: "active",
      });
    },
    retry: false,
    throwOnError: true,
  });
};

export const useCurrentUserDepartments = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["current-user-departments"],
    queryFn: async () => getCurrentUserDepartments(),
    ...options,
    retry: false,
    throwOnError: true,
  });
};

export const useCurrentUserApplications = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["current-user-applications"],
    queryFn: async () => getCurrentUserApplications(),
    ...options,
    retry: false,
    throwOnError: true,
  });
};

export function useUserApplications(
  userId: number,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ["user-applications", userId],
    queryFn: () => getUserApplications(userId),
    enabled: !!userId,
    ...options,
    retry: false,
    throwOnError: true,
  });
}

export function useUserDepartments(
  userId: number,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ["user-departments", userId],
    queryFn: () => getUserDepartments(userId),
    enabled: !!userId,
    ...options,
    retry: false,
    throwOnError: true,
  });
}

export function useUser(userId: number) {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: () => getUser(userId),
    enabled: !!userId,
    retry: false,
    throwOnError: true,
  });
}
