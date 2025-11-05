"use server";

import type {
  CreateUserRequest,
  UpdateUserRequest,
  UserFilters,
} from "@igrp/platform-access-management-client-ts";
import { getClientAccess } from "./access-client";

export async function getUsers(params?: UserFilters, ids?: number[]) {
  const client = await getClientAccess();

  // console.log({ params, ids });

  try {
    const result = await client.users.getUsers(params, ids);
    return result.data;
  } catch (error) {
    console.error("[users] Erro ao carregar lista de utilizadores.:", error);
    throw error;
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
    throw error;
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
    throw error;
  }
}

export async function addRolesToUser(username: string, roleNames: string[]) {
  const client = await getClientAccess();

  // console.log({ username, roleNames });

  try {
    const result = await client.users.addRolesToUser(username, roleNames);
    return result.data;
  } catch (error) {
    console.error(
      "[user-invite] Erro ao carregar adicionar perfis ao utilizador:",
      error,
    );
    throw error;
  }
}

export async function removeRolesFromUser(
  username: string,
  roleNames: string[],
) {
  const client = await getClientAccess();

  try {
    const result = await client.users.removeRolesFromUser(username, roleNames);
    return result.data;
  } catch (error) {
    console.error("[user-invite] Erro ao remover perfis ao utilizador:", error);
    throw error;
  }
}

export async function getUserRoles(username: string) {
  const client = await getClientAccess();

  try {
    const result = await client.users.getUserRoles(username);
    return result.data;
  } catch (error) {
    console.error("[user-role] Erro ao obter perfís de utilizador:", error);
    throw error;
  }
}

export async function updateUser(username: string, user: UpdateUserRequest) {
  const client = await getClientAccess();

  try {
    const result = await client.users.updateUser(username, user);
    return result.data;
  } catch (error) {
    console.error("[user-update] Erro ao editar utilizardor:", error);
    throw error;
  }
}
