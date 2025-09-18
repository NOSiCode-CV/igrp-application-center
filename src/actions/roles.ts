'use server';

import {} from './igrp/auth';
import { igrpGetAccessClient } from '@igrp/framework-next';
import {
  CreateRoleRequest,
  RoleFilters,
  UpdateRoleRequest,
} from '@igrp/platform-access-management-client-ts';
import { RoleArgs } from '@/features/roles/role-schemas';

export async function getRoles(params: RoleFilters) {
  // igrpResetAccessClient();
  const client = await igrpGetAccessClient();

  try {
    const result = await client.roles.getRoles(params);
    return result.data as RoleArgs[];
  } catch (error) {
    console.error('[roles] Não foi possível obter lista de dados dos perfís:', error);
    throw error;
  }
}

export async function createRole(roleData: CreateRoleRequest) {
  // igrpResetAccessClient();
  const client = await igrpGetAccessClient();

  try {
    const result = await client.roles.createRole(roleData);
    return result.data as RoleArgs;
  } catch (error) {
    console.error('[create-roles] Não foi possível criar perfil:', error);
    throw error;
  }
}

export async function updateRole(name: string, roleData: UpdateRoleRequest) {
  // igrpResetAccessClient();
  const client = await igrpGetAccessClient();

  try {
    const result = await client.roles.updateRole(name, roleData);
    return result.data as RoleArgs;
  } catch (error) {
    console.error('[update-roles] Não foi possível atualizar perfil:', error);
    throw error;
  }
}

export async function deleteRole(name: string) {
  // igrpResetAccessClient();
  const client = await igrpGetAccessClient();

  try {
    const result = await client.roles.deleteRole(name);
    return result.data;
  } catch (error) {
    console.error('[delete-role] Não foi possível eliminar perfil:', error);
    throw error;
  }
}

export async function getRoleByName(name: string) {
  // igrpResetAccessClient();
  const client = await igrpGetAccessClient();

  try {
    const result = await client.roles.getRoleByName(name);
    return result.data as RoleArgs;
  } catch (error) {
    console.error('[role-by-name] Não foi possível obter dado do perfil.:', error);
    throw error;
  }
}
