"use server";

import type {
  ApplicationDTO,
  CreateDepartmentRequest,
  CreateRoleRequest,
  DepartmentDTO,
  MenuEntryDTO,
  RoleDTO,
  UpdateDepartmentRequest,
  UpdateRoleRequest,
} from "@igrp/platform-access-management-client-ts";

import { getClientAccess } from "./access-client";
import { extractApiError } from "@/lib/utils";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function getDepartments(): Promise<ActionResult<DepartmentDTO[]>> {
  const client = await getClientAccess();

  try {
    const result = await client.departments.getDepartments();
    return { success: true, data: result.data as DepartmentDTO[] };
  } catch (error) {
    console.error("[departments] Erro ao carregar departamentos:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function createDepartment(
  departmentData: CreateDepartmentRequest,
): Promise<ActionResult<any>> {
  const client = await getClientAccess();

  try {
    const result = await client.departments.createDepartment(departmentData);
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[create-department] Erro ao criar departamento:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function updateDepartment(
  code: string,
  data: UpdateDepartmentRequest,
): Promise<ActionResult<any>> {
  const client = await getClientAccess();

  try {
    const result = await client.departments.updateDepartment(code, data);
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[update-department] Erro ao atualizar departamento:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function deleteDepartment(
  code: string,
): Promise<ActionResult<any>> {
  const client = await getClientAccess();

  try {
    const result = await client.departments.deleteDepartment(code);
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[delete-department] Erro ao eliminar departamento:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function getDepartmentByCode(
  code: string,
): Promise<ActionResult<DepartmentDTO>> {
  const client = await getClientAccess();

  try {
    const result = await client.departments.getDepartmentByCode(code);
    return { success: true, data: result.data as DepartmentDTO };
  } catch (error) {
    console.error("[department-by-code] Erro ao obter departamento:", error);
    return { success: false, error: extractApiError(error) };
  }
}

// APPLICATIONS
export async function getAvailableApplications(
  departmentCode: string,
): Promise<ActionResult<ApplicationDTO[]>> {
  const client = await getClientAccess();
  try {
    const result =
      await client.departments.getAvailableApplications(departmentCode);
    return { success: true, data: result.data as ApplicationDTO[] };
  } catch (error) {
    console.error("[department-available-apps] Erro:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function getDepartmentApplications(
  departmentCode: string,
): Promise<ActionResult<ApplicationDTO[]>> {
  const client = await getClientAccess();
  try {
    const result =
      await client.departments.getDepartmentApplications(departmentCode);
    return { success: true, data: result.data as ApplicationDTO[] };
  } catch (error) {
    console.error("[department-applications] Erro:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function addApplicationsToDepartment(
  code: string,
  appCodes: string[],
): Promise<ActionResult<any>> {
  const client = await getClientAccess();
  try {
    const result = await client.departments.addApplicationsToDepartment(
      code,
      appCodes,
    );
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[department-add-applications] Erro:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function removeApplicationsFromDepartment(
  code: string,
  appCodes: string[],
): Promise<ActionResult<any>> {
  const client = await getClientAccess();
  try {
    const result = await client.departments.removeApplicationsFromDepartment(
      code,
      appCodes,
    );
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[department-remove-applications] Erro:", error);
    return { success: false, error: extractApiError(error) };
  }
}

// MENU
export async function getAvailableMenus(
  appCode: string,
  departmentCode: string,
): Promise<ActionResult<MenuEntryDTO[]>> {
  const client = await getClientAccess();

  try {
    const result = await client.departments.getAvailableMenus(
      appCode,
      departmentCode,
    );
    return { success: true, data: result.data as MenuEntryDTO[] };
  } catch (error) {
    console.error("[department-available-menus] Erro:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function getDepartmentMenus(
  appCode: string,
  departmentCode: string,
): Promise<ActionResult<MenuEntryDTO[]>> {
  const client = await getClientAccess();
  try {
    const result = await client.departments.getDepartmentMenus(
      appCode,
      departmentCode,
    );
    return { success: true, data: result.data as MenuEntryDTO[] };
  } catch (error) {
    console.error("[department-menus] Erro:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function addMenusToDepartment(
  appCode: string,
  departmentCode: string,
  menuCodes: string[],
): Promise<ActionResult<any>> {
  const client = await getClientAccess();
  try {
    const result = await client.departments.addMenusToDepartment(
      appCode,
      departmentCode,
      menuCodes,
    );
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[department-add-menus] Erro:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function removeMenusFromDepartment(
  appCode: string,
  departmentCode: string,
  menuCodes: string[],
): Promise<ActionResult<any>> {
  const client = await getClientAccess();
  try {
    const result = await client.departments.removeMenusFromDepartment(
      appCode,
      departmentCode,
      menuCodes,
    );
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[department-remove-menus] Erro:", error);
    return { success: false, error: extractApiError(error) };
  }
}

// ROLES
export async function getRoles(
  departmentCode: string,
  roleCode?: string,
): Promise<ActionResult<RoleDTO[]>> {
  const client = await getClientAccess();

  try {
    const result = await client.departments.getRoles(departmentCode, roleCode);
    return { success: true, data: result.data as RoleDTO[] };
  } catch (error) {
    console.error("[roles] Erro ao obter perfis:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function createRole(
  departmentCode: string,
  role: CreateRoleRequest,
): Promise<ActionResult<RoleDTO>> {
  const client = await getClientAccess();

  try {
    const result = await client.departments.createRole(departmentCode, role);
    return { success: true, data: result.data as RoleDTO };
  } catch (error) {
    console.error("[create-roles] Erro ao criar perfil:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function updateRole(
  departmentCode: string,
  roleCode: string,
  role: UpdateRoleRequest,
): Promise<ActionResult<RoleDTO>> {
  const client = await getClientAccess();

  try {
    const result = await client.departments.updateRole(
      departmentCode,
      roleCode,
      role,
    );
    return { success: true, data: result.data as RoleDTO };
  } catch (error) {
    console.error(
      `[update-roles] Erro ao atualizar perfil ${roleCode}:`,
      error,
    );
    return { success: false, error: extractApiError(error) };
  }
}

export async function deleteRole(
  departmentCode: string,
  roleCode: string,
): Promise<ActionResult<any>> {
  const client = await getClientAccess();
  try {
    const result = await client.departments.deleteRole(
      departmentCode,
      roleCode,
    );
    return { success: true, data: { code: roleCode } };
  } catch (error: any) {
    if (error?.status === 204 || error?.status === 0) {
      return { success: true, data: { code: roleCode } };
    }
    console.error(`[delete-role] Erro ao eliminar perfil ${roleCode}:`, error);
    return { success: false, error: extractApiError(error) };
  }
}

// RESOURCES
export async function addResourcesToDepartment(
  departmentCode: string,
  resourceCodes: string[],
): Promise<ActionResult<any>> {
  const client = await getClientAccess();

  try {
    const result = await client.departments.addResourcesToDepartment(
      departmentCode,
      resourceCodes,
    );
    return { success: true, data: result.data };
  } catch (error) {
    console.error(`[add-resources-department] Erro:`, error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function removeResourcesFromDepartment(
  departmentCode: string,
  resourceCodes: string[],
): Promise<ActionResult<any>> {
  const client = await getClientAccess();

  try {
    const result = await client.departments.removeResourcesFromDepartment(
      departmentCode,
      resourceCodes,
    );
    return { success: true, data: result.data };
  } catch (error) {
    console.error(`[remove-resources-department] Erro:`, error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function getAvailableResources(
  departmentCode: string,
): Promise<ActionResult<any>> {
  const client = await getClientAccess();

  try {
    const result =
      await client.departments.getAvailableResources(departmentCode);
    return { success: true, data: result.data };
  } catch (error) {
    console.error(`[available-resources-department] Erro:`, error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function getDepartmentResources(
  departmentCode: string,
): Promise<ActionResult<any>> {
  const client = await getClientAccess();

  try {
    const result =
      await client.departments.getDepartmentResources(departmentCode);
    return { success: true, data: result.data };
  } catch (error) {
    console.error(`[department-resources] Erro:`, error);
    return { success: false, error: extractApiError(error) };
  }
}

// PERMISSIONS
export async function getDepartmentPermissions(
  departmentCode: string,
): Promise<ActionResult<any>> {
  const client = await getClientAccess();

  try {
    const result =
      await client.departments.getDepartmentPermissions(departmentCode);
    return { success: true, data: result.data };
  } catch (error) {
    console.error(`[department-permissions] Erro:`, error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function getAvailablePermissions(
  departmentCode: string,
): Promise<ActionResult<any>> {
  const client = await getClientAccess();

  try {
    const result =
      await client.departments.getAvailablePermissions(departmentCode);
    return { success: true, data: result.data };
  } catch (error) {
    console.error(`[available-department-permissions] Erro:`, error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function addPermissionsToDepartment(
  departmentCode: string,
  permissionCodes: string[],
): Promise<ActionResult<any>> {
  const client = await getClientAccess();

  try {
    const result = await client.departments.addPermissionsToDepartment(
      departmentCode,
      permissionCodes,
    );
    return { success: true, data: result.data };
  } catch (error) {
    console.error(`[add-department-permissions] Erro:`, error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function removePermissionsFromDepartment(
  departmentCode: string,
  permissionCodes: string[],
): Promise<ActionResult<any>> {
  const client = await getClientAccess();

  try {
    const result = await client.departments.removePermissionsFromDepartment(
      departmentCode,
      permissionCodes,
    );
    return { success: true, data: result.data };
  } catch (error) {
    console.error(`[remove-department-permissions] Erro:`, error);
    return { success: false, error: extractApiError(error) };
  }
}

// PERMISSIONS BY ROLE
export async function addPermissionsToRole(
  departmentCode: string,
  roleCode: string,
  permissionCodes: string[],
): Promise<ActionResult<RoleDTO>> {
  const client = await getClientAccess();

  try {
    const result = await client.departments.addPermissionsToRole(
      departmentCode,
      roleCode,
      permissionCodes,
    );
    return { success: true, data: result.data as RoleDTO };
  } catch (error) {
    console.error(`[add-permissions-role] Erro:`, error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function removePermissionsFromRole(
  departmentCode: string,
  roleCode: string,
  permissionCodes: string[],
): Promise<ActionResult<RoleDTO>> {
  const client = await getClientAccess();

  try {
    const result = await client.departments.removePermissionsFromRole(
      departmentCode,
      roleCode,
      permissionCodes,
    );
    return { success: true, data: result.data as RoleDTO };
  } catch (error) {
    console.error(`[remove-permissions-role] Erro:`, error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function getPermissionsByRole(
  departmentCode: string,
  roleCode: string,
): Promise<ActionResult<any>> {
  const client = await getClientAccess();

  try {
    const result = await client.departments.getPermissionsByRole(
      departmentCode,
      roleCode,
    );
    return { success: true, data: result.data };
  } catch (error) {
    console.error(`[permissions-by-role] Erro:`, error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function getAvailablePermissionsForRole(
  departmentCode: string,
  roleCode: string,
): Promise<ActionResult<any>> {
  const client = await getClientAccess();

  try {
    const result = await client.departments.getAvailablePermissionsForRole(
      departmentCode,
      roleCode,
    );
    return { success: true, data: result.data };
  } catch (error) {
    console.error(`[available-permissions-role] Erro:`, error);
    return { success: false, error: extractApiError(error) };
  }
}
