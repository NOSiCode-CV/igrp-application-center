"use server";

import type {
  ApplicationFilters,
  CreateApplicationRequest,
  UpdateApplicationRequest,
} from "@igrp/platform-access-management-client-ts";
import type { ApplicationArgs } from "@/features/applications/app-schemas";
import { getClientAccess } from "./access-client";
import { MenuArgs } from "@/features/menus/menu-schemas";
import { IGRPApplicationArgs } from "@igrp/framework-next-types";

export async function getApplications(
  filters?: ApplicationFilters,
): Promise<ApplicationArgs[]> {
  const client = await getClientAccess();

  try {
    const result = await client.applications.getApplications(filters);
    return result.data as ApplicationArgs[];
  } catch (error) {
    console.error("[apps] Não foi possível obter os dados:", error);
    throw error;
  }
}

export async function getApplicationByCode(
  appCode: string,
): Promise<IGRPApplicationArgs> {
  const client = await getClientAccess();

  try {
    const result = await client.applications.getApplications({ code: appCode });
    return result.data[0] as IGRPApplicationArgs;
  } catch (error) {
    console.error(
      "[app-by-code] Não foi possível obter os dados da aplicação:",
      error,
    );
    throw error;
  }
}

export async function createApplication(application: CreateApplicationRequest) {
  const client = await getClientAccess();

  try {
    const result = await client.applications.createApplication(application);
    return result.data as ApplicationArgs;
  } catch (error) {
    console.error("[app-create] Não foi possível criar à aplicação:", error);
    throw error;
  }
}

export async function updateApplication(
  code: string,
  updated: UpdateApplicationRequest,
) {
  const client = await getClientAccess();

  try {
    const result = await client.applications.updateApplication(code, updated);
    return result.data as ApplicationArgs;
  } catch (error) {
    console.error(
      "[app-update] Não foi possível atualizar à aplicação:",
      error,
    );
    throw error;
  }
}

export async function getAvailableMenus(appCode: string) {
  const client = await getClientAccess();

  try {
    const result = await client.applications.getAvailableMenus(appCode);
    return result.data as MenuArgs[];
  } catch (error) {
    console.error(
      "[app-available-menus] Não foi possível obter os menus:",
      error,
    );
    throw error;
  }
}

export async function addDepartmentsToApplication(
  appCode: string,
  departmentIds: string[],
) {
  const client = await getClientAccess();
  try {
    const result = await client.applications.addDepartmentsToApplication(
      appCode,
      departmentIds,
    );
    return result.data;
  } catch (error) {
    console.error(
      "[app-available-applications] Não foi possível adicionar departamentos:",
      error,
    );
    throw error;
  }
}

export async function removeDepartmentsFromApplication(
  appCode: string,
  departmentIds: string[],
) {
  const client = await getClientAccess();
  try {
    const result = await client.applications.removeDepartmentsFromApplication(
      appCode,
      departmentIds,
    );
    return result.data;
  } catch (error) {
    console.error(
      "[app-available-applications] Não foi possível remover departamentos:",
      error,
    );
    throw error;
  }
}
