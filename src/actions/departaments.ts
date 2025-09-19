'use server';

import {
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
} from '@igrp/platform-access-management-client-ts';

import { DepartmentArgs } from '@/features/departments/dept-schemas';
import { getClientAccess } from './access-client';

export async function getDepartments() {
  const client = await getClientAccess();

  try {
    const result = await client.departments.getDepartments();
    return result.data as DepartmentArgs[];
  } catch (error) {
    console.error('[departments] Não foi possível obter lista de dados dos departamentos:', error);
    throw error;
  }
}

export async function createDepartment(departmentData: CreateDepartmentRequest) {
  const client = await getClientAccess();

  try {
    const result = await client.departments.createDepartment(departmentData);
    return result.data;
  } catch (error) {
    console.error('[create-department] Não foi possível criar departamento:', error);
    throw error;
  }
}

export async function updateDepartment(code: string, data: UpdateDepartmentRequest) {
  const client = await getClientAccess();

  try {
    const result = await client.departments.updateDepartment(code, data);
    return result.data;
  } catch (error) {
    console.error('[update-department] Não foi possível eliminar departamento:', error);
    throw error;
  }
}

export async function deleteDepartment(code: string) {
  const client = await getClientAccess();

  try {
    const result = await client.departments.deleteDepartment(code);
    return result.data;
  } catch (error) {
    console.error('[delete-department] Não foi possível eliminar departamento:', error);
    throw error;
  }
}

export async function getDepartmentByCode(code: string) {
  const client = await getClientAccess();

  try {
    const result = await client.departments.getDepartmentByCode(code);
    return result.data as DepartmentArgs;
  } catch (error) {
    console.error(
      '[department-by-code] Não foi possível obter lista de dados dos departamentos:',
      error,
    );
    throw error;
  }
}
