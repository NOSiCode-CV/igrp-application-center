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
import { getTranslations } from "next-intl/server";

import {
  mapperListMenusCRUD,
  mapperMenuCRUD,
} from "@/features/menus/menu-mapper";

import { callApi } from "./call-api";
import type { ActionResult } from "./types";

export async function getApplications(
  filters?: ApplicationFilters,
): Promise<ActionResult<ApplicationDTO[]>> {
  return callApi("[apps] Não foi possível obter os dados:", (client) =>
    client.applications.getApplications(filters),
  );
}

export async function getApplicationByCode(
  appCode: string,
): Promise<ActionResult<ApplicationDTO>> {
  const result = await callApi(
    "[app-by-code] Não foi possível obter os dados da aplicação:",
    (client) => client.applications.getApplications({ code: appCode }),
  );
  if (!result.success) return result;
  // Exact match: an empty or partial-match list must not yield another app.
  const app = result.data.find((a) => a.code === appCode);
  if (app) return { success: true, data: app };
  const t = await getTranslations("applications.details");
  return { success: false, status: 404, error: t("notFound") };
}

export async function createApplication(
  application: CreateApplicationRequest,
): Promise<ActionResult<ApplicationDTO>> {
  return callApi("[app-create] Não foi possível criar à aplicação:", (client) =>
    client.applications.createApplication(application),
  );
}

export async function updateApplication(
  code: string,
  updated: UpdateApplicationRequest,
): Promise<ActionResult<ApplicationDTO>> {
  return callApi(
    "[app-update] Não foi possível atualizar à aplicação:",
    (client) => client.applications.updateApplication(code, updated),
  );
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
  return callApi(
    "[menus-get]: Erro ao carregar os menus da aplicação:",
    async (client) => ({
      data: mapperListMenusCRUD(
        await client.applications.getMenus(pathSegment(code)),
      ),
    }),
  );
}

export async function createMenu(
  appCode: string,
  menu: CreateMenuRequest,
): Promise<ActionResult<IGRPMenuCRUDArgs>> {
  return callApi(
    "[menu-create] Não foi possível criar menu:",
    async (client) => ({
      data: mapperMenuCRUD(
        await client.applications.createMenu(pathSegment(appCode), menu),
      ),
    }),
  );
}

export async function updateMenu(
  appCode: string,
  menuCode: string,
  updated: UpdateMenuRequest,
): Promise<ActionResult<IGRPMenuCRUDArgs>> {
  return callApi(
    "[menu-update] Não foi possível atualizar menu:",
    async (client) => ({
      data: mapperMenuCRUD(
        await client.applications.updateMenu(
          pathSegment(appCode),
          pathSegment(menuCode),
          updated,
        ),
      ),
    }),
  );
}

export async function deleteMenu(
  appCode: string,
  menuCode: string,
): Promise<ActionResult<string>> {
  return callApi("[menu-delete] Não foi possível eliminar menu:", (client) =>
    client.applications.deleteMenu(pathSegment(appCode), pathSegment(menuCode)),
  );
}

export async function removeRolesFromMenu(
  appCode: string,
  menuCode: string,
  departmentCode: string,
  roleNames: string[],
): Promise<ActionResult<MenuEntryDTO>> {
  return callApi(
    "[menu-remove-roles] Não foi possível remover os papéis do menu:",
    (client) =>
      client.applications.removeRolesFromMenu(
        pathSegment(appCode),
        pathSegment(menuCode),
        departmentCode,
        roleNames,
      ),
  );
}

export async function addRolesToMenu(
  appCode: string,
  menuCode: string,
  departmentCode: string,
  roleNames: string[],
): Promise<ActionResult<MenuEntryDTO>> {
  return callApi(
    "[menu-assign-roles] Não foi possível atribuir os papéis ao menu:",
    (client) =>
      client.applications.addRolesToMenu(
        pathSegment(appCode),
        pathSegment(menuCode),
        departmentCode,
        roleNames,
      ),
  );
}
