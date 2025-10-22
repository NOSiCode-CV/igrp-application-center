"use server";

import type {
  CreateApplicationRequest,
  UpdateApplicationRequest,
} from "@igrp/platform-access-management-client-ts";
import type { ApplicationArgs } from "@/features/applications/app-schemas";
import { getClientAccess } from "./access-client";

export async function getApplications(): Promise<ApplicationArgs[]> {
  const client = await getClientAccess();

  try {
    const result = await client.applications.getApplications();
    return result.data as ApplicationArgs[];
  } catch (error) {
    console.error("[apps] Não foi possível obter os dados:", error);
    throw error;
  }
}

export async function getApplicationByCode(
  appCode: string,
): Promise<ApplicationArgs> {
  const client = await getClientAccess();

  try {
    const result = await client.applications.getApplications({ code: appCode });
    return result.data[0] as ApplicationArgs;
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
