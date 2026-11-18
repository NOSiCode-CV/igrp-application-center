"use server";

import type {
  ApplicationDTO,
  CreateDepartmentRequest,
  CreateRoleRequest,
  DepartmentDTO,
  MenuEntryDTO,
  ResourceDTO,
  RoleDTO,
  UpdateDepartmentRequest,
  UpdateRoleRequest,
} from "@igrp/platform-access-management-client-ts";
import { getTranslations } from "next-intl/server";

import { toActionError } from "@/lib/utilities";

import { getClientAccess } from "./access-client";
import { callApi } from "./call-api";
import type { AccessClient, ActionResult, SdkData } from "./types";

async function required(
  key: "departmentRequired" | "appAndDepartmentRequired",
) {
  const t = await getTranslations("errors.actions");
  return { success: false as const, error: t(key) };
}

export async function getDepartments(): Promise<ActionResult<DepartmentDTO[]>> {
  return callApi("[departments] Erro ao carregar departamentos:", (client) =>
    client.departments.getDepartments(),
  );
}

export async function createDepartment(
  departmentData: CreateDepartmentRequest,
): Promise<ActionResult<DepartmentDTO>> {
  return callApi("[create-department] Erro ao criar departamento:", (client) =>
    client.departments.createDepartment(departmentData),
  );
}

export async function updateDepartment(
  code: string,
  data: UpdateDepartmentRequest,
): Promise<ActionResult<DepartmentDTO>> {
  return callApi(
    "[update-department] Erro ao atualizar departamento:",
    (client) => client.departments.updateDepartment(code, data),
  );
}

export async function deleteDepartment(
  code: string,
): Promise<ActionResult<string>> {
  return callApi(
    "[delete-department] Erro ao eliminar departamento:",
    (client) => client.departments.deleteDepartment(code),
  );
}

// APPLICATIONS
export async function getAvailableApplications(
  departmentCode?: string,
): Promise<ActionResult<ApplicationDTO[]>> {
  if (!departmentCode) {
    return required("departmentRequired");
  }
  return callApi("[department-available-apps] Erro:", (client) =>
    client.departments.getAvailableApplications(departmentCode),
  );
}

export async function getDepartmentApplications(
  departmentCode: string,
): Promise<ActionResult<ApplicationDTO[]>> {
  return callApi("[department-applications] Erro:", (client) =>
    client.departments.getDepartmentApplications(departmentCode),
  );
}

export async function addApplicationsToDepartment(
  code: string,
  appCodes: string[],
): Promise<ActionResult<string>> {
  return callApi("[department-add-applications] Erro:", (client) =>
    client.departments.addApplicationsToDepartment(code, appCodes),
  );
}

export async function removeApplicationsFromDepartment(
  code: string,
  appCodes: string[],
): Promise<ActionResult<string>> {
  return callApi("[department-remove-applications] Erro:", (client) =>
    client.departments.removeApplicationsFromDepartment(code, appCodes),
  );
}

// MENU
export async function getAvailableMenus(
  appCode?: string,
  departmentCode?: string,
): Promise<ActionResult<MenuEntryDTO[]>> {
  if (!appCode || !departmentCode) {
    return required("appAndDepartmentRequired");
  }
  return callApi("[department-available-menus] Erro:", (client) =>
    client.departments.getAvailableMenus(appCode, departmentCode),
  );
}

export async function getDepartmentMenus(
  appCode?: string,
  departmentCode?: string,
): Promise<ActionResult<MenuEntryDTO[]>> {
  if (!appCode || !departmentCode) {
    return required("appAndDepartmentRequired");
  }
  return callApi("[department-menus] Erro:", (client) =>
    client.departments.getDepartmentMenus(appCode, departmentCode),
  );
}

export async function addMenusToDepartment(
  appCode: string,
  departmentCode: string,
  menuCodes: string[],
): Promise<ActionResult<string>> {
  return callApi("[department-add-menus] Erro:", (client) =>
    client.departments.addMenusToDepartment(appCode, departmentCode, menuCodes),
  );
}

export async function removeMenusFromDepartment(
  appCode: string,
  departmentCode: string,
  menuCodes: string[],
): Promise<ActionResult<string>> {
  return callApi("[department-remove-menus] Erro:", (client) =>
    client.departments.removeMenusFromDepartment(
      appCode,
      departmentCode,
      menuCodes,
    ),
  );
}

// ROLES
export async function getRoles(
  departmentCode: string,
  roleCode?: string,
): Promise<ActionResult<RoleDTO[]>> {
  return callApi("[roles] Erro ao obter perfis:", (client) =>
    client.departments.getRoles(departmentCode, roleCode),
  );
}

export async function createRole(
  departmentCode: string,
  role: CreateRoleRequest,
): Promise<ActionResult<RoleDTO>> {
  return callApi("[create-roles] Erro ao criar perfil:", (client) =>
    client.departments.createRole(departmentCode, role),
  );
}

export async function updateRole(
  departmentCode: string,
  roleCode: string,
  role: UpdateRoleRequest,
): Promise<ActionResult<RoleDTO>> {
  return callApi(
    `[update-roles] Erro ao atualizar perfil ${JSON.stringify(String(roleCode))}:`,
    (client) => client.departments.updateRole(departmentCode, roleCode, role),
  );
}

export async function deleteRole(
  departmentCode: string,
  roleCode: string,
): Promise<ActionResult<{ code: string }>> {
  const client = await getClientAccess();
  try {
    const _result = await client.departments.deleteRole(
      departmentCode,
      roleCode,
    );
    return { success: true, data: { code: roleCode } };
  } catch (error: unknown) {
    // The SDK throws on 204 No Content instead of resolving — treat it as success.
    const status = (error as { status?: number } | null | undefined)?.status;
    if (status === 204 || status === 0) {
      return { success: true, data: { code: roleCode } };
    }
    console.error(
      `[delete-role] Erro ao eliminar perfil ${JSON.stringify(String(roleCode))}:`,
      error,
    );
    return { success: false, ...toActionError(error) };
  }
}

// RESOURCES
export async function addResourcesToDepartment(
  departmentCode: string,
  resourceCodes: string[],
): Promise<ActionResult<string>> {
  return callApi(`[add-resources-department] Erro:`, (client) =>
    client.departments.addResourcesToDepartment(departmentCode, resourceCodes),
  );
}

export async function removeResourcesFromDepartment(
  departmentCode: string,
  resourceCodes: string[],
): Promise<ActionResult<string>> {
  return callApi(`[remove-resources-department] Erro:`, (client) =>
    client.departments.removeResourcesFromDepartment(
      departmentCode,
      resourceCodes,
    ),
  );
}

export async function getAvailableResources(
  departmentCode?: string,
): Promise<ActionResult<ResourceDTO[]>> {
  if (!departmentCode) {
    return required("departmentRequired");
  }
  return callApi(`[available-resources-department] Erro:`, (client) =>
    client.departments.getAvailableResources(departmentCode),
  );
}

export async function getDepartmentResources(
  departmentCode?: string,
): Promise<ActionResult<ResourceDTO[]>> {
  if (!departmentCode) {
    return required("departmentRequired");
  }

  return callApi(`[department-resources] Erro:`, (client) =>
    client.departments.getDepartmentResources(departmentCode),
  );
}

// PERMISSIONS
export async function getDepartmentPermissions(
  departmentCode?: string,
): Promise<
  ActionResult<SdkData<AccessClient["departments"]["getDepartmentPermissions"]>>
> {
  if (!departmentCode) {
    return required("departmentRequired");
  }
  return callApi(`[department-permissions] Erro:`, (client) =>
    client.departments.getDepartmentPermissions(departmentCode),
  );
}

export async function getAvailablePermissions(
  departmentCode?: string,
): Promise<
  ActionResult<SdkData<AccessClient["departments"]["getAvailablePermissions"]>>
> {
  if (!departmentCode) {
    return required("departmentRequired");
  }

  return callApi(`[available-department-permissions] Erro:`, (client) =>
    client.departments.getAvailablePermissions(departmentCode),
  );
}

export async function addPermissionsToDepartment(
  departmentCode: string,
  permissionCodes: string[],
): Promise<ActionResult<string>> {
  return callApi(`[add-department-permissions] Erro:`, (client) =>
    client.departments.addPermissionsToDepartment(
      departmentCode,
      permissionCodes,
    ),
  );
}

export async function removePermissionsFromDepartment(
  departmentCode: string,
  permissionCodes: string[],
): Promise<ActionResult<string>> {
  return callApi(`[remove-department-permissions] Erro:`, (client) =>
    client.departments.removePermissionsFromDepartment(
      departmentCode,
      permissionCodes,
    ),
  );
}

// PERMISSIONS BY ROLE
export async function addPermissionsToRole(
  departmentCode: string,
  roleCode: string,
  permissionCodes: string[],
): Promise<ActionResult<RoleDTO>> {
  return callApi(`[add-permissions-role] Erro:`, (client) =>
    client.departments.addPermissionsToRole(
      departmentCode,
      roleCode,
      permissionCodes,
    ),
  );
}

export async function removePermissionsFromRole(
  departmentCode: string,
  roleCode: string,
  permissionCodes: string[],
): Promise<ActionResult<RoleDTO>> {
  return callApi(`[remove-permissions-role] Erro:`, (client) =>
    client.departments.removePermissionsFromRole(
      departmentCode,
      roleCode,
      permissionCodes,
    ),
  );
}

// NOTE: SDK declares this as `ApiResponse<any>`; downstream consumers narrow.
export async function getPermissionsByRole(
  departmentCode: string,
  roleCode: string,
): Promise<ActionResult<unknown>> {
  return callApi(`[permissions-by-role] Erro:`, (client) =>
    client.departments.getPermissionsByRole(departmentCode, roleCode),
  );
}
