import {
  AuditStatus,
  SettingsArea,
  SettingsEntityType,
  SettingsOperation,
} from "@igrp/platform-access-management-client-ts";

/* The API codes of every enum on the audit screen, each mapped to its
   `audit.*` catalog key (and, for a status, its badge color). The labels live
   in the catalogs (see `./i18n`): filters and table cells read the same ones,
   so a value is never named two ways. Filtering always sends the raw enum
   value. */

export type BadgeColor = "success" | "destructive" | "warning" | "secondary";

export type AuditStatusKey =
  | "success"
  | "accessDenied"
  | "unusualIp"
  | "pending"
  | "error";

export const AUDIT_STATUS: Record<
  AuditStatus,
  { key: AuditStatusKey; color: BadgeColor }
> = {
  [AuditStatus.SUCCESS]: { key: "success", color: "success" },
  [AuditStatus.ACCESS_DENIED]: { key: "accessDenied", color: "destructive" },
  [AuditStatus.UNUSUAL_IP]: { key: "unusualIp", color: "warning" },
  [AuditStatus.PENDING]: { key: "pending", color: "secondary" },
  [AuditStatus.ERROR]: { key: "error", color: "destructive" },
};

/** Statuses the Access Report can return (guide §3.4). */
export const ACCESS_REPORT_STATUSES = [
  AuditStatus.SUCCESS,
  AuditStatus.UNUSUAL_IP,
  AuditStatus.ACCESS_DENIED,
] as const;

export type SettingsAreaKey = "applications" | "users" | "access";

export const SETTINGS_AREA_KEYS: Record<SettingsArea, SettingsAreaKey> = {
  [SettingsArea.APPLICATIONS]: "applications",
  [SettingsArea.USERS]: "users",
  [SettingsArea.ACCESS]: "access",
};

export type SettingsEntityTypeKey =
  | "application"
  | "user"
  | "department"
  | "role"
  | "permission"
  | "menu";

export const SETTINGS_ENTITY_TYPE_KEYS: Record<
  SettingsEntityType,
  SettingsEntityTypeKey
> = {
  [SettingsEntityType.APPLICATION]: "application",
  [SettingsEntityType.USER]: "user",
  [SettingsEntityType.DEPARTMENT]: "department",
  [SettingsEntityType.ROLE]: "role",
  [SettingsEntityType.PERMISSION]: "permission",
  [SettingsEntityType.MENU]: "menu",
};

export type SettingsOperationKey =
  | "create"
  | "delete"
  | "edit"
  | "activate"
  | "deactivate"
  | "invite"
  | "cancelInvite"
  | "resendInvite"
  | "associate"
  | "disassociate"
  | "assign"
  | "unassign";

export const SETTINGS_OPERATION_KEYS: Record<
  SettingsOperation,
  SettingsOperationKey
> = {
  [SettingsOperation.CREATE]: "create",
  [SettingsOperation.DELETE]: "delete",
  [SettingsOperation.EDIT]: "edit",
  [SettingsOperation.ACTIVATE]: "activate",
  [SettingsOperation.DEACTIVATE]: "deactivate",
  [SettingsOperation.INVITE]: "invite",
  [SettingsOperation.CANCEL_INVITE]: "cancelInvite",
  [SettingsOperation.RESEND_INVITE]: "resendInvite",
  [SettingsOperation.ASSOCIATE]: "associate",
  [SettingsOperation.DISASSOCIATE]: "disassociate",
  [SettingsOperation.ASSIGN]: "assign",
  [SettingsOperation.UNASSIGN]: "unassign",
};
