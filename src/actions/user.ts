"use server";

import type {
  IGRPUserDTO,
  InviteUserDTO,
  UserFilters,
} from "@igrp/platform-access-management-client-ts";
import { getClientAccess } from "./access-client";
import { extractApiError } from "@/lib/utils";

export async function getUsers(params?: UserFilters) {
  const client = await getClientAccess();

  try {
    const result = await client.users.getUsers(params);
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

export async function inviteUser(user: InviteUserDTO) {
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

export async function addRolesToUser(
  id: number,
  departmentCode: string,
  roleCodes: string[],
) {
  const client = await getClientAccess();

  try {
    const result = await client.users.addRolesToUser(
      id,
      departmentCode,
      roleCodes,
    );
    return result.data;
  } catch (error: any) {
    throw new Error(extractApiError(error));
  }
}

export async function removeRolesFromUser(
  id: number,
  departmentCode: string,
  roleCodes: string[],
) {
  const client = await getClientAccess();

  try {
    const result = await client.users.removeRolesFromUser(
      id,
      departmentCode,
      roleCodes,
    );
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

export async function updateUser(id: number, user: IGRPUserDTO) {
  const client = await getClientAccess();

  try {
    const result = await client.users.updateUser(id, user);
    return result.data;
  } catch (error) {
    console.error("[user-update] Erro ao editar utilizardor:", error);
    throw new Error(extractApiError(error));
  }
}

export async function getCurrentUserDepartments() {
  const client = await getClientAccess();

  try {
    const result = await client.users.getCurrentUserDepartments();
    return result.data;
  } catch (error) {
    console.error(
      "[user-current] Erro ao carregar os dados do utilizador atual.:",
      error,
    );
    throw new Error(extractApiError(error));
  }
}

export async function getCurrentUserApplications() {
  const client = await getClientAccess();

  try {
    const result = await client.users.getCurrentUserApplications();
    return result.data;
  } catch (error) {
    console.error(
      "[user-departments] Erro ao obter departamentos de utilizador:",
      error,
    );
    throw new Error(extractApiError(error));
  }
}
