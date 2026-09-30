import type {
  ApplicationDTO,
  CreateRoleRequest,
  MenuEntryDTO,
  RoleDTO,
  UpdateDepartmentRequest,
  UpdateRoleRequest,
} from "@igrp/platform-access-management-client-ts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addApplicationsToDepartment,
  addMenusToDepartment,
  addPermissionsToDepartment,
  addPermissionsToRole,
  addResourcesToDepartment,
  createDepartment,
  createRole,
  deleteDepartment,
  deleteRole,
  getAvailableApplications,
  getAvailableMenus,
  getAvailablePermissions,
  getAvailablePermissionsForRole,
  getAvailableResources,
  getDepartmentApplications,
  getDepartmentMenus,
  getDepartmentPermissions,
  getDepartmentResources,
  getPermissionsByRole,
  getRoles,
  removeApplicationsFromDepartment,
  removeMenusFromDepartment,
  removePermissionsFromDepartment,
  removePermissionsFromRole,
  removeResourcesFromDepartment,
  updateDepartment,
  updateRole,
} from "@/actions/departments";
import { unwrap } from "@/actions/types";
import { applicationsKeys } from "@/features/applications/query-keys";

import { departmentKeys, roleKeys } from "./query-keys";
import {
  departmentByCodeOptions,
  departmentListOptions,
} from "./query-options";

export const useDepartments = () => {
  // unwrap throws HttpStatusError (not a plain Error) so a client-side fetch
  // failure routes to the status error page via the segment boundary,
  // matching the server prefetch in `prefetchDepartments`.
  return useQuery(departmentListOptions());
};

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDepartment,
    onSuccess: async (result) => {
      if (result.success) {
        await queryClient.invalidateQueries({
          queryKey: departmentKeys.list(),
          exact: true,
        });
      }
    },
  });
};

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      code,
      data,
    }: {
      code: string;
      data: UpdateDepartmentRequest;
    }) => updateDepartment(code, data),
    onSuccess: async (result) => {
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: departmentKeys.all });
      }
    },
  });
};

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => deleteDepartment(code),
    onSuccess: async (result) => {
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: departmentKeys.all });
      }
    },
  });
};

export const useDepartmentByCode = (code?: string) => {
  return useQuery(departmentByCodeOptions(code));
};

export const useDepartmentAvailableApps = (departmentCode?: string) => {
  return useQuery<ApplicationDTO[], Error>({
    queryKey: departmentKeys.availableApps(departmentCode),
    queryFn: async () => unwrap(await getAvailableApplications(departmentCode)),
    enabled: !!departmentCode,
  });
};

export const useDepartmentApplications = (params: {
  departmentCode: string;
}) => {
  return useQuery<ApplicationDTO[], Error>({
    queryKey: applicationsKeys.list({ departmentCode: params.departmentCode }),
    queryFn: async () =>
      unwrap(await getDepartmentApplications(params.departmentCode)),
    enabled: !!params.departmentCode,
  });
};

export const useAddApplicationsToDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      code,
      appCodes,
    }: {
      code: string;
      appCodes: string[];
    }) => addApplicationsToDepartment(code, appCodes),
    onSuccess: async (result, variables) => {
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: departmentKeys.all });

        await queryClient.invalidateQueries({
          queryKey: applicationsKeys.list({ departmentCode: variables.code }),
        });

        await queryClient.invalidateQueries({
          queryKey: departmentKeys.availableApps(variables.code),
        });

        // Prefix match (appCode slot only) so every cached menu query for this
        // application is invalidated regardless of its departmentCode.
        await queryClient.invalidateQueries({
          queryKey: ["department-available-menus", variables.code],
        });

        await queryClient.invalidateQueries({
          queryKey: ["department-menus", variables.code],
        });
      }
    },
  });
};

export const useRemoveApplicationsFromDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      code,
      appCodes,
    }: {
      code: string;
      appCodes: string[];
    }) => removeApplicationsFromDepartment(code, appCodes),
    onSuccess: async (result, variables) => {
      if (result.success) {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: applicationsKeys.list({ departmentCode: variables.code }),
          }),
          queryClient.invalidateQueries({
            queryKey: departmentKeys.availableApps(variables.code),
          }),
          queryClient.invalidateQueries({
            queryKey: departmentKeys.all,
          }),
          // Prefix match (appCode slot only) so every cached menu query for
          // this application is invalidated regardless of its departmentCode.
          queryClient.invalidateQueries({
            queryKey: ["department-available-menus", variables.code],
          }),
          queryClient.invalidateQueries({
            queryKey: ["department-menus", variables.code],
          }),
        ]);
      }
    },
  });
};

// MENUS
export const useDepartmentAvailableMenus = (
  appCode?: string,
  departmentCode?: string,
) => {
  return useQuery<MenuEntryDTO[], Error>({
    queryKey: departmentKeys.availableMenus(appCode, departmentCode),
    queryFn: async () =>
      unwrap(await getAvailableMenus(appCode, departmentCode)),
    enabled: !!appCode && !!departmentCode,
  });
};

export const useDepartmentMenus = (
  appCode?: string,
  departmentCode?: string,
) => {
  return useQuery<MenuEntryDTO[], Error>({
    queryKey: departmentKeys.menus(appCode, departmentCode),
    queryFn: async () =>
      unwrap(await getDepartmentMenus(appCode, departmentCode)),
    enabled: !!appCode && !!departmentCode,
  });
};

export const useAddMenusToDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      appCode,
      departmentCode,
      menuCodes,
    }: {
      appCode: string;
      departmentCode: string;
      menuCodes: string[];
    }) => addMenusToDepartment(appCode, departmentCode, menuCodes),
    onSuccess: async (result, variables) => {
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: departmentKeys.all });

        await queryClient.invalidateQueries({
          queryKey: departmentKeys.menus(
            variables.appCode,
            variables.departmentCode,
          ),
        });

        await queryClient.invalidateQueries({
          queryKey: departmentKeys.availableMenus(
            variables.appCode,
            variables.departmentCode,
          ),
        });
      }
    },
  });
};

export const useRemoveMenusFromDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      appCode,
      departmentCode,
      menuCodes,
    }: {
      appCode: string;
      departmentCode: string;
      menuCodes: string[];
    }) => removeMenusFromDepartment(appCode, departmentCode, menuCodes),
    onSuccess: async (result, variables) => {
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: departmentKeys.all });

        await queryClient.invalidateQueries({
          queryKey: departmentKeys.menus(
            variables.appCode,
            variables.departmentCode,
          ),
        });

        await queryClient.invalidateQueries({
          queryKey: departmentKeys.availableMenus(
            variables.appCode,
            variables.departmentCode,
          ),
        });
      }
    },
  });
};

// ROLES
export function useRoles(
  departmentCode: string,
  roleCode?: string | undefined,
  enabled = true,
) {
  return useQuery<RoleDTO[], Error>({
    queryKey: roleKeys.byDepartment(departmentCode),
    queryFn: async () => {
      if (!departmentCode) {
        return [];
      }
      return unwrap(await getRoles(departmentCode, roleCode));
    },
    enabled: enabled && !!departmentCode,
  });
}

export const useCreateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      departmentCode,
      role,
    }: {
      departmentCode: string;
      role: CreateRoleRequest;
    }) => createRole(departmentCode, role),
    onSuccess: async (result) => {
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: roleKeys.all });
      }
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      departmentCode,
      roleCode,
      role,
    }: {
      departmentCode: string;
      roleCode: string;
      role: UpdateRoleRequest;
    }) => updateRole(departmentCode, roleCode, role),
    onSuccess: async (result) => {
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: roleKeys.all });
      }
    },
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      departmentCode,
      roleCode,
    }: {
      departmentCode: string;
      roleCode: string;
    }) => deleteRole(departmentCode, roleCode),
    onSuccess: async (result) => {
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: roleKeys.all });
      }
    },
  });
};

// RESOURCES
export const useAddResourcesToDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      departmentCode,
      resourceCodes,
    }: {
      departmentCode: string;
      resourceCodes: string[];
    }) => addResourcesToDepartment(departmentCode, resourceCodes),
    onSuccess: async (result, variables) => {
      if (result.success) {
        await queryClient.invalidateQueries({
          queryKey: departmentKeys.all,
        });
        await queryClient.invalidateQueries({
          queryKey: departmentKeys.resources(variables.departmentCode),
        });
        await queryClient.invalidateQueries({
          queryKey: departmentKeys.availableResources(variables.departmentCode),
        });
        await queryClient.invalidateQueries({
          queryKey: departmentKeys.permissions(variables.departmentCode),
        });
        await queryClient.invalidateQueries({
          queryKey: departmentKeys.availablePermissions(
            variables.departmentCode,
          ),
        });
      }
    },
  });
};

export const useRemoveResourcesFromDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      departmentCode,
      resourceCodes,
    }: {
      departmentCode: string;
      resourceCodes: string[];
    }) => removeResourcesFromDepartment(departmentCode, resourceCodes),
    onSuccess: async (result, variables) => {
      if (result.success) {
        await queryClient.invalidateQueries({
          queryKey: departmentKeys.all,
        });
        await queryClient.invalidateQueries({
          queryKey: departmentKeys.resources(variables.departmentCode),
        });
        await queryClient.invalidateQueries({
          queryKey: departmentKeys.availableResources(variables.departmentCode),
        });
        await queryClient.invalidateQueries({
          queryKey: departmentKeys.permissions(variables.departmentCode),
        });
        await queryClient.invalidateQueries({
          queryKey: departmentKeys.availablePermissions(
            variables.departmentCode,
          ),
        });
      }
    },
  });
};

export const useAvailableResources = (departmentCode?: string) => {
  return useQuery({
    queryKey: departmentKeys.availableResources(departmentCode),
    queryFn: async () => unwrap(await getAvailableResources(departmentCode)),
    enabled: !!departmentCode,
  });
};

export const useDepartmentResources = (departmentCode?: string) => {
  return useQuery({
    queryKey: departmentKeys.resources(departmentCode),
    queryFn: async () => unwrap(await getDepartmentResources(departmentCode)),
    enabled: !!departmentCode,
  });
};

// PERMISSIONS
export const useDepartmentPermissions = (departmentCode?: string) => {
  return useQuery({
    queryKey: departmentKeys.permissions(departmentCode),
    queryFn: async () => unwrap(await getDepartmentPermissions(departmentCode)),
    enabled: !!departmentCode,
  });
};

export const useAvailablePermissions = (departmentCode?: string) => {
  return useQuery({
    queryKey: departmentKeys.availablePermissions(departmentCode),
    queryFn: async () => unwrap(await getAvailablePermissions(departmentCode)),
    enabled: !!departmentCode,
  });
};

export const useAddPermissionsToDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      departmentCode,
      permissionCodes,
    }: {
      departmentCode: string;
      permissionCodes: string[];
    }) => addPermissionsToDepartment(departmentCode, permissionCodes),
    onSuccess: async (result, variables) => {
      if (result.success) {
        await queryClient.invalidateQueries({
          queryKey: departmentKeys.all,
        });
        await queryClient.invalidateQueries({
          queryKey: departmentKeys.permissions(variables.departmentCode),
        });
        await queryClient.invalidateQueries({
          queryKey: departmentKeys.availablePermissions(
            variables.departmentCode,
          ),
        });
      }
    },
  });
};

export const useRemovePermissionsFromDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      departmentCode,
      permissionCodes,
    }: {
      departmentCode: string;
      permissionCodes: string[];
    }) => removePermissionsFromDepartment(departmentCode, permissionCodes),
    onSuccess: async (result, variables) => {
      if (result.success) {
        await queryClient.invalidateQueries({
          queryKey: departmentKeys.all,
        });
        await queryClient.invalidateQueries({
          queryKey: departmentKeys.permissions(variables.departmentCode),
        });
        await queryClient.invalidateQueries({
          queryKey: departmentKeys.availablePermissions(
            variables.departmentCode,
          ),
        });
      }
    },
  });
};

// PERMISSIONS BY ROLE
export const useAddPermissionsToRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      departmentCode,
      roleCode,
      permissionCodes,
    }: {
      departmentCode: string;
      roleCode: string;
      permissionCodes: string[];
    }) => addPermissionsToRole(departmentCode, roleCode, permissionCodes),
    onSuccess: async (result, variables) => {
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: roleKeys.all });
        await queryClient.invalidateQueries({
          queryKey: roleKeys.permissions(
            variables.departmentCode,
            variables.roleCode,
          ),
        });
        await queryClient.invalidateQueries({
          queryKey: roleKeys.availablePermissions(
            variables.departmentCode,
            variables.roleCode,
          ),
        });
        await queryClient.invalidateQueries({
          queryKey: departmentKeys.resources(variables.departmentCode),
        });
      }
    },
  });
};

export const useRemovePermissionsFromRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      departmentCode,
      roleCode,
      permissionCodes,
    }: {
      departmentCode: string;
      roleCode: string;
      permissionCodes: string[];
    }) => removePermissionsFromRole(departmentCode, roleCode, permissionCodes),
    onSuccess: async (result, variables) => {
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: roleKeys.all });
        await queryClient.invalidateQueries({
          queryKey: roleKeys.permissions(
            variables.departmentCode,
            variables.roleCode,
          ),
        });
        await queryClient.invalidateQueries({
          queryKey: roleKeys.availablePermissions(
            variables.departmentCode,
            variables.roleCode,
          ),
        });
        await queryClient.invalidateQueries({
          queryKey: departmentKeys.resources(variables.departmentCode),
        });
      }
    },
  });
};

export const usePermissionsByRole = (
  departmentCode: string,
  roleCode: string,
) => {
  return useQuery({
    queryKey: roleKeys.permissions(departmentCode, roleCode),
    queryFn: async () =>
      unwrap(await getPermissionsByRole(departmentCode, roleCode)),
    enabled: !!departmentCode && !!roleCode,
  });
};

export const useAvailablePermissionsForRole = (
  departmentCode: string,
  roleCode: string,
) => {
  return useQuery({
    queryKey: roleKeys.availablePermissions(departmentCode, roleCode),
    queryFn: async () =>
      unwrap(await getAvailablePermissionsForRole(departmentCode, roleCode)),
    enabled: !!departmentCode && !!roleCode,
  });
};
