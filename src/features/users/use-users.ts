import type {
  CreateUserRequest,
  IGRPUserDTO,
  InviteUserDTO,
  RoleDTO,
  UpdateUserRequest,
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
  });
};

export const useCurrentUser = () => {
  return useQuery<IGRPUserDTO>({
    queryKey: ["current-user"],
    queryFn: async () => getCurrentUser(),
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
  });
};

export const useUserRoles = (id: number) => {
  return useQuery<RoleDTO[]>({
    queryKey: ["userRoles", id],
    queryFn: () => getUserRoles(id),
    enabled: !!id,
  });
};

export const useUserRolesMulti = (id: number[]) => {
  return useQueries({
    queries: id.map((u) => ({
      queryKey: ["userRoles", u],
      queryFn: () => getUserRoles(u),
      enabled: !!u,
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
  });
};

export const useCurrentUserDepartments = () => {
  return useQuery({
    queryKey: ["current-user-departments"],
    queryFn: async () => getCurrentUserDepartments(),
  });
};

export const useCurrentUserApplications = () => {
  return useQuery({
    queryKey: ["current-user-applications"],
    queryFn: async () => getCurrentUserApplications(),
  });
};
