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

import { callApi } from "./call-api";
import type { AccessClient, ActionResult, SdkData } from "./types";

export async function getUsers(
  params?: UserFilters,
): Promise<ActionResult<IGRPUserDTO[]>> {
  return callApi("[users] Erro ao carregar lista de utilizadores:", (client) =>
    client.users.getUsers(params),
  );
}

export async function getCurrentUser(): Promise<ActionResult<IGRPUserDTO>> {
  return callApi(
    "[user-current] Erro ao carregar os dados do utilizador atual:",
    (client) => client.users.getCurrentUser(),
  );
}

export async function inviteUser(
  user: InviteUserDTO,
): Promise<ActionResult<SdkData<AccessClient["users"]["inviteUser"]>>> {
  return callApi(
    "[user-invite] Erro ao enviar convite ao utilizador:",
    (client) => client.users.inviteUser(user),
  );
}

export async function addRolesToUser(
  id: string,
  departmentCode: string,
  request: AddRolesToUserRequestDTO,
): Promise<ActionResult<RoleDTO>> {
  return callApi("[user-add-roles] Erro ao adicionar perfis:", (client) =>
    client.users.addRolesToUser(id, departmentCode, request),
  );
}

export async function removeRolesFromUser(
  id: string,
  departmentCode: string,
  roleCodes: string[],
): Promise<ActionResult<RoleDTO>> {
  return callApi("[user-remove-roles] Erro ao remover perfis:", (client) =>
    client.users.removeRolesFromUser(id, departmentCode, roleCodes),
  );
}

export async function getCurrentUserRoles(): Promise<ActionResult<RoleDTO[]>> {
  return callApi("[get-current-user-roles] Erro ao obter roles:", (client) =>
    client.users.getCurrentUserRoles(),
  );
}

export async function getUserRoles(
  id: string,
): Promise<ActionResult<RoleDTO[]>> {
  return callApi("[user-role] Erro ao obter perfis de utilizador:", (client) =>
    client.users.getUserRoles(id),
  );
}

// Maximum length the server enforces on `nic` (@Size(max=13)).
const NIC_MAX_LENGTH = 13;

// `updateUser` is a full PUT: every call re-sends the whole DTO, including
// fields the UI never touches. Pre-existing rows can carry values that violate
// constraints added later server-side (e.g. an over-length `nic`, or an empty
// `phoneNumber` that fails the E.164 `@Pattern`). Normalize those here so an
// unrelated edit (name, avatar, status) is not rejected by stale data.
function sanitizeUserForUpdate(user: IGRPUserDTO): IGRPUserDTO {
  const sanitized: IGRPUserDTO = { ...user };

  const nic = sanitized.nic?.trim();
  if (!nic || nic.length > NIC_MAX_LENGTH) {
    // Drop invalid/empty values rather than truncate — silently shortening an
    // identity number would be worse than omitting it.
    sanitized.nic = null;
  } else {
    sanitized.nic = nic;
  }

  // Empty string fails the server `@Pattern`; null means "no phone".
  const phone = sanitized.phoneNumber?.trim();
  sanitized.phoneNumber = phone ? phone : null;

  return sanitized;
}

/** The fields the UI edits; everything else is kept from a fresh read. */
export type UserPatch = Partial<
  Pick<IGRPUserDTO, "name" | "picture" | "signature" | "status">
>;

// PUT replaces the whole record, so the patch goes onto a fresh GET: a stale
// browser cache must not write back fields someone else changed meanwhile.
// Your own record is read through `/me`, which needs no admin permission.
export async function updateUser(
  id: string,
  patch: UserPatch,
): Promise<ActionResult<IGRPUserDTO>> {
  return callApi("[user-update] Erro ao editar utilizador:", async (client) => {
    const me = (await client.users.getCurrentUser()).data;
    const fresh = me.id === id ? me : (await client.users.getUser(id)).data;
    return client.users.updateUser(
      id,
      sanitizeUserForUpdate({ ...fresh, ...patch }),
    );
  });
}

export async function getCurrentUserDepartments(): Promise<
  ActionResult<DepartmentDTO[]>
> {
  return callApi(
    "[user-departments] Erro ao carregar departamentos:",
    (client) => client.users.getCurrentUserDepartments(),
  );
}

export async function getCurrentUserApplications(): Promise<
  ActionResult<ApplicationDTO[]>
> {
  return callApi("[user-applications] Erro ao obter aplicações:", (client) =>
    client.users.getCurrentUserApplications(),
  );
}

export async function getUserApplications(
  id: string,
): Promise<ActionResult<ApplicationDTO[]>> {
  return callApi("[user-applications] Erro ao obter aplicações:", (client) =>
    client.users.getUserApplications(id),
  );
}

export async function getUserDepartments(
  id: string,
): Promise<ActionResult<DepartmentDTO[]>> {
  return callApi("[user-departments] Erro ao obter departamentos:", (client) =>
    client.users.getUserDepartments(id),
  );
}

export async function getUser(id: string): Promise<ActionResult<IGRPUserDTO>> {
  return callApi("[get-user] Erro ao obter utilizador:", (client) =>
    client.users.getUser(id),
  );
}

export async function getCurrentUserFavoriteApplications(
  applicationName?: string,
): Promise<ActionResult<ApplicationDTO[]>> {
  return callApi(
    "[get-current-user-favorite-applications] Erro ao obter favorites applications:",
    (client) =>
      client.users.getCurrentUserFavoriteApplications(applicationName),
  );
}

export async function addCurrentUserFavoriteApplication(
  applicationCode: string,
): Promise<ActionResult<ApplicationDTO>> {
  return callApi(
    "[add-current-user-favorite-application] Erro ao adicionar favorite application:",
    (client) => client.users.addCurrentUserFavoriteApplication(applicationCode),
  );
}

export async function removeCurrentUserFavoriteApplication(
  applicationCode: string,
): Promise<ActionResult<ApplicationDTO>> {
  return callApi(
    "[remove-current-user-favorite-application] Erro ao remover favorite application:",
    (client) =>
      client.users.removeCurrentUserFavoriteApplication(applicationCode),
  );
}

export async function getCurrentUserRecentApplications(
  applicationName?: string,
  max?: string,
): Promise<ActionResult<ApplicationDTO[]>> {
  return callApi(
    "[get-current-user-recent-applications] Erro ao obter recent applications:",
    (client) =>
      client.users.getCurrentUserRecentApplications(applicationName, max),
  );
}

export async function registerCurrentUserApplicationAccess(
  applicationCode: string,
): Promise<ActionResult<ApplicationDTO>> {
  return callApi(
    "[register-current-user-application-access] Erro ao registo de acesso:",
    (client) =>
      client.users.registerCurrentUserApplicationAccess(applicationCode),
  );
}

export async function getUserInvitations(
  email?: string,
): Promise<ActionResult<SdkData<AccessClient["users"]["getUserInvitations"]>>> {
  return callApi("[get-user-invitations] Erro ao obter convites:", (client) =>
    client.users.getUserInvitations(email),
  );
}

export async function resendUserInvitation(
  id: number,
): Promise<
  ActionResult<SdkData<AccessClient["users"]["resendUserInvitation"]>>
> {
  return callApi(
    "[resend-user-invitation] Erro ao reenviar convite:",
    (client) => client.users.resendUserInvitation(id),
  );
}

export async function respondUserInvitation(
  response: UserInvitationResponseDTO,
  token: string,
): Promise<
  ActionResult<SdkData<AccessClient["users"]["respondUserInvitation"]>>
> {
  return callApi(
    "[respond-user-invitation] Erro ao responder convite:",
    (client) => client.users.respondUserInvitation(response, token),
  );
}

export async function cancelUserInvitation(
  id: number,
): Promise<
  ActionResult<SdkData<AccessClient["users"]["cancelUserInvitation"]>>
> {
  return callApi(
    "[cancel-user-invitation] Erro ao cancelar convite:",
    (client) => client.users.cancelUserInvitation(id),
  );
}

export async function updateUserStatus(
  id: string,
  value: string,
): Promise<ActionResult<IGRPUserDTO>> {
  return callApi("[update-user-status] Erro ao atualizar status:", (client) =>
    client.users.updateUserStatus(id, value),
  );
}

export async function getUserInvitationByToken(
  token: string,
): Promise<
  ActionResult<SdkData<AccessClient["users"]["getUserInvitationByToken"]>>
> {
  return callApi(
    "[get-user-invitation-by-token] Erro ao obter dados convite:",
    (client) => client.users.getUserInvitationByToken(token),
  );
}

export async function getCurrentUserActiveRole(): Promise<
  ActionResult<SdkData<AccessClient["users"]["getCurrentUserActiveRole"]>>
> {
  return callApi(
    "[get-current-user-active-role] Erro ao obter active role:",
    (client) => client.users.getCurrentUserActiveRole(),
  );
}

export async function setCurrentUserActiveRole(
  role: Parameters<AccessClient["users"]["setCurrentUserActiveRole"]>[0],
): Promise<
  ActionResult<SdkData<AccessClient["users"]["setCurrentUserActiveRole"]>>
> {
  return callApi(
    "[set-current-user-active-role] Erro ao definir active role:",
    (client) => client.users.setCurrentUserActiveRole(role),
  );
}

export async function validateInvitationEmail(
  request: Parameters<AccessClient["users"]["validateInvitationEmail"]>[0],
): Promise<
  ActionResult<SdkData<AccessClient["users"]["validateInvitationEmail"]>>
> {
  return callApi("[invitation] Erro ao validar email de convite:", (client) =>
    client.users.validateInvitationEmail(request),
  );
}

export async function validateInvitationOtp(
  request: Parameters<AccessClient["users"]["validateInvitationOtp"]>[0],
): Promise<
  ActionResult<SdkData<AccessClient["users"]["validateInvitationOtp"]>>
> {
  return callApi(
    "[invitation] Erro ao validar código OTP de convite:",
    (client) => client.users.validateInvitationOtp(request),
  );
}

export async function getUserMetadata(
  id: string,
): Promise<ActionResult<UserMetadataDTO>> {
  return callApi("[user-metadata] Erro ao carregar metadados:", (client) =>
    client.users.getUserMetadata(id),
  );
}

export async function updateUserMetadata(
  id: string,
  metadata: Record<string, unknown>,
): Promise<ActionResult<UserMetadataDTO>> {
  return callApi("[user-metadata] Erro ao atualizar metadados:", (client) =>
    client.users.updateUserMetadata(id, { metadata }),
  );
}
