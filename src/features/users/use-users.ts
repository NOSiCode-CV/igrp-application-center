import type {
  CreateUserRequest,
  IGRPUserDTO,
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
  getUserRoles,
  getUsers,
  inviteUser,
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
      username,
      roleNames,
    }: {
      username: string;
      roleNames: string[];
    }) => addRolesToUser(username, roleNames),
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
      username,
      roleNames,
    }: {
      username: string;
      roleNames: string[];
    }) => addRolesToUser(username, roleNames),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users", "userRoles"] });
      await queryClient.refetchQueries({ queryKey: ["users", "userRoles"] });
    },
  });
};

// TODO: this is not working
export const useUserRoles = (username?: string) => {
  return useQuery<RoleDTO[]>({
    queryKey: ["userRoles", username],
    queryFn: () => getUserRoles(username ?? ""),
    enabled: !!username,
  });
};

export const useUserRolesMulti = (usernames: string[]) => {
  return useQueries({
    queries: usernames.map((u) => ({
      queryKey: ["userRoles", u],
      queryFn: () => getUserRoles(u),
      enabled: !!u,
    })),
  });
};
