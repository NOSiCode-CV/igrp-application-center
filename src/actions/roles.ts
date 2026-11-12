"use server";

import type { RoleDTO } from "@igrp/platform-access-management-client-ts";

import { callApi } from "./call-api";
import type { ActionResult } from "./types";

export async function getRoleByCode(
  name: string,
): Promise<ActionResult<RoleDTO>> {
  return callApi(
    `[role-by-code] Não foi possível obter dado do perfil ${JSON.stringify(String(name))}:`,
    (client) => client.roles.getRoleByCode(name),
  );
}

export async function getRoleById(id: number): Promise<ActionResult<RoleDTO>> {
  return callApi(
    `[role-by-id] Não foi possível obter dado do perfil ${JSON.stringify(String(id))}:`,
    (client) => client.roles.getRoleById(id),
  );
}
