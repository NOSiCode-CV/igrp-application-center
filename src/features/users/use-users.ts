import type {
  CreateUserRequest,
  IGRPUserDTO,
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
  getUserRoles,
  getUsers,
  inviteUser,
  removeRolesFromUser,
  updateUser,
} from "@/actions/user";

export const useUsers = (params?: UserFilters, ids?: number[]) => {
  return useQuery<IGRPUserDTO[]>({
    queryKey: ["users"],
    queryFn: () => getUsers(params, ids),
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
    mutationFn: async ({ user }: { user: CreateUserRequest }) =>
      inviteUser(user),
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
      roleNames,
    }: {
      id: number;
      roleNames: string[];
    }) => addRolesToUser(id, roleNames),
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
      roleNames,
    }: {
      id: number;
      roleNames: string[];
    }) => removeRolesFromUser(id, roleNames),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users", "userRoles"] });
      await queryClient.refetchQueries({ queryKey: ["users", "userRoles"] });
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
    mutationFn: async ({
      id,
      user,
    }: {
      id: number;
      user: UpdateUserRequest;
    }) => updateUser(id, user),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      await queryClient.refetchQueries({ queryKey: ["users"] });
    },
  });
};
