"use server";

import type { RoleDTO } from "@igrp/platform-access-management-client-ts";
import { extractApiError } from "@/lib/utils";
import { getClientAccess } from "./access-client";

export async function getRoleByCode(name: string) {
  const client = await getClientAccess();

  try {
    const result = await client.roles.getRoleByCode(name);
    return result.data as RoleDTO;
  } catch (error) {
    console.error(
      `[role-by-name] Não foi possível obter dado do perfil ${name}.:`,
      error,
    );
    throw new Error(extractApiError(error));
  }
}

export async function getRoleById(id: number) {
  const client = await getClientAccess();

  try {
    const result = await client.roles.getRoleById(id);
    return result.data as RoleDTO;
  } catch (error) {
    console.error(
      `[role-by-name] Não foi possível obter dado do perfil ${id}.:`,
      error,
    );
    throw new Error(extractApiError(error));
  }
}
