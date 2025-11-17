"use server";

import type {
  CreateMenuRequest,
  MenuEntryDTO,
  MenuFilters,
  UpdateMenuRequest,
} from "@igrp/platform-access-management-client-ts";
import {
  mapperListMenusCRUD,
  mapperMenuCRUD,
} from "@/features/menus/menu-mapper";
import { getClientAccess } from "./access-client";
import { extractApiError } from "@/lib/utils";

export async function getMenus(params?: MenuFilters) {
  const client = await getClientAccess();

  try {
    const result = await client.menus.getMenus({ ...params });
    const menus = mapperListMenusCRUD(result);
    return menus;
  } catch (error) {
    console.error(
      "[menus-get]: Erro ao carregar os menus da aplicação.:",
      error,
    );
    throw new Error(extractApiError(error));
  }
}

export async function createMenu(menu: CreateMenuRequest) {
  const client = await getClientAccess();

  try {
    const result = await client.menus.createMenu(menu);
    const app = mapperMenuCRUD(result);
    return app;
  } catch (error) {
    console.error("menu-create] Não foi possível criar menu:", error);
    throw new Error(extractApiError(error));
  }
}

export async function updateMenu(code: string, updated: UpdateMenuRequest) {
  const client = await getClientAccess();

  try {
    const result = await client.menus.updateMenu(code, updated);
    const app = mapperMenuCRUD(result);
    return app;
  } catch (error) {
    console.error("[menu-update] Não foi possível atualizar menu:", error);
    throw new Error(extractApiError(error));
  }
}

export async function deleteMenu(code: string) {
  const client = await getClientAccess();

  try {
    const result = await client.menus.deleteMenu(code);
    return result;
  } catch (error) {
    console.error("[menu-update] Não foi possível eleiminar menu:", error);
    throw new Error(extractApiError(error));
  }
}

export async function removeRolesFromMenu(
  menuCode: string,
  roleCodes: string[],
): Promise<MenuEntryDTO> {
  const client = await getClientAccess();
  try {
    const { data } = await client.menus.removeRolesFromMenu(
      menuCode,
      roleCodes,
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
  menuCode: string,
  roleCodes: string[],
): Promise<MenuEntryDTO> {
  const client = await getClientAccess();
  try {
    const { data } = await client.menus.addRolesToMenu(menuCode, roleCodes);
    return data;
  } catch (error) {
    console.error(
      "[menu-assign-roles] Não foi possível atribuir os papéis ao menu:",
      error,
    );
    throw new Error(extractApiError(error));
  }
}

export async function addDepartamentsToMenu(
  menuCode: string,
  departmentIds: string[],
): Promise<MenuEntryDTO> {
  const client = await getClientAccess();
  try {
    const { data } = await client.menus.addDepartmentsToMenu(
      menuCode,
      departmentIds,
    );
    return data;
  } catch (error) {
    console.error(
      "[menu-assign-departments] Não foi possível atribuir os departamentos ao menu:",
      error,
    );
    throw new Error(extractApiError(error));
  }
}

export async function removeDepartamentsFromMenu(
  menuCode: string,
  departmentIds: string[],
): Promise<MenuEntryDTO> {
  const client = await getClientAccess();
  try {
    const { data } = await client.menus.removeDepartmentsFromMenu(
      menuCode,
      departmentIds,
    );
    return data;
  } catch (error) {
    console.error(
      "[menu-remove-departments] Não foi possível remover os departamentos do menu:",
      error,
    );
    throw new Error(extractApiError(error));
  }
}

export async function getMenusByDepartment(departmentCode: string) {
  const client = await getClientAccess();

  try {
    const result = await client.menus.getMenus({
      departmentCode: departmentCode,
    });
    const menus = mapperListMenusCRUD(result);
    return menus;
  } catch (error) {
    console.error(
      "[menus-by-department] Erro ao carregar os menus da aplicação.:",
      error,
    );
    throw new Error(extractApiError(error));
  }
}
