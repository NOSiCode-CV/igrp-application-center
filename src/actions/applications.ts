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

export async function getApplications(
  filters?: ApplicationFilters,
): Promise<ApplicationDTO[]> {
  const client = await getClientAccess();

  try {
    const result = await client.applications.getApplications(filters);
    return result.data as ApplicationDTO[];
  } catch (error) {
    console.error("[apps] Não foi possível obter os dados:", error);
    throw new Error(extractApiError(error));
  }
}

export async function getApplicationByCode(
  appCode: string,
): Promise<ApplicationDTO> {
  const client = await getClientAccess();

  try {
    const result = await client.applications.getApplications({ code: appCode });
    return result.data[0] as ApplicationDTO;
  } catch (error) {
    console.error(
      "[app-by-code] Não foi possível obter os dados da aplicação:",
      error,
    );
    throw new Error(extractApiError(error));
  }
}

export async function createApplication(application: CreateApplicationRequest) {
  const client = await getClientAccess();

  try {
    const result = await client.applications.createApplication(application);
    return result.data as ApplicationDTO;
  } catch (error) {
    console.error("[app-create] Não foi possível criar à aplicação:", error);
    throw new Error(extractApiError(error));
  }
}

export async function updateApplication(
  code: string,
  updated: UpdateApplicationRequest,
) {
  const client = await getClientAccess();

  try {
    const result = await client.applications.updateApplication(code, updated);
    return result.data as ApplicationDTO;
  } catch (error) {
    console.error(
      "[app-update] Não foi possível atualizar à aplicação:",
      error,
    );
    throw new Error(extractApiError(error));
  }
}

// MENUS
export async function getMenus(code: string) {
  const client = await getClientAccess();

  try {
    const result = await client.applications.getMenus(code);
    const menus = mapperListMenusCRUD(result);
    return menus;
  } catch (error) {
    console.error(
      "[menus-get]: Erro ao carregar os menus da aplicação BANANA.:",
      error,
    );
    throw new Error(extractApiError(error));
  }
}

export async function createMenu(appCode: string, menu: CreateMenuRequest) {
  const client = await getClientAccess();

  try {
    const result = await client.applications.createMenu(appCode, menu);
    const app = mapperMenuCRUD(result);
    return app;
  } catch (error) {
    console.error("menu-create] Não foi possível criar menu:", error);
    throw new Error(extractApiError(error));
  }
}

export async function updateMenu(
  appCode: string,
  menuCode: string,
  updated: UpdateMenuRequest,
) {
  const client = await getClientAccess();

  try {
    const result = await client.applications.updateMenu(
      appCode,
      menuCode,
      updated,
    );
    const app = mapperMenuCRUD(result);
    return app;
  } catch (error) {
    console.error("[menu-update] Não foi possível atualizar menu:", error);
    throw new Error(extractApiError(error));
  }
}

export async function deleteMenu(appCode: string, menuCode: string) {
  const client = await getClientAccess();

  try {
    const result = await client.applications.deleteMenu(appCode, menuCode);
    return result;
  } catch (error) {
    console.error("[menu-update] Não foi possível eleiminar menu:", error);
    throw new Error(extractApiError(error));
  }
}

export async function removeRolesFromMenu(
  appCode: string,
  menuCode: string,
  departmentCode: string,
  roleNames: string[],
): Promise<MenuEntryDTO> {
  const client = await getClientAccess();
  try {
    const { data } = await client.applications.removeRolesFromMenu(
      appCode,
      menuCode,
      departmentCode,
      roleNames,
    );
    return data;
  } catch (error) {
    console.error(
      "[menu-remove-roles] Não foi possível remover os papéis do menu:",
      error,
    );
    throw new Error(extractApiError(error));
  }
}

export async function addRolesToMenu(
  appCode: string,
  menuCode: string,
  departmentCode: string,
  roleNames: string[],
): Promise<MenuEntryDTO> {
  const client = await getClientAccess();
  try {
    const { data } = await client.applications.addRolesToMenu(
      appCode,
      menuCode,
      departmentCode,
      roleNames,
    );
    return data;
  } catch (error) {
    console.error(
      "[menu-assign-roles] Não foi possível atribuir os papéis ao menu:",
      error,
    );
    throw new Error(extractApiError(error));
  }
}
