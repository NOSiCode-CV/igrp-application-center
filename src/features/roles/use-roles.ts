import type {
  RoleFilters,
  UpdateRoleRequest,
} from "@igrp/platform-access-management-client-ts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addPermissionsToRole,
  createRole,
  deleteRole,
  getPermissionsByRoleCode,
  getRoleByCode,
  getRoles,
  updateRole,
} from "@/actions/roles";
import type { PermissionArgs } from "../permissions/permissions-schemas";
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
    mutationFn: deleteRole,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["roles"] });
      await queryClient.refetchQueries({
        queryKey: ["roles"],
        exact: true,
      });
    },
  });
};

export const useRoleByCode = (name: string) => {
  return useQuery<RoleArgs>({
    queryKey: ["roleByCode", name.toLowerCase()] as const,
    queryFn: () => getRoleByCode(name),
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

export const usePermissionsByRoleByCode = (name: string) => {
  return useQuery<PermissionArgs[]>({
    queryKey: ["roleByName", name.toLowerCase()] as const,
    queryFn: () => getPermissionsByRoleCode(name),
    enabled: !!name,
  });
};
