"use server";

import type {
  ApplicationDTO,
  ApplicationFilters,
  CreateApplicationRequest,
  CreateMenuRequest,
  MenuEntryDTO,
  UpdateApplicationRequest,
  UpdateMenuRequest,
} from "@igrp/platform-access-management-client-ts";
import { getClientAccess } from "./access-client";
import { extractApiError } from "@/lib/utils";
import {
  mapperListMenusCRUD,
  mapperMenuCRUD,
} from "@/features/menus/menu-mapper";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function getApplications(
  filters?: ApplicationFilters,
): Promise<ActionResult<ApplicationDTO[]>> {
  const client = await getClientAccess();

  try {
    const result = await client.applications.getApplications(filters);
    return { success: true, data: result.data as ApplicationDTO[] };
  } catch (error) {
    console.error("[apps] Não foi possível obter os dados:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function getApplicationByCode(
  appCode: string,
): Promise<ActionResult<ApplicationDTO>> {
  const client = await getClientAccess();

  try {
    const result = await client.applications.getApplications({ code: appCode });
    return { success: true, data: result.data[0] as ApplicationDTO };
  } catch (error) {
    console.error(
      "[app-by-code] Não foi possível obter os dados da aplicação:",
      error,
    );
    return { success: false, error: extractApiError(error) };
  }
}

export async function createApplication(
  application: CreateApplicationRequest,
): Promise<ActionResult<ApplicationDTO>> {
  const client = await getClientAccess();

  try {
    const result = await client.applications.createApplication(application);
    return { success: true, data: result.data as ApplicationDTO };
  } catch (error) {
    console.error("[app-create] Não foi possível criar à aplicação:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function updateApplication(
  code: string,
  updated: UpdateApplicationRequest,
): Promise<ActionResult<ApplicationDTO>> {
  const client = await getClientAccess();

  try {
    const result = await client.applications.updateApplication(code, updated);
    return { success: true, data: result.data as ApplicationDTO };
  } catch (error) {
    console.error(
      "[app-update] Não foi possível atualizar à aplicação:",
      error,
    );
    return { success: false, error: extractApiError(error) };
  }
}

// MENUS
export async function getMenus(code: string): Promise<ActionResult<any[]>> {
  const client = await getClientAccess();

  try {
    const result = await client.applications.getMenus(code);
    const menus = mapperListMenusCRUD(result);
    return { success: true, data: menus };
  } catch (error) {
    console.error(
      "[menus-get]: Erro ao carregar os menus da aplicação:",
      error,
    );
    return { success: false, error: extractApiError(error) };
  }
}

export async function createMenu(
  appCode: string,
  menu: CreateMenuRequest,
): Promise<ActionResult<any>> {
  const client = await getClientAccess();

  try {
    const result = await client.applications.createMenu(appCode, menu);
    const app = mapperMenuCRUD(result);
    return { success: true, data: app };
  } catch (error) {
    console.error("[menu-create] Não foi possível criar menu:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function updateMenu(
  appCode: string,
  menuCode: string,
  updated: UpdateMenuRequest,
): Promise<ActionResult<any>> {
  const client = await getClientAccess();

  try {
    const result = await client.applications.updateMenu(
      appCode,
      menuCode,
      updated,
    );
    const app = mapperMenuCRUD(result);
    return { success: true, data: app };
  } catch (error) {
    console.error("[menu-update] Não foi possível atualizar menu:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function deleteMenu(
  appCode: string,
  menuCode: string,
): Promise<ActionResult<any>> {
  const client = await getClientAccess();

  try {
    const result = await client.applications.deleteMenu(appCode, menuCode);
    return { success: true, data: result };
  } catch (error) {
    console.error("[menu-delete] Não foi possível eliminar menu:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function removeRolesFromMenu(
  appCode: string,
  menuCode: string,
  departmentCode: string,
  roleNames: string[],
): Promise<ActionResult<MenuEntryDTO>> {
  const client = await getClientAccess();
  try {
    const { data } = await client.applications.removeRolesFromMenu(
      appCode,
      menuCode,
      departmentCode,
      roleNames,
    );
    return { success: true, data };
  } catch (error) {
    console.error(
      "[menu-remove-roles] Não foi possível remover os papéis do menu:",
      error,
    );
    return { success: false, error: extractApiError(error) };
  }
}

export async function addRolesToMenu(
  appCode: string,
  menuCode: string,
  departmentCode: string,
  roleNames: string[],
): Promise<ActionResult<MenuEntryDTO>> {
  const client = await getClientAccess();
  try {
    const { data } = await client.applications.addRolesToMenu(
      appCode,
      menuCode,
      departmentCode,
      roleNames,
    );
    return { success: true, data };
  } catch (error) {
    console.error(
      "[menu-assign-roles] Não foi possível atribuir os papéis ao menu:",
      error,
    );
    return { success: false, error: extractApiError(error) };
  }
}
