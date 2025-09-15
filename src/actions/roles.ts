'use server';

import { refreshAccessClient } from './igrp/auth';
import { getIGRPAccessClient } from '@igrp/framework-next';
import {
  CreateRoleRequest,
  RoleFilters,
  UpdateRoleRequest,
} from '@igrp/platform-access-management-client-ts';
import { RoleArgs } from '@/features/roles/role-schemas';

export async function getRoles(params: RoleFilters) {
  await refreshAccessClient();
  const client = await getIGRPAccessClient();

  try {
    const result = await client.roles.getRoles(params);
    return result.data as RoleArgs[];
  } catch (error) {
    console.error('[roles] Não foi possível obter lista de dados dos perfis:', error);
    throw error;
  }
}

export async function createRole(roleData: CreateRoleRequest) {
  await refreshAccessClient();
  const client = await getIGRPAccessClient();

  try {
    const result = await client.roles.createRole(roleData);
    return result.data as RoleArgs;
  } catch (error) {
    console.error('[create-roles] Não foi possível criar perfil:', error);
    throw error;
  }
}

export async function updateRole(name: string, roleData: UpdateRoleRequest) {
  await refreshAccessClient();
  const client = await getIGRPAccessClient();

  try {
    const result = await client.roles.updateRole(name, roleData);
    return result.data as RoleArgs;
  } catch (error) {
    console.error('[update-roles] Não foi possível atualizar perfil:', error);
    throw error;
  }
}

export async function deleteRole(name: string) {
  await refreshAccessClient();
  const client = await getIGRPAccessClient();

  try {
    const result = await client.roles.deleteRole(name);
    return result.data;
  } catch (error) {
    console.error('[delete-role] Não foi possível eliminar perfil:', error);
    throw error;
  }
}
