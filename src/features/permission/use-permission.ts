import type {
  PermissionFilters,
  UpdatePermissionRequest,
} from "@igrp/platform-access-management-client-ts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createPermission,
  deletePermission,
  getPermissions,
  getRolesByPermissionName,
  updatePermission,
} from "@/actions/permission";
import type { RoleArgs } from "../roles/role-schemas";
import type { PermissionArgs } from "./permissions-schemas";

export const usePermissions = (params: PermissionFilters) => {
  return useQuery<PermissionArgs[]>({
    queryKey: ["permissions"],
    queryFn: () => getPermissions(params),
  });
};

export const useCreatePermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPermission,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["permissions"] });
      await queryClient.refetchQueries({ queryKey: ["permissions"] });
    },
  });
};

export const useUpdatePermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      data,
    }: {
      name: string;
      data: UpdatePermissionRequest;
    }) => updatePermission(name, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["permissions"] });
      await queryClient.refetchQueries({ queryKey: ["permissions"] });
    },
  });
};

export const useDeletePermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => deletePermission(name),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["permissions"] });
      await queryClient.refetchQueries({ queryKey: ["permissions"] });
    },
  });
};

export const useRolesPermission = (name: string) => {
  return useQuery<RoleArgs[]>({
    queryKey: ["permissions"],
    queryFn: () => getRolesByPermissionName(name),
  });
};
