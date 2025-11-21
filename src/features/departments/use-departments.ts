import type {
  ApplicationDTO,
  CreateRoleRequest,
  DepartmentDTO,
  MenuEntryDTO,
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
  getDepartmentByCode,
  getDepartmentMenus,
  getDepartmentPermissions,
  getDepartmentResources,
  getDepartments,
  getPermissionsByRole,
  getRoles,
  removeApplicationsFromDepartment,
  removeMenusFromDepartment,
  removePermissionsFromDepartment,
  removePermissionsFromRole,
  removeResourcesFromDepartment,
  updateDepartment,
  updateRole,
} from "@/actions/departaments";

export const useDepartments = () => {
  return useQuery<DepartmentDTO[]>({
    queryKey: ["departments"],
    queryFn: () => getDepartments(),
  });
};

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDepartment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["departments"],
        exact: true,
      });
      await queryClient.refetchQueries({
        queryKey: ["departments"],
        exact: true,
      });
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["departments"] });
      await queryClient.refetchQueries({
        queryKey: ["departments"],
        exact: true,
      });
    },
  });
};

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => deleteDepartment(code),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["departments"] });
      await queryClient.refetchQueries({
        queryKey: ["departments"],
        exact: true,
      });
    },
  });
};

export const useDepartmentByCode = (code?: string) => {
  return useQuery<DepartmentDTO>({
    queryKey: ["department-by-code", code],
    queryFn: () => getDepartmentByCode(code || ""),
    enabled: !!code,
  });
};

export const useDepartmentAvailableApps = (departmentCode?: string) => {
  return useQuery<ApplicationDTO[]>({
    queryKey: ["department-available-menus-for-roles", departmentCode],
    queryFn: () => getAvailableApplications(departmentCode!),
    enabled: !!departmentCode,
  });
};

export const useDepartmentApplications = (params: {
  departmentCode: string;
}) => {
  return useQuery<ApplicationDTO[]>({
    queryKey: ["applications", { departmentCode: params.departmentCode }],
    queryFn: () => getDepartmentApplications(params.departmentCode),
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
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["departments"] });

      await queryClient.invalidateQueries({
        queryKey: ["applications", { departmentCode: variables.code }],
      });

      await queryClient.invalidateQueries({
        queryKey: ["department-available-apps", variables.code],
      });

      await queryClient.invalidateQueries({
        queryKey: ["department-available-menus", variables.code],
      });

      await queryClient.invalidateQueries({
        queryKey: ["department-menus", variables.code],
      });

      await queryClient.refetchQueries({
        queryKey: ["departments"],
        exact: true,
      });

      await queryClient.refetchQueries({
        queryKey: ["departments"],
        exact: true,
      });
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
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["applications", { departmentCode: variables.code }],
        }),
        queryClient.invalidateQueries({
          queryKey: ["department-available-apps", variables.code],
        }),
        queryClient.invalidateQueries({
          queryKey: ["departments"],
        }),
      ]);
      queryClient.invalidateQueries({
        queryKey: ["department-available-menus", variables.code],
      }),
        queryClient.invalidateQueries({
          queryKey: ["department-menus", variables.code],
        }),
        await Promise.all([
          queryClient.refetchQueries({
            queryKey: ["applications", { departmentCode: variables.code }],
            type: "active",
          }),
          queryClient.refetchQueries({
            queryKey: ["department-available-apps", variables.code],
            type: "active",
          }),
        ]);
    },
  });
};

// MENUS
export const useDepartmentAvailableMenus = (
  appCode?: string,
  departmentCode?: string,
) => {
  return useQuery<MenuEntryDTO[]>({
    queryKey: ["department-available-menus", appCode, departmentCode],
    queryFn: () => getAvailableMenus(appCode!, departmentCode!),
    enabled: !!appCode && !!departmentCode,
  });
};

export const useDepartmentMenus = (
  appCode?: string,
  departmentCode?: string,
) => {
  return useQuery<MenuEntryDTO[]>({
    queryKey: ["department-menus", appCode, departmentCode],
    queryFn: () => getDepartmentMenus(appCode!, departmentCode!),
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
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["departments"] });

      await queryClient.invalidateQueries({
        queryKey: [
          "department-menus",
          variables.appCode,
          variables.departmentCode,
        ],
      });

      await queryClient.invalidateQueries({
        queryKey: [
          "department-available-menus",
          variables.appCode,
          variables.departmentCode,
        ],
      });

      await queryClient.refetchQueries({
        queryKey: ["departments"],
        exact: true,
      });
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
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["departments"] });

      await queryClient.invalidateQueries({
        queryKey: [
          "department-menus",
          variables.appCode,
          variables.departmentCode,
        ],
      });

      await queryClient.invalidateQueries({
        queryKey: [
          "department-available-menus",
          variables.appCode,
          variables.departmentCode,
        ],
      });

      await queryClient.refetchQueries({
        queryKey: ["departments"],
        exact: true,
      });
    },
  });
};

// ROLES
export function useRoles(
  departmentCode: string,
  roleCode?: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: ["roles", departmentCode],
    queryFn: () => {
      if (!departmentCode) {
        return [];
      }
      return getRoles(departmentCode, roleCode);
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
      departmentCode,
      roleCode,
      role,
    }: {
      departmentCode: string;
      roleCode: string;
      role: UpdateRoleRequest;
    }) => updateRole(departmentCode, roleCode, role),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["roles"] });
      await queryClient.refetchQueries({ queryKey: ["roles"] });
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["roles"] });
      await queryClient.refetchQueries({
        queryKey: ["roles"],
        exact: true,
      });
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
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["departments"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["department-resources", variables.departmentCode],
      });
      await queryClient.invalidateQueries({
        queryKey: ["available-resources", variables.departmentCode],
      });
      await queryClient.invalidateQueries({
        queryKey: ["department-permissions", variables.departmentCode],
      });
      await queryClient.invalidateQueries({
        queryKey: ["available-permissions", variables.departmentCode],
      });
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
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["departments"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["department-resources", variables.departmentCode],
      });
      await queryClient.invalidateQueries({
        queryKey: ["available-resources", variables.departmentCode],
      });
      await queryClient.invalidateQueries({
        queryKey: ["department-permissions", variables.departmentCode],
      });
      await queryClient.invalidateQueries({
        queryKey: ["available-permissions", variables.departmentCode],
      });
    },
  });
};

export const useAvailableResources = (departmentCode?: string) => {
  return useQuery({
    queryKey: ["available-resources", departmentCode],
    queryFn: () => getAvailableResources(departmentCode!),
    enabled: !!departmentCode,
  });
};

export const useDepartmentResources = (departmentCode?: string) => {
  return useQuery({
    queryKey: ["department-resources", departmentCode],
    queryFn: () => getDepartmentResources(departmentCode!),
    enabled: !!departmentCode,
  });
};

// PERMISSIONS
export const useDepartmentPermissions = (departmentCode?: string) => {
  return useQuery({
    queryKey: ["department-permissions", departmentCode],
    queryFn: () => getDepartmentPermissions(departmentCode!),
    enabled: !!departmentCode,
  });
};

export const useAvailablePermissions = (departmentCode?: string) => {
  return useQuery({
    queryKey: ["available-permissions", departmentCode],
    queryFn: () => getAvailablePermissions(departmentCode!),
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
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["departments"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["department-permissions", variables.departmentCode],
      });
      await queryClient.invalidateQueries({
        queryKey: ["available-permissions", variables.departmentCode],
      });
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
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["departments"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["department-permissions", variables.departmentCode],
      });
      await queryClient.invalidateQueries({
        queryKey: ["available-permissions", variables.departmentCode],
      });
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
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["roles"] });
      await queryClient.invalidateQueries({
        queryKey: ["roleByName", variables.departmentCode, variables.roleCode],
      });
      await queryClient.invalidateQueries({
        queryKey: [
          "available-permissions-for-role",
          variables.departmentCode,
          variables.roleCode,
        ],
      });
      await queryClient.invalidateQueries({
        queryKey: ["department-resources", variables.departmentCode],
      });
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
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["roles"] });
      await queryClient.invalidateQueries({
        queryKey: ["roleByName", variables.departmentCode, variables.roleCode],
      });
      await queryClient.invalidateQueries({
        queryKey: [
          "available-permissions-for-role",
          variables.departmentCode,
          variables.roleCode,
        ],
      });
      await queryClient.invalidateQueries({
        queryKey: ["department-resources", variables.departmentCode],
      });
    },
  });
};

export const usePermissionsByRole = (
  departmentCode: string,
  roleCode: string,
) => {
  return useQuery({
    queryKey: ["roleByName", departmentCode, roleCode],
    queryFn: () => getPermissionsByRole(departmentCode, roleCode),
    enabled: !!departmentCode && !!roleCode,
  });
};

export const useAvailablePermissionsForRole = (
  departmentCode: string,
  roleCode: string,
) => {
  return useQuery({
    queryKey: ["available-permissions-for-role", departmentCode, roleCode],
    queryFn: () => getAvailablePermissionsForRole(departmentCode, roleCode),
    enabled: !!departmentCode && !!roleCode,
  });
};
