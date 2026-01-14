"use server";

import { getClientAccess } from "./access-client";
import { extractApiError } from "@/lib/utils";
import { RoleDTO } from "@igrp/platform-access-management-client-ts";

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
