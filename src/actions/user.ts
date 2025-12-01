"use server";

import type {
  ApiResponse,
  ApplicationDTO,
  IGRPUserDTO,
  InviteUserDTO,
  UserFilters,
  UserInvitationResponseDTO,
} from "@igrp/platform-access-management-client-ts";
import { getClientAccess } from "./access-client";
import { extractApiError } from "@/lib/utils";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function getUsers(
  params?: UserFilters,
): Promise<ActionResult<IGRPUserDTO[]>> {
  const client = await getClientAccess();

  try {
    const result = await client.users.getUsers(params);
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[users] Erro ao carregar lista de utilizadores:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function getCurrentUser(): Promise<ActionResult<IGRPUserDTO>> {
  const client = await getClientAccess();

  try {
    const result = await client.users.getCurrentUser();
    return { success: true, data: result.data };
  } catch (error) {
    console.error(
      "[user-current] Erro ao carregar os dados do utilizador atual:",
      error,
    );
    return { success: false, error: extractApiError(error) };
  }
}

export async function inviteUser(
  user: InviteUserDTO,
): Promise<ActionResult<any>> {
  const client = await getClientAccess();

  try {
    const result = await client.users.inviteUser(user);
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[user-invite] Erro ao enviar convite ao utilizador:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function addRolesToUser(
  id: number,
  departmentCode: string,
  roleCodes: string[],
): Promise<ActionResult<any>> {
  const client = await getClientAccess();

  try {
    const result = await client.users.addRolesToUser(
      id,
      departmentCode,
      roleCodes,
    );
    return { success: true, data: result.data };
  } catch (error: any) {
    return { success: false, error: extractApiError(error) };
  }
}

export async function removeRolesFromUser(
  id: number,
  departmentCode: string,
  roleCodes: string[],
): Promise<ActionResult<any>> {
  const client = await getClientAccess();

  try {
    const result = await client.users.removeRolesFromUser(
      id,
      departmentCode,
      roleCodes,
    );
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[user-remove-roles] Erro ao remover perfis:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function getUserRoles(id: number): Promise<ActionResult<any>> {
  const client = await getClientAccess();

  try {
    const result = await client.users.getUserRoles(id);
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[user-role] Erro ao obter perfis de utilizador:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function updateUser(
  id: number,
  user: IGRPUserDTO,
): Promise<ActionResult<IGRPUserDTO>> {
  const client = await getClientAccess();

  try {
    const result = await client.users.updateUser(id, user);
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[user-update] Erro ao editar utilizador:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function getCurrentUserDepartments(): Promise<ActionResult<any>> {
  const client = await getClientAccess();

  try {
    const result = await client.users.getCurrentUserDepartments();
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[user-departments] Erro ao carregar departamentos:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function getCurrentUserApplications(): Promise<ActionResult<any>> {
  const client = await getClientAccess();

  try {
    const result = await client.users.getCurrentUserApplications();
    return { success: true, data: result.data as ApplicationDTO[] };
  } catch (error) {
    console.error("[user-applications] Erro ao obter aplicações:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function getUserApplications(
  id: number,
): Promise<ActionResult<any>> {
  const client = await getClientAccess();

  try {
    const result = await client.users.getUserApplications(id);
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[user-applications] Erro ao obter aplicações:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function getUserDepartments(
  id: number,
): Promise<ActionResult<any>> {
  const client = await getClientAccess();

  try {
    const result = await client.users.getUserDepartments(id);
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[user-departments] Erro ao obter departamentos:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function getUser(id: number): Promise<ActionResult<IGRPUserDTO>> {
  const client = await getClientAccess();

  try {
    const result = await client.users.getUser(id);
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[user-get] Erro ao obter utilizador:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function getCurrentUserFavoriteApplications(
  applicationName?: string,
): Promise<ActionResult<ApplicationDTO[]>> {
  const client = await getClientAccess();

  try {
    const result =
      await client.users.getCurrentUserFavoriteApplications(applicationName);
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[user-get] Erro ao obter favorites applications:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function addCurrentUserFavoriteApplication(
  applicationCode: string,
): Promise<ActionResult<ApplicationDTO>> {
  const client = await getClientAccess();
  try {
    const result =
      await client.users.addCurrentUserFavoriteApplication(applicationCode);
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[user-get] Erro ao adicionar favorite application:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function removeCurrentUserFavoriteApplication(
  applicationCode: string,
): Promise<ActionResult<ApplicationDTO>> {
  const client = await getClientAccess();
  try {
    const result =
      await client.users.removeCurrentUserFavoriteApplication(applicationCode);
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[user-get] Erro ao remover favorite application:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function getCurrentUserRecentApplications(
  applicationName?: string,
  max?: string,
): Promise<ActionResult<ApplicationDTO[]>> {
  const client = await getClientAccess();

  try {
    const result = await client.users.getCurrentUserRecentApplications(
      applicationName,
      max,
    );
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[user-get] Erro ao obter recent applications:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function registerCurrentUserApplicationAccess(
  applicationCode: string,
): Promise<ActionResult<ApplicationDTO>> {
  const client = await getClientAccess();

  try {
    const result =
      await client.users.registerCurrentUserApplicationAccess(applicationCode);
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[user-get] Erro ao registo de acesso:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function getUserInvitations(
  email?: string,
): Promise<ActionResult<any>> {
  const client = await getClientAccess();

  try {
    const result = await client.users.getUserInvitations(email);
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[user-get] Erro ao obter convites:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function resendUserInvitation(
  id: number,
): Promise<ActionResult<any>> {
  const client = await getClientAccess();

  try {
    const result = await client.users.resendUserInvitation(id);
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[user-get] Erro ao reenviar convite:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function respondUserInvitation(
  response: UserInvitationResponseDTO,
  token: string,
): Promise<ActionResult<any>> {
  const client = await getClientAccess();

  try {
    const result = await client.users.respondUserInvitation(response, token);
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[user-get] Erro ao responder convite:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function updateUserStatus(
  id: number,
  value: string,
): Promise<ActionResult<IGRPUserDTO>> {
  const client = await getClientAccess();

  try {
    const result = await client.users.updateUserStatus(id, value);
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[user-get] Erro ao atualizar status:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function getUserInvitationByToken(
  token: string,
): Promise<ActionResult<any>> {
  const client = await getClientAccess();

  try {
    const result = await client.users.getUserInvitationByToken(token);
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[user-get] Erro ao obter dados convite:", error);
    return { success: false, error: extractApiError(error) };
  }
}
