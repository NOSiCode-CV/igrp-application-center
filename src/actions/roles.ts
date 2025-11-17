"use server";

import type {
  CreateRoleRequest,
  RoleFilters,
  UpdateRoleRequest,
} from "@igrp/platform-access-management-client-ts";
import type { PermissionArgs } from "@/features/permissions/permissions-schemas";
import type { RoleArgs } from "@/features/roles/role-schemas";
import { getClientAccess } from "./access-client";
import { extractApiError } from "@/lib/utils";

export async function getRoles(params: RoleFilters) {
  // console.log({ RoleFilters: params });

  const client = await getClientAccess();

  try {
    const result = await client.roles.getRoles(params);
    return result.data as RoleArgs[];
  } catch (error) {
    console.error(
      "[roles] Não foi possível obter lista de dados dos perfís:",
      error,
    );
    throw new Error(extractApiError(error));
  }
}

export async function createRole(roleData: CreateRoleRequest) {
  const client = await getClientAccess();

  try {
    const result = await client.roles.createRole(roleData);
    return result.data as RoleArgs;
  } catch (error) {
    console.error("[create-roles] Não foi possível criar perfil:", error);
    throw new Error(extractApiError(error));
  }
}

export async function updateRole(name: string, roleData: UpdateRoleRequest) {
  const client = await getClientAccess();

  try {
    const result = await client.roles.updateRole(name, roleData);
    return result.data as RoleArgs;
  } catch (error) {
    console.error(
      `[update-roles] Não foi possível atualizar perfil ${name}:`,
      error,
    );
    throw new Error(extractApiError(error));
  }
}

export async function deleteRole(code: string) {
  const client = await getClientAccess();
  try {
    const result = await client.roles.deleteRole(code);
    console.log("result - ", result)
    return result;
  } catch (error: any) {
    if (error?.status === 204 || error?.status === 0) {
      return { success: true, code };
    }
    console.error(
      `[delete-role] Não foi possível eliminar perfil ${code}:`,
      error,
    );
    throw new Error(extractApiError(error));
  }
}

export async function getRoleByCode(name: string) {
  const client = await getClientAccess();

  try {
    const result = await client.roles.getRoleByCode(name);
    return result.data as RoleArgs;
  } catch (error) {
    console.error(
      `[role-by-name] Não foi possível obter dado do perfil ${name}.:`,
      error,
    );
    throw new Error(extractApiError(error));
  }
}

export async function addPermissionsToRole(
  name: string,
  permissionNames: string[],
) {
  const client = await getClientAccess();

  // console.log("::: Add Permissões :::");
  // console.log({ name, permissionNames });
  try {
    const result = await client.roles.addPermissionsToRole(
      name,
      permissionNames,
    );
    return result.data as RoleArgs;
  } catch (error) {
    console.error(
      `[add-permissions-role] Não foi possível adicionar permissões a perfíl ${name}:`,
      error,
    );
    throw new Error(extractApiError(error));
  }
}

export async function removePermissionsFromRole(
  name: string,
  permissionNames: string[],
) {
  const client = await getClientAccess();

  // console.log("::: Remove Permissões :::");
  // console.log({ name, permissionNames });

  try {
    const result = await client.roles.removePermissionsFromRole(
      name,
      permissionNames,
    );
    return result.data as RoleArgs;
  } catch (error) {
    console.error(
      `[remove-permissions-role] Não foi possível remover permissões a perfíl ${name}:`,
      error,
    );
    throw new Error(extractApiError(error));
  }
}

export async function getPermissionsByRoleCode(name: string) {
  const client = await getClientAccess();

  try {
    const result = await client.roles.getPermissionsByRoleCode(name);
    return result.data as PermissionArgs[];
  } catch (error) {
    console.error(
      `[role-by-name] Não foi possível obter dados de permissões de perfil ${name}:`,
      error,
    );
    throw new Error(extractApiError(error));
  }
}
