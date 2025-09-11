import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PermissionArgs } from './permissions-schemas';
import {
  PermissionFilters,
  UpdatePermissionRequest,
} from '@igrp/platform-access-management-client-ts';
import {
  createPermission,
  deletePermission,
  getPermissions,
  getRolesByPermissionName,
  updatePermission,
} from '@/actions/permission';
import { RoleArgs } from '../roles/role-schemas';

export const usePermissions = (params: PermissionFilters) => {
  return useQuery<PermissionArgs[]>({
    queryKey: ['permissions'],
    queryFn: () => getPermissions(params),
  });
};

export const useCreatePermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPermission,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['permissions'], exact: true });
      await queryClient.refetchQueries({ queryKey: ['permissions'], exact: true });
    },
  });
};

export const useUpdatePermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, data }: { name: string; data: UpdatePermissionRequest }) =>
      updatePermission(name, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['permissions'], exact: true });
      await queryClient.refetchQueries({ queryKey: ['permissions'], exact: true });
    },
  });
};

export const useDeletePermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => deletePermission(name),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['permissions'] });
      await queryClient.refetchQueries({ queryKey: ['permissions'], exact: true });
    },
  });
};

export const useRolesPermission = (name: string) => {
  return useQuery<RoleArgs[]>({
    queryKey: ['permissions'],
    queryFn: () => getRolesByPermissionName(name),
  });
};
