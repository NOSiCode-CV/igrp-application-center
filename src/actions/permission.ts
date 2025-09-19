'use server';

import {
  CreatePermissionRequest,
  PermissionFilters,
  UpdatePermissionRequest,
} from '@igrp/platform-access-management-client-ts';
import { PermissionArgs } from '@/features/permission/permissions-schemas';
import { RoleArgs } from '@/features/roles/role-schemas';
import { getClientAccess } from './access-client';

export async function getPermissions(params: PermissionFilters) {
  const client = await getClientAccess();  

  try {
    const result = await client.permissions.getPermissions(params);
    return result.data as PermissionArgs[];
  } catch (error) {
    console.error('[permissions]: Erro ao carregar lista de permissões.:', error);
    throw error;
  }
}

export async function createPermission(permission: CreatePermissionRequest) {
  const client = await getClientAccess();  

  try {
    const result = await client.permissions.createPermission(permission);
    return result.data;
  } catch (error) {
    console.error('[create-permission]: Erro ao carregar criar permissão.:', error);
    throw error;
  }
}

export async function updatePermission(name: string, permission: UpdatePermissionRequest) {
  const client = await getClientAccess();  

  try {
    const result = await client.permissions.updatePermission(name, permission);
    return result.data;
  } catch (error) {
    console.error('[update-permission]: Erro ao carregar atualizar permissão.:', error);
    throw error;
  }
}

export async function deletePermission(name: string) {
  const client = await getClientAccess();  

  try {
    const result = await client.permissions.deletePermission(name);
    return result.data;
  } catch (error) {
    console.error('[delete-permission]: Erro ao carregar eliminar permissão.:', error);
    throw error;
  }
}

export async function getRolesByPermissionName(name: string) {
  const client = await getClientAccess();  

  try {
    const result = await client.permissions.getRolesByPermissionName(name);
    return result.data as RoleArgs[];
  } catch (error) {
    console.error('[permission in roles]: Erro ao carregar lista de perfís.:', error);
    throw error;
  }
}
