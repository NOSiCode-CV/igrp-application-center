"use server";

import type { RoleDTO } from "@igrp/platform-access-management-client-ts";

import { toActionError } from "@/lib/app-utilities";

import { getClientAccess } from "./access-client";
import type { ActionResult } from "./types";

export async function getRoleByCode(
  name: string,
): Promise<ActionResult<RoleDTO>> {
  const client = await getClientAccess();

  try {
    const result = await client.roles.getRoleByCode(name);
    return { success: true, data: result.data as RoleDTO };
  } catch (error) {
    console.error(
      `[role-by-code] Não foi possível obter dado do perfil ${name}:`,
      error,
    );
    return { success: false, ...toActionError(error) };
  }
}

export async function getRoleById(id: number): Promise<ActionResult<RoleDTO>> {
  const client = await getClientAccess();

  try {
    const result = await client.roles.getRoleById(id);
    return { success: true, data: result.data as RoleDTO };
  } catch (error) {
    console.error(
      `[role-by-id] Não foi possível obter dado do perfil ${id}:`,
      error,
    );
    return { success: false, ...toActionError(error) };
  }
}
