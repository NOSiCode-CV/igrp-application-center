import type {
  RoleFilters,
  UpdateRoleRequest,
} from "@igrp/platform-access-management-client-ts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addPermissionsToRole,
  createRole,
  deleteRole,
  getPermissionsByRoleName,
  getRoleByName,
  getRoles,
  updateRole,
} from "@/actions/roles";
import type { PermissionArgs } from "../permission/permissions-schemas";
import type { RoleArgs } from "./role-schemas";

type RoleFiltersArgs = RoleFilters & {
  enabled?: boolean;
};
export function useRoles({ departmentCode, enabled = true }: RoleFiltersArgs) {
  return useQuery({
    queryKey: ["roles", departmentCode],
    queryFn: () => {
      if (!departmentCode) {
        return [];
      }
      return getRoles({ departmentCode });
    },
    enabled: enabled && !!departmentCode,
    // staleTime: 60_000,
  });
}

export const useCreateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRole,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["roles"] });
      await queryClient.refetchQueries({ queryKey: ["roles"] });
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      data,
    }: {
      name: string;
      data: UpdateRoleRequest;
    }) => updateRole(name, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["roles"] });
      await queryClient.refetchQueries({ queryKey: ["roles"] });
    },
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => deleteRole(name),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["roles"] });
      await queryClient.refetchQueries({ queryKey: ["roles"] });
    },
  });
};

export const useRoleByName = (name: string) => {
  return useQuery<RoleArgs>({
    queryKey: ["roleByName", name.toLowerCase()] as const,
    queryFn: () => getRoleByName(name),
    enabled: !!name,
  });
};

export const useAddPermissionsToRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      permissionNames,
    }: {
      name: string;
      permissionNames: string[];
    }) => addPermissionsToRole(name, permissionNames),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["roles"] });
      await queryClient.refetchQueries({ queryKey: ["roles"] });
    },
  });
};

export const useRemovePermissionsFromRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      permissionNames,
    }: {
      name: string;
      permissionNames: string[];
    }) => addPermissionsToRole(name, permissionNames),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["roles"] });
      await queryClient.refetchQueries({ queryKey: ["roles"] });
    },
  });
};

export const usePermissionsByRoleByName = (name: string) => {
  return useQuery<PermissionArgs[]>({
    queryKey: ["roleByName", name.toLowerCase()] as const,
    queryFn: () => getPermissionsByRoleName(name),
    enabled: !!name,
  });
};
