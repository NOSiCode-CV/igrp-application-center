"use server";

import type {
  CreateRoleRequest,
  RoleFilters,
  UpdateRoleRequest,
} from "@igrp/platform-access-management-client-ts";
import type { PermissionArgs } from "@/features/permission/permissions-schemas";
import type { RoleArgs } from "@/features/roles/role-schemas";
import { getClientAccess } from "./access-client";

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
    throw error;
  }
}

export async function createRole(roleData: CreateRoleRequest) {
  const client = await getClientAccess();

  try {
    const result = await client.roles.createRole(roleData);
    return result.data as RoleArgs;
  } catch (error) {
    console.error("[create-roles] Não foi possível criar perfil:", error);
    throw error;
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
    throw error;
  }
}

export async function deleteRole(name: string) {
  const client = await getClientAccess();

  try {
    const result = await client.roles.deleteRole(name);
    return result.data;
  } catch (error) {
    console.error(
      `[delete-role] Não foi possível eliminar perfil ${name}:`,
      error,
    );
    throw error;
  }
}

export async function getRoleByName(name: string) {
  const client = await getClientAccess();

  try {
    const result = await client.roles.getRoleByName(name);
    return result.data as RoleArgs;
  } catch (error) {
    console.error(
      `[role-by-name] Não foi possível obter dado do perfil ${name}.:`,
      error,
    );
    throw error;
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
    throw error;
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
    throw error;
  }
}

export async function getPermissionsByRoleName(name: string) {
  const client = await getClientAccess();

  try {
    const result = await client.roles.getPermissionsByRoleName(name);
    return result.data as PermissionArgs[];
  } catch (error) {
    console.error(
      `[role-by-name] Não foi possível obter dados de permissões de perfil ${name}:`,
      error,
    );
    throw error;
  }
}
