import { useMemo } from "react";

import {
  SettingsArea,
  SettingsEntityType,
  SettingsOperation,
} from "@igrp/platform-access-management-client-ts";
import { useTranslations } from "next-intl";

import {
  ACCESS_REPORT_STATUSES,
  AUDIT_STATUS,
  type AuditStatusKey,
  type BadgeColor,
  SETTINGS_AREA_KEYS,
  SETTINGS_ENTITY_TYPE_KEYS,
  SETTINGS_OPERATION_KEYS,
  type SettingsAreaKey,
  type SettingsEntityTypeKey,
  type SettingsOperationKey,
} from "./audit-labels";

/** `useTranslations("audit")` / `getTranslations("audit")` result. */
export type AuditTranslator = ReturnType<typeof useTranslations<"audit">>;

export interface FilterOption {
  label: string;
  value: string;
}

/* Every lookup falls back to the raw API code for a value the catalog does
   not know (a code the SDK added since), and to a dash when empty. */
function keyOf<K extends string>(
  keys: Record<string, K>,
  value?: string | null,
): K | undefined {
  return value ? keys[value] : undefined;
}

export function statusDisplay(
  t: AuditTranslator,
  value?: string | null,
): { label: string; color: BadgeColor } | null {
  if (!value) return null;
  const entry: { key: AuditStatusKey; color: BadgeColor } | undefined = (
    AUDIT_STATUS as Record<string, { key: AuditStatusKey; color: BadgeColor }>
  )[value];
  return entry
    ? { label: t(`status.${entry.key}`), color: entry.color }
    : { label: value, color: "secondary" };
}

export function areaLabel(t: AuditTranslator, value?: string | null): string {
  if (!value) return "—";
  const key: SettingsAreaKey | undefined = keyOf(SETTINGS_AREA_KEYS, value);
  return key ? t(`area.${key}`) : value;
}

export function entityTypeLabel(
  t: AuditTranslator,
  value?: string | null,
): string {
  if (!value) return "—";
  const key: SettingsEntityTypeKey | undefined = keyOf(
    SETTINGS_ENTITY_TYPE_KEYS,
    value,
  );
  return key ? t(`entityType.${key}`) : value;
}

export function operationLabel(
  t: AuditTranslator,
  value?: string | null,
): string {
  if (!value) return "—";
  const key: SettingsOperationKey | undefined = keyOf(
    SETTINGS_OPERATION_KEYS,
    value,
  );
  return key ? t(`operation.${key}`) : value;
}

/** The Access Report's statuses, as filter options (raw codes as values). */
export function useAccessStatusOptions(): FilterOption[] {
  const t = useTranslations("audit");
  return useMemo(
    () =>
      ACCESS_REPORT_STATUSES.map((value) => ({
        value,
        label: statusDisplay(t, value)?.label ?? value,
      })),
    [t],
  );
}

export function useSettingsAreaOptions(): FilterOption[] {
  const t = useTranslations("audit");
  return useMemo(
    () =>
      Object.values(SettingsArea).map((value) => ({
        value,
        label: areaLabel(t, value),
      })),
    [t],
  );
}

export function useSettingsEntityTypeOptions(): FilterOption[] {
  const t = useTranslations("audit");
  return useMemo(
    () =>
      Object.values(SettingsEntityType).map((value) => ({
        value,
        label: entityTypeLabel(t, value),
      })),
    [t],
  );
}

export function useSettingsOperationOptions(): FilterOption[] {
  const t = useTranslations("audit");
  return useMemo(
    () =>
      Object.values(SettingsOperation).map((value) => ({
        value,
        label: operationLabel(t, value),
      })),
    [t],
  );
}
