import type {
  ServiceAccountDTO,
  ServiceAccountRequestDTO,
} from "@igrp/platform-access-management-client-ts";

/** PUT replaces roleIds/permissionIds wholesale — always send the full current set. */
export function toServiceAccountRequest(
  dto: ServiceAccountDTO,
): ServiceAccountRequestDTO {
  return {
    name: dto.name,
    description: dto.description,
    active: dto.active,
    oauthClientId: dto.oauthClientId,
    applicationId: dto.applicationId,
    roleIds: [...(dto.roleIds ?? [])],
    permissionIds: [...(dto.permissionIds ?? [])],
  };
}
