import {
  AuditStatus,
  SettingsArea,
  SettingsEntityType,
  SettingsOperation,
} from "@igrp/platform-access-management-client-ts";

/* One map for every enum on the audit screen: filters and table cells read the
   same labels, so a value is never named two ways. Filtering always sends the
   raw enum value. */

export type BadgeColor = "success" | "destructive" | "warning" | "secondary";

export interface FilterOption {
  label: string;
  value: string;
}

export const AUDIT_STATUS: Record<
  AuditStatus,
  { label: string; color: BadgeColor }
> = {
  [AuditStatus.SUCCESS]: { label: "Sucesso", color: "success" },
  [AuditStatus.ACCESS_DENIED]: { label: "Acesso negado", color: "destructive" },
  [AuditStatus.UNUSUAL_IP]: { label: "IP invulgar", color: "warning" },
  [AuditStatus.PENDING]: { label: "Pendente", color: "secondary" },
  [AuditStatus.ERROR]: { label: "Erro", color: "destructive" },
};

/** Statuses the Access Report can return (guide §3.4). */
export const ACCESS_REPORT_STATUSES = [
  AuditStatus.SUCCESS,
  AuditStatus.UNUSUAL_IP,
  AuditStatus.ACCESS_DENIED,
] as const;

export const SETTINGS_AREA_LABELS: Record<SettingsArea, string> = {
  [SettingsArea.APPLICATIONS]: "Aplicações",
  [SettingsArea.USERS]: "Utilizadores",
  [SettingsArea.ACCESS]: "Acessos",
};

export const SETTINGS_ENTITY_TYPE_LABELS: Record<SettingsEntityType, string> = {
  [SettingsEntityType.APPLICATION]: "Aplicação",
  [SettingsEntityType.USER]: "Utilizador",
  [SettingsEntityType.DEPARTMENT]: "Departamento",
  [SettingsEntityType.ROLE]: "Perfil",
  [SettingsEntityType.PERMISSION]: "Permissão",
  [SettingsEntityType.MENU]: "Menu",
};

export const SETTINGS_OPERATION_LABELS: Record<SettingsOperation, string> = {
  [SettingsOperation.CREATE]: "Criação",
  [SettingsOperation.DELETE]: "Eliminação",
  [SettingsOperation.EDIT]: "Edição",
  [SettingsOperation.ACTIVATE]: "Ativação",
  [SettingsOperation.DEACTIVATE]: "Desativação",
  [SettingsOperation.INVITE]: "Convite",
  [SettingsOperation.CANCEL_INVITE]: "Cancelamento de convite",
  [SettingsOperation.RESEND_INVITE]: "Reenvio de convite",
  [SettingsOperation.ASSOCIATE]: "Associação",
  [SettingsOperation.DISASSOCIATE]: "Desassociação",
  [SettingsOperation.ASSIGN]: "Atribuição",
  [SettingsOperation.UNASSIGN]: "Remoção de atribuição",
};

function toOptions<K extends string>(
  labels: Record<K, string>,
  values: readonly K[],
): FilterOption[] {
  return values.map((value) => ({ value, label: labels[value] }));
}

const STATUS_LABELS = Object.fromEntries(
  Object.entries(AUDIT_STATUS).map(([k, v]) => [k, v.label]),
) as Record<AuditStatus, string>;

export const ACCESS_STATUS_OPTIONS = toOptions(
  STATUS_LABELS,
  ACCESS_REPORT_STATUSES,
);
export const SETTINGS_AREA_OPTIONS = toOptions(
  SETTINGS_AREA_LABELS,
  Object.values(SettingsArea),
);
export const SETTINGS_ENTITY_TYPE_OPTIONS = toOptions(
  SETTINGS_ENTITY_TYPE_LABELS,
  Object.values(SettingsEntityType),
);
export const SETTINGS_OPERATION_OPTIONS = toOptions(
  SETTINGS_OPERATION_LABELS,
  Object.values(SettingsOperation),
);

export function statusDisplay(
  value?: string | null,
): { label: string; color: BadgeColor } | null {
  if (!value) return null;
  return (
    AUDIT_STATUS[value as AuditStatus] ?? { label: value, color: "secondary" }
  );
}

export function labelFor(
  map: Record<string, string>,
  value?: string | null,
): string {
  if (!value) return "—";
  return map[value] ?? value;
}
