import type {
  ApplicationDTO,
  CreateRoleRequest,
  DepartmentDTO,
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
  return useQuery<DepartmentDTO[], Error>({
    queryKey: ["departments"],
    queryFn: async () => {
      const result = await getDepartments();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    retry: false,
  });
};

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDepartment,
    onSuccess: async (result) => {
      if (result.success) {
        await queryClient.invalidateQueries({
          queryKey: ["departments"],
          exact: true,
        });
        await queryClient.refetchQueries({
          queryKey: ["departments"],
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
        await queryClient.invalidateQueries({ queryKey: ["departments"] });
        await queryClient.refetchQueries({
          queryKey: ["departments"],
          exact: true,
        });
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
        await queryClient.invalidateQueries({ queryKey: ["departments"] });
        await queryClient.refetchQueries({
          queryKey: ["departments"],
          exact: true,
        });
      }
    },
  });
};

export const useDepartmentByCode = (code?: string) => {
  return useQuery<DepartmentDTO, Error>({
    queryKey: ["department-by-code", code],
    queryFn: async () => {
      const result = await getDepartmentByCode(code || "");
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!code,
    retry: false,
  });
};

export const useDepartmentAvailableApps = (departmentCode?: string) => {
  return useQuery<ApplicationDTO[], Error>({
    queryKey: ["department-available-menus-for-roles", departmentCode],
    queryFn: async () => {
      const result = await getAvailableApplications(departmentCode!);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!departmentCode,
    retry: false,
  });
};

export const useDepartmentApplications = (params: {
  departmentCode: string;
}) => {
  return useQuery<ApplicationDTO[], Error>({
    queryKey: ["applications", { departmentCode: params.departmentCode }],
    queryFn: async () => {
      const result = await getDepartmentApplications(params.departmentCode);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!params.departmentCode,
    retry: false,
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
            queryKey: ["applications", { departmentCode: variables.code }],
          }),
          queryClient.invalidateQueries({
            queryKey: ["department-available-apps", variables.code],
          }),
          queryClient.invalidateQueries({
            queryKey: ["departments"],
          }),
          queryClient.invalidateQueries({
            queryKey: ["department-available-menus", variables.code],
          }),
          queryClient.invalidateQueries({
            queryKey: ["department-menus", variables.code],
          }),
        ]);

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
    queryKey: ["department-available-menus", appCode, departmentCode],
    queryFn: async () => {
      const result = await getAvailableMenus(appCode!, departmentCode!);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!appCode && !!departmentCode,
    retry: false,
  });
};

export const useDepartmentMenus = (
  appCode?: string,
  departmentCode?: string,
) => {
  return useQuery<MenuEntryDTO[], Error>({
    queryKey: ["department-menus", appCode, departmentCode],
    queryFn: async () => {
      const result = await getDepartmentMenus(appCode!, departmentCode!);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!appCode && !!departmentCode,
    retry: false,
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
    queryKey: ["roles", departmentCode],
    queryFn: async () => {
      if (!departmentCode) {
        return [];
      }
      const result = await getRoles(departmentCode, roleCode);
      if (!result.success) throw new Error(result.error);
      return result.data;
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
        await queryClient.invalidateQueries({ queryKey: ["roles"] });
        await queryClient.refetchQueries({ queryKey: ["roles"] });
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
        await queryClient.invalidateQueries({ queryKey: ["roles"] });
        await queryClient.refetchQueries({ queryKey: ["roles"] });
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
        await queryClient.invalidateQueries({ queryKey: ["roles"] });
        await queryClient.refetchQueries({
          queryKey: ["roles"],
          exact: true,
        });
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
      }
    },
  });
};

export const useAvailableResources = (departmentCode?: string) => {
  return useQuery({
    queryKey: ["available-resources", departmentCode],
    queryFn: async () => {
      const result = await getAvailableResources(departmentCode!);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!departmentCode,
    retry: false,
  });
};

export const useDepartmentResources = (departmentCode?: string) => {
  return useQuery({
    queryKey: ["department-resources", departmentCode],
    queryFn: async () => {
      const result = await getDepartmentResources(departmentCode!);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!departmentCode,
    retry: false,
  });
};

// PERMISSIONS
export const useDepartmentPermissions = (departmentCode?: string) => {
  return useQuery({
    queryKey: ["department-permissions", departmentCode],
    queryFn: async () => {
      const result = await getDepartmentPermissions(departmentCode!);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!departmentCode,
    retry: false,
  });
};

export const useAvailablePermissions = (departmentCode?: string) => {
  return useQuery({
    queryKey: ["available-permissions", departmentCode],
    queryFn: async () => {
      const result = await getAvailablePermissions(departmentCode!);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!departmentCode,
    retry: false,
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
          queryKey: ["departments"],
        });
        await queryClient.invalidateQueries({
          queryKey: ["department-permissions", variables.departmentCode],
        });
        await queryClient.invalidateQueries({
          queryKey: ["available-permissions", variables.departmentCode],
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
          queryKey: ["departments"],
        });
        await queryClient.invalidateQueries({
          queryKey: ["department-permissions", variables.departmentCode],
        });
        await queryClient.invalidateQueries({
          queryKey: ["available-permissions", variables.departmentCode],
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
        await queryClient.invalidateQueries({ queryKey: ["roles"] });
        await queryClient.invalidateQueries({
          queryKey: [
            "roleByName",
            variables.departmentCode,
            variables.roleCode,
          ],
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
        await queryClient.invalidateQueries({ queryKey: ["roles"] });
        await queryClient.invalidateQueries({
          queryKey: [
            "roleByName",
            variables.departmentCode,
            variables.roleCode,
          ],
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
      }
    },
  });
};

export const usePermissionsByRole = (
  departmentCode: string,
  roleCode: string,
) => {
  return useQuery({
    queryKey: ["roleByName", departmentCode, roleCode],
    queryFn: async () => {
      const result = await getPermissionsByRole(departmentCode, roleCode);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!departmentCode && !!roleCode,
    retry: false,
  });
};

export const useAvailablePermissionsForRole = (
  departmentCode: string,
  roleCode: string,
) => {
  return useQuery({
    queryKey: ["available-permissions-for-role", departmentCode, roleCode],
    queryFn: async () => {
      const result = await getAvailablePermissionsForRole(
        departmentCode,
        roleCode,
      );
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!departmentCode && !!roleCode,
    retry: false,
  });
};
