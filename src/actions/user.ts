"use server";

import type {
  CreateUserRequest,
  UpdateUserRequest,
  UserFilters,
} from "@igrp/platform-access-management-client-ts";
import { getClientAccess } from "./access-client";
import { extractApiError } from "@/lib/utils";

export async function getUsers(params?: UserFilters, ids?: number[]) {
  const client = await getClientAccess();

  try {
    const result = await client.users.getUsers(params, ids);
    return result.data;
  } catch (error) {
    console.error("[users] Erro ao carregar lista de utilizadores.:", error);
    throw new Error(extractApiError(error));
  }
}
export async function getCurrentUser() {
  const client = await getClientAccess();

  try {
    const result = await client.users.getCurrentUser();
    return result.data;
  } catch (error) {
    console.error(
      "[user-current] Erro ao carregar os dados do utilizador atual.:",
      error,
    );
    throw new Error(extractApiError(error));
  }
}
export async function inviteUser(user: CreateUserRequest) {
  const client = await getClientAccess();

  try {
    const result = await client.users.inviteUser(user);
    return result.data;
  } catch (error) {
    console.error(
      "[user-invite] Erro ao enviar convite ao ultilizador(es).:",
      error,
    );
    throw new Error(extractApiError(error));
  }
}

export async function addRolesToUser(id: number, roleNames: string[]) {
  const client = await getClientAccess();

  try {
    const result = await client.users.addRolesToUser(id, roleNames);
    return result.data;
  } catch (error: any) {
    throw new Error(extractApiError(error));
  }
}

export async function removeRolesFromUser(
  id: number,
  roleNames: string[],
) {
  const client = await getClientAccess();

  try {
    const result = await client.users.removeRolesFromUser(id, roleNames);
    return result.data;
  } catch (error) {
    console.error("[user-invite] Erro ao remover perfis ao utilizador:", error);
    throw new Error(extractApiError(error));
  }
}

export async function getUserRoles(id: number) {
  const client = await getClientAccess();

  try {
    const result = await client.users.getUserRoles(id);
    return result.data;
  } catch (error) {
    console.error("[user-role] Erro ao obter perfís de utilizador:", error);
    throw new Error(extractApiError(error));
  }
}

export async function updateUser(id: number, user: UpdateUserRequest) {
  const client = await getClientAccess();

  try {
    const result = await client.users.updateUser(id, user);
    return result.data;
  } catch (error) {
    console.error("[user-update] Erro ao editar utilizardor:", error);
    throw new Error(extractApiError(error));
  }
}
