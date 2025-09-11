import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRoles, createRole, updateRole, deleteRole } from '@/actions/roles';
import { RoleArgs } from './role-schemas';
import { RoleFilters, UpdateRoleRequest } from '@igrp/platform-access-management-client-ts';

export const useRoles = (params: RoleFilters) => {
  return useQuery<RoleArgs[]>({
    queryKey: ['roles'],
    queryFn: () => getRoles(params),
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRole,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['roles'], exact: true });
      await queryClient.refetchQueries({ queryKey: ['roles'], exact: true });
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, data }: { name: string; data: UpdateRoleRequest }) =>
      updateRole(name, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['roles'] });
      await queryClient.refetchQueries({ queryKey: ['roles'], exact: true });
    },
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => deleteRole(name),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['roles'] });
      await queryClient.refetchQueries({ queryKey: ['roles'], exact: true });
    },
  });
};

// export const useRolePermissions = (roleId: number) => {
//   return useQuery({
//     queryKey: ['roles', roleId, 'permissions'],
//     queryFn: () => getRolePermissions(roleId),
//     enabled: !!roleId,
//   });
// };

// export const useAddRolePermissions = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: ({ roleId, permissions }: { roleId: number; permissions: any[] }) =>
//       addRolePermissions(roleId, permissions),
//     onSuccess: (_, variables) => {
//       queryClient.invalidateQueries({
//         queryKey: ['roles', variables.roleId, 'permissions'],
//       });
//     },
//   });
// };

// export const useRemoveRolePermissions = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: ({ roleId, permissions }: { roleId: number; permissions: any[] }) =>
//       removeRolePermissions(roleId, permissions),
//     onSuccess: (_, variables) => {
//       queryClient.invalidateQueries({
//         queryKey: ['roles', variables.roleId, 'permissions'],
//       });
//     },
//   });
// };
