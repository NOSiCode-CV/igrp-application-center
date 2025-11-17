"use server";

import type {
  CreateDepartmentRequest,
  MenuEntryDTO,
  UpdateDepartmentRequest,
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

export async function getAvailableApplications(code: string) {
  const client = await getClientAccess();
  try {
    const result = await client.departments.getAvailableApplications(code);
    return result.data as ApplicationArgs[];
  } catch (error) {
    console.error(
      "[department-available-menus-for-roles] Não foi possível obter lista de apps dos departamentos para roles:",
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
    const result = await client.departments.removeApplicationsToDepartment(
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

export async function getAvailableMenus(code: string) {
  const client = await getClientAccess();

  try {
    const result = await client.departments.getAvailableMenus(code);
    return result.data as MenuEntryDTO[];
  } catch (error) {
    console.error(
      "[department-available-menus] Não foi possível obter lista de menus dos departamentos:",
      error,
    );
    throw new Error(extractApiError(error));
  }
}

export async function addMenusToDepartment(code: string, menuCodes: string[]) {
  const client = await getClientAccess();
  try {
    const result = await client.departments.addMenusToDepartment(
      code,
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
  code: string,
  menuCodes: string[],
) {
  const client = await getClientAccess();
  try {
    const result = await client.departments.removeMenusToDepartment(
      code,
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
