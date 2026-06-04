"use server";

import type {
  AddRolesToUserRequestDTO,
  ApplicationDTO,
  DepartmentDTO,
  IGRPUserDTO,
  InviteUserDTO,
  RoleDTO,
  UserFilters,
  UserInvitationResponseDTO,
  UserMetadataDTO,
} from "@igrp/platform-access-management-client-ts";

import { extractApiError } from "@/lib/utilities";

import { getClientAccess } from "./access-client";
import type { AccessClient, ActionResult, SdkData } from "./types";

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
): Promise<ActionResult<SdkData<AccessClient["users"]["inviteUser"]>>> {
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
  id: string,
  departmentCode: string,
  request: AddRolesToUserRequestDTO,
): Promise<ActionResult<RoleDTO>> {
  const client = await getClientAccess();

  try {
    const result = await client.users.addRolesToUser(
      id,
      departmentCode,
      request,
    );
    return { success: true, data: result.data };
  } catch (error: unknown) {
    console.error("[user-add-roles] Erro ao adicionar perfis:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function removeRolesFromUser(
  id: string,
  departmentCode: string,
  roleCodes: string[],
): Promise<ActionResult<RoleDTO>> {
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

export async function getCurrentUserRoles(): Promise<ActionResult<RoleDTO[]>> {
  const client = await getClientAccess();
  try {
    const result = await client.users.getCurrentUserRoles();
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[user-get] Erro ao obter roles:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function getUserRoles(
  id: string,
): Promise<ActionResult<RoleDTO[]>> {
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
  id: string,
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

export async function getCurrentUserDepartments(): Promise<
  ActionResult<DepartmentDTO[]>
> {
  const client = await getClientAccess();

  try {
    const result = await client.users.getCurrentUserDepartments();
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[user-departments] Erro ao carregar departamentos:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function getCurrentUserApplications(): Promise<
  ActionResult<ApplicationDTO[]>
> {
  const client = await getClientAccess();

  try {
    const result = await client.users.getCurrentUserApplications();
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[user-applications] Erro ao obter aplicações:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function getUserApplications(
  id: string,
): Promise<ActionResult<ApplicationDTO[]>> {
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
  id: string,
): Promise<ActionResult<DepartmentDTO[]>> {
  const client = await getClientAccess();

  try {
    const result = await client.users.getUserDepartments(id);
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[user-departments] Erro ao obter departamentos:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function getUser(id: string): Promise<ActionResult<IGRPUserDTO>> {
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
): Promise<ActionResult<SdkData<AccessClient["users"]["getUserInvitations"]>>> {
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
): Promise<
  ActionResult<SdkData<AccessClient["users"]["resendUserInvitation"]>>
> {
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
): Promise<
  ActionResult<SdkData<AccessClient["users"]["respondUserInvitation"]>>
> {
  const client = await getClientAccess();

  try {
    const result = await client.users.respondUserInvitation(response, token);
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[user-get] Erro ao responder convite:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function cancelUserInvitation(
  id: number,
): Promise<
  ActionResult<SdkData<AccessClient["users"]["cancelUserInvitation"]>>
> {
  const client = await getClientAccess();

  try {
    const result = await client.users.cancelUserInvitation(id);
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[user-get] Erro ao cancelar convite:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function updateUserStatus(
  id: string,
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
): Promise<
  ActionResult<SdkData<AccessClient["users"]["getUserInvitationByToken"]>>
> {
  const client = await getClientAccess();

  try {
    const result = await client.users.getUserInvitationByToken(token);
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[user-get] Erro ao obter dados convite:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function getCurrentUserActiveRole(): Promise<
  ActionResult<SdkData<AccessClient["users"]["getCurrentUserActiveRole"]>>
> {
  const client = await getClientAccess();

  try {
    const result = await client.users.getCurrentUserActiveRole();
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[user-get] Erro ao obter active role:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function setCurrentUserActiveRole(
  role: Parameters<AccessClient["users"]["setCurrentUserActiveRole"]>[0],
): Promise<
  ActionResult<SdkData<AccessClient["users"]["setCurrentUserActiveRole"]>>
> {
  const client = await getClientAccess();

  try {
    const result = await client.users.setCurrentUserActiveRole(role);
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[user-get] Erro ao definir active role:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function validateInvitationEmail(
  request: Parameters<AccessClient["users"]["validateInvitationEmail"]>[0],
): Promise<
  ActionResult<SdkData<AccessClient["users"]["validateInvitationEmail"]>>
> {
  const client = await getClientAccess();

  try {
    const result = await client.users.validateInvitationEmail(request);
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[invitation] Erro ao validar email de convite:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function validateInvitationOtp(
  request: Parameters<AccessClient["users"]["validateInvitationOtp"]>[0],
): Promise<
  ActionResult<SdkData<AccessClient["users"]["validateInvitationOtp"]>>
> {
  const client = await getClientAccess();

  try {
    const result = await client.users.validateInvitationOtp(request);
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[invitation] Erro ao validar código OTP de convite:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function getUserMetadata(
  id: string,
): Promise<ActionResult<UserMetadataDTO>> {
  const client = await getClientAccess();

  try {
    const result = await client.users.getUserMetadata(id);
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[user-metadata] Erro ao carregar metadados:", error);
    return { success: false, error: extractApiError(error) };
  }
}

export async function updateUserMetadata(
  id: string,
  metadata: Record<string, unknown>,
): Promise<ActionResult<UserMetadataDTO>> {
  const client = await getClientAccess();

  try {
    const result = await client.users.updateUserMetadata(id, { metadata });
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[user-metadata] Erro ao atualizar metadados:", error);
    return { success: false, error: extractApiError(error) };
  }
}
