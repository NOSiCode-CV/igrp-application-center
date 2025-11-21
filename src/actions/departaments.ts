"use server";

import type {
  CreateDepartmentRequest,
  CreateRoleRequest,
  MenuEntryDTO,
  RoleDTO,
  UpdateDepartmentRequest,
  UpdateRoleRequest,
} from "@igrp/platform-access-management-client-ts";

import type { DepartmentArgs } from "@/features/departments/dept-schemas";
import { getClientAccess } from "./access-client";
import { ApplicationArgs } from "@/features/applications/app-schemas";
import { extractApiError } from "@/lib/utils";

export async function getDepartments() {
  const client = await getClientAccess();

  try {
    const result = await client.departments.getDepartments();
    return result.data as DepartmentArgs[];
  } catch (error) {
    console.error(
      "[departments] Não foi possível obter lista de dados dos departamentos:",
      error,
    );
    throw new Error(extractApiError(error));
  }
}

export async function createDepartment(
  departmentData: CreateDepartmentRequest,
) {
  const client = await getClientAccess();

  try {
    const result = await client.departments.createDepartment(departmentData);
    return result.data;
  } catch (error) {
    console.error(
      "[create-department] Não foi possível criar departamento:",
      error,
    );
    throw new Error(extractApiError(error));
  }
}

export async function updateDepartment(
  code: string,
  data: UpdateDepartmentRequest,
) {
  const client = await getClientAccess();

  try {
    const result = await client.departments.updateDepartment(code, data);
    return result.data;
  } catch (error) {
    console.error(
      "[update-department] Não foi possível eliminar departamento:",
      error,
    );
    throw new Error(extractApiError(error));
  }
}

export async function deleteDepartment(code: string) {
  const client = await getClientAccess();

  try {
    const result = await client.departments.deleteDepartment(code);
    return result.data;
  } catch (error) {
    console.error(
      "[delete-department] Não foi possível eliminar departamento:",
      error,
    );
    throw new Error(extractApiError(error));
  }
}

export async function getDepartmentByCode(code: string) {
  const client = await getClientAccess();

  try {
    const result = await client.departments.getDepartmentByCode(code);
    return result.data as DepartmentArgs;
  } catch (error) {
    console.error(
      "[department-by-code] Não foi possível obter lista de dados dos departamentos:",
      error,
    );
    throw new Error(extractApiError(error));
  }
}

// APPLICATIONS
export async function getAvailableApplications(departmentCode: string) {
  const client = await getClientAccess();
  try {
    const result =
      await client.departments.getAvailableApplications(departmentCode);
    return result.data as ApplicationArgs[];
  } catch (error) {
    console.error(
      "[department-available-menus-for-roles] Não foi possível obter lista de apps dos departamentos para roles:",
      error,
    );
    throw new Error(extractApiError(error));
  }
}

export async function getDepartmentApplications(departmentCode: string) {
  const client = await getClientAccess();
  try {
    const result =
      await client.departments.getDepartmentApplications(departmentCode);
    return result.data as ApplicationArgs[];
  } catch (error) {
    console.error(
      "[department-applications] Não foi possível obter lista de apps dos departamentos:",
      error,
    );
    throw new Error(extractApiError(error));
  }
}

export async function addApplicationsToDepartment(
  code: string,
  appCodes: string[],
) {
  const client = await getClientAccess();
  try {
    const result = await client.departments.addApplicationsToDepartment(
      code,
      appCodes,
    );
    return result.data;
  } catch (error) {
    console.error(
      "[department-add-applications] Não foi possível adicionar apps ao departamento:",
      error,
    );
    throw new Error(extractApiError(error));
  }
}

export async function removeApplicationsFromDepartment(
  code: string,
  appCodes: string[],
) {
  const client = await getClientAccess();
  try {
    const result = await client.departments.removeApplicationsFromDepartment(
      code,
      appCodes,
    );
    return result.data;
  } catch (error) {
    console.error(
      "[department-remove-applications] Não foi possível remover apps ao departamento:",
      error,
    );
    throw new Error(extractApiError(error));
  }
}

// MENU
export async function getAvailableMenus(
  appCode: string,
  departmentCode: string,
) {
  const client = await getClientAccess();

  try {
    const result = await client.departments.getAvailableMenus(
      appCode,
      departmentCode,
    );
    return result.data as MenuEntryDTO[];
  } catch (error) {
    console.error(
      "[department-available-menus] Não foi possível obter lista de menus dos departamentos:",
      error,
    );
    throw new Error(extractApiError(error));
  }
}

export async function getDepartmentMenus(
  appCode: string,
  departmentCode: string,
) {
  const client = await getClientAccess();
  try {
    const result = await client.departments.getDepartmentMenus(
      appCode,
      departmentCode,
    );
    return result.data as MenuEntryDTO[];
  } catch (error) {
    console.error(
      "[department-menus] Não foi possível obter lista de menus dos departamentos:",
      error,
    );
    throw new Error(extractApiError(error));
  }
}

export async function addMenusToDepartment(
  appCode: string,
  departmentCode: string,
  menuCodes: string[],
) {
  const client = await getClientAccess();
  try {
    const result = await client.departments.addMenusToDepartment(
      appCode,
      departmentCode,
      menuCodes,
    );
    return result.data;
  } catch (error) {
    console.error(
      "[department-add-menus] Não foi possível adicionar menus ao departamento:",
      error,
    );
    throw new Error(extractApiError(error));
  }
}

export async function removeMenusFromDepartment(
  appCode: string,
  departmentCode: string,
  menuCodes: string[],
) {
  const client = await getClientAccess();
  try {
    const result = await client.departments.removeMenusFromDepartment(
      appCode,
      departmentCode,
      menuCodes,
    );
    return result.data;
  } catch (error) {
    console.error(
      "[department-remove-menus] Não foi possível remover menus ao departamento:",
      error,
    );
    throw new Error(extractApiError(error));
  }
}

// ROLES
export async function getRoles(departmentCode: string, roleCode?: string) {
  const client = await getClientAccess();

  try {
    const result = await client.departments.getRoles(departmentCode, roleCode);
    return result.data as RoleDTO[];
  } catch (error) {
    console.error(
      "[roles] Não foi possível obter lista de dados dos perfís:",
      error,
    );
    throw new Error(extractApiError(error));
  }
}

export async function createRole(
  departmentCode: string,
  role: CreateRoleRequest,
) {
  const client = await getClientAccess();

  try {
    const result = await client.departments.createRole(departmentCode, role);
    return result.data as RoleDTO;
  } catch (error) {
    console.error("[create-roles] Não foi possível criar perfil:", error);
    throw new Error(extractApiError(error));
  }
}

export async function updateRole(
  departmentCode: string,
  roleCode: string,
  role: UpdateRoleRequest,
) {
  const client = await getClientAccess();

  try {
    const result = await client.departments.updateRole(
      departmentCode,
      roleCode,
      role,
    );
    return result.data as RoleDTO;
  } catch (error) {
    console.error(
      `[update-roles] Não foi possível atualizar perfil ${roleCode}:`,
      error,
    );
    throw new Error(extractApiError(error));
  }
}

export async function deleteRole(departmentCode: string, roleCode: string) {
  const client = await getClientAccess();
  try {
    const result = await client.departments.deleteRole(
      departmentCode,
      roleCode,
    );
    return result;
  } catch (error: any) {
    if (error?.status === 204 || error?.status === 0) {
      return { success: true, code: roleCode };
    }
    console.error(
      `[delete-role] Não foi possível eliminar perfil ${roleCode}:`,
      error,
    );
    throw new Error(extractApiError(error));
  }
}

export async function addPermissionsToRole(
  departmentCode: string,
  roleCode: string,
  permissionCodes: string[],
) {
  const client = await getClientAccess();

  try {
    const result = await client.departments.addPermissionsToRole(
      departmentCode,
      roleCode,
      permissionCodes,
    );
    return result.data as RoleDTO;
  } catch (error) {
    console.error(
      `[add-permissions-role] Não foi possível adicionar permissões a perfíl ${roleCode}:`,
      error,
    );
    throw new Error(extractApiError(error));
  }
}

export async function removePermissionsFromRole(
  departmentCode: string,
  roleCode: string,
  permissionCodes: string[],
) {
  const client = await getClientAccess();

  try {
    const result = await client.departments.removePermissionsFromRole(
      departmentCode,
      roleCode,
      permissionCodes,
    );
    return result.data as RoleDTO;
  } catch (error) {
    console.error(
      `[remove-permissions-role] Não foi possível remover permissões a perfíl ${roleCode}:`,
      error,
    );
    throw new Error(extractApiError(error));
  }
}

export async function getPermissionsByRoleCode(
  departmentCode: string,
  roleCode: string,
) {
  const client = await getClientAccess();

  try {
    const result = await client.departments.getAvailablePermissionsForRole(
      departmentCode,
      roleCode,
    );
    return result.data;
  } catch (error) {
    console.error(
      `[role-by-name] Não foi possível obter dados de permissões de perfil ${name}:`,
      error,
    );
    throw new Error(extractApiError(error));
  }
}

// RESOURCES
export async function addResourcesToDepartment(
  departmentCode: string,
  resourceCodes: string[],
) {
  const client = await getClientAccess();

  try {
    const result = await client.departments.addResourcesToDepartment(
      departmentCode,
      resourceCodes,
    );
    return result.data;
  } catch (error) {
    console.error(
      `[add-resources-department] Não foi possível adicionar recursos ao departamento ${resourceCodes}:`,
      error,
    );
    throw new Error(extractApiError(error));
  }
}

export async function removeResourcesFromDepartment(
  departmentCode: string,
  resourceCodes: string[],
) {
  const client = await getClientAccess();

  try {
    const result = await client.departments.removeResourcesFromDepartment(
      departmentCode,
      resourceCodes,
    );
    return result.data;
  } catch (error) {
    console.error(
      `[remove-resources-department] Não foi possível remover recursos ao departamento ${resourceCodes}:`,
      error,
    );
    throw new Error(extractApiError(error));
  }
}

export async function getAvailableResources(departmentCode: string) {
  const client = await getClientAccess();

  try {
    const result =
      await client.departments.getAvailableResources(departmentCode);
    return result.data;
  } catch (error) {
    console.error(
      `[available-resources-department] Não foi possível obter recursos disponíveis do departamento ${departmentCode}:`,
      error,
    );
    throw new Error(extractApiError(error));
  }
}

export async function getDepartmentResources(departmentCode: string) {
  const client = await getClientAccess();

  try {
    const result =
      await client.departments.getDepartmentResources(departmentCode);
    return result.data;
  } catch (error) {
    console.error(
      `[department-resources] Não foi possível obter recursos do departamento ${departmentCode}:`,
      error,
    );
    throw new Error(extractApiError(error));
  }
}

// PERMISSIONS
export async function getDepartmentPermissions(departmentCode: string) {
  const client = await getClientAccess();

  try {
    const result =
      await client.departments.getDepartmentPermissions(departmentCode);
    return result.data;
  } catch (error) {
    console.error(
      `[department-permissions] Não foi possível obter permissões do departamento ${departmentCode}:`,
      error,
    );
    throw new Error(extractApiError(error));
  }
}

export async function getAvailablePermissions(departmentCode: string) {
  const client = await getClientAccess();

  try {
    const result =
      await client.departments.getAvailablePermissions(
        departmentCode,
      );
    return result.data;
  } catch (error) {
    console.error(
      `[available-department-permissions] Não foi possível obter permissões disponíveis do departamento ${departmentCode}:`,
      error,
    );
    throw new Error(extractApiError(error));
  }
}

export async function addPermissionsToDepartment(
  departmentCode: string,
  permissionCodes: string[],
) {
  const client = await getClientAccess();

  try {
    const result = await client.departments.addPermissionsToDepartment(
      departmentCode,
      permissionCodes,
    );
    return result.data;
  } catch (error) {
    console.error(
      `[add-department-permissions] Não foi possível adicionar permissões ao departamento ${departmentCode}:`,
      error,
    );
    throw new Error(extractApiError(error));
  }
}

export async function removePermissionsFromDepartment(
  departmentCode: string,
  permissionCodes: string[],
) {
  const client = await getClientAccess();

  try {
    const result = await client.departments.removePermissionsFromDepartment(
      departmentCode,
      permissionCodes,
    );
    return result.data;
  } catch (error) {
    console.error(
      `[remove-department-permissions] Não foi possível remover permissões ao departamento ${departmentCode}:`,
      error,
    );
    throw new Error(extractApiError(error));
  }
}