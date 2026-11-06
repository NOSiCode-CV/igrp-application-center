"use server";

import type {
  IGRPMenuCRUDArgs,
  IGRPMenuItemArgs,
} from "@igrp/framework-next-types";
import type {
  ApplicationDTO,
  ApplicationFilters,
  CreateApplicationRequest,
  CreateMenuRequest,
  MenuEntryDTO,
  UpdateApplicationRequest,
  UpdateMenuRequest,
} from "@igrp/platform-access-management-client-ts";

import {
  mapperListMenusCRUD,
  mapperMenuCRUD,
} from "@/features/menus/menu-mapper";
import { toActionError } from "@/lib/utilities";

import { getClientAccess } from "./access-client";
import type { ActionResult } from "./types";

export async function getApplications(
  filters?: ApplicationFilters,
): Promise<ActionResult<ApplicationDTO[]>> {
  const client = await getClientAccess();

  try {
    const result = await client.applications.getApplications(filters);
    return { success: true, data: result.data as ApplicationDTO[] };
  } catch (error) {
    console.error("[apps] Não foi possível obter os dados:", error);
    return { success: false, ...toActionError(error) };
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
    return { success: false, ...toActionError(error) };
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
    return { success: false, ...toActionError(error) };
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
    return { success: false, ...toActionError(error) };
  }
}

// MENUS
// The SDK interpolates codes into URL paths as-is: make each one a single encoded segment.
function pathSegment(value: string): string {
  // Non-string: a hand-crafted server-action call could pass an array or object.
  // "." / "..": still dot segments after encoding, so fetch would resolve them.
  // "/" "\": a proxy that decodes %2F/%5C would turn the encoded value back into a traversal.
  // "[" "]" "|": Node's URL parser sent these raw and Tomcat rejected them (400); refusing keeps that outcome.
  if (
    typeof value !== "string" ||
    value === "." ||
    value === ".." ||
    /[/\\[\]|]/.test(value)
  ) {
    throw new Error("Código inválido");
  }
  return encodeURIComponent(value);
}

export async function getMenus(
  code: string,
): Promise<ActionResult<IGRPMenuItemArgs[]>> {
  const client = await getClientAccess();

  try {
    const result = await client.applications.getMenus(pathSegment(code));
    const menus = mapperListMenusCRUD(result);
    return { success: true, data: menus };
  } catch (error) {
    console.error(
      "[menus-get]: Erro ao carregar os menus da aplicação:",
      error,
    );
    return { success: false, ...toActionError(error) };
  }
}

export async function createMenu(
  appCode: string,
  menu: CreateMenuRequest,
): Promise<ActionResult<IGRPMenuCRUDArgs>> {
  const client = await getClientAccess();

  try {
    const result = await client.applications.createMenu(
      pathSegment(appCode),
      menu,
    );
    const app = mapperMenuCRUD(result);
    return { success: true, data: app };
  } catch (error) {
    console.error("[menu-create] Não foi possível criar menu:", error);
    return { success: false, ...toActionError(error) };
  }
}

export async function updateMenu(
  appCode: string,
  menuCode: string,
  updated: UpdateMenuRequest,
): Promise<ActionResult<IGRPMenuCRUDArgs>> {
  const client = await getClientAccess();

  try {
    const result = await client.applications.updateMenu(
      pathSegment(appCode),
      pathSegment(menuCode),
      updated,
    );
    const app = mapperMenuCRUD(result);
    return { success: true, data: app };
  } catch (error) {
    console.error("[menu-update] Não foi possível atualizar menu:", error);
    return { success: false, ...toActionError(error) };
  }
}

export async function deleteMenu(
  appCode: string,
  menuCode: string,
): Promise<ActionResult<string>> {
  const client = await getClientAccess();

  try {
    const result = await client.applications.deleteMenu(
      pathSegment(appCode),
      pathSegment(menuCode),
    );
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[menu-delete] Não foi possível eliminar menu:", error);
    return { success: false, ...toActionError(error) };
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
      pathSegment(appCode),
      pathSegment(menuCode),
      departmentCode,
      roleNames,
    );
    return { success: true, data };
  } catch (error) {
    console.error(
      "[menu-remove-roles] Não foi possível remover os papéis do menu:",
      error,
    );
    return { success: false, ...toActionError(error) };
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
      pathSegment(appCode),
      pathSegment(menuCode),
      departmentCode,
      roleNames,
    );
    return { success: true, data };
  } catch (error) {
    console.error(
      "[menu-assign-roles] Não foi possível atribuir os papéis ao menu:",
      error,
    );
    return { success: false, ...toActionError(error) };
  }
}
