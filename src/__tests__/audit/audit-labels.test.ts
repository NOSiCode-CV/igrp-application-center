import {
  AuditStatus,
  SettingsArea,
  SettingsEntityType,
  SettingsOperation,
} from "@igrp/platform-access-management-client-ts";
import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";

import {
  ACCESS_REPORT_STATUSES,
  AUDIT_STATUS,
  SETTINGS_AREA_KEYS,
  SETTINGS_ENTITY_TYPE_KEYS,
  SETTINGS_OPERATION_KEYS,
} from "@/features/audit/lib/audit-labels";
import {
  areaLabel,
  entityTypeLabel,
  operationLabel,
  statusDisplay,
} from "@/features/audit/lib/i18n";
import en from "@/i18n/messages/en.json";
import fr from "@/i18n/messages/fr.json";
import pt from "@/i18n/messages/pt.json";

const translators = {
  pt: createTranslator({ locale: "pt", messages: pt, namespace: "audit" }),
  en: createTranslator({ locale: "en", messages: en, namespace: "audit" }),
  fr: createTranslator({ locale: "fr", messages: fr, namespace: "audit" }),
};
const t = translators.pt;

describe("audit labels", () => {
  it("labels every SDK enum value in every language (catches SDK drift at runtime)", () => {
    for (const [locale, tr] of Object.entries(translators)) {
      for (const v of Object.values(AuditStatus))
        expect(statusDisplay(tr, v)?.label, `${locale} ${v}`).not.toBe(v);
      for (const v of Object.values(SettingsArea))
        expect(areaLabel(tr, v), `${locale} ${v}`).not.toBe(v);
      for (const v of Object.values(SettingsEntityType))
        expect(entityTypeLabel(tr, v), `${locale} ${v}`).not.toBe(v);
      for (const v of Object.values(SettingsOperation))
        expect(operationLabel(tr, v), `${locale} ${v}`).not.toBe(v);
    }
  });

  it("maps every enum value to a catalog key", () => {
    for (const v of Object.values(AuditStatus))
      expect(AUDIT_STATUS[v].key).toBeTruthy();
    for (const v of Object.values(SettingsArea))
      expect(SETTINGS_AREA_KEYS[v]).toBeTruthy();
    for (const v of Object.values(SettingsEntityType))
      expect(SETTINGS_ENTITY_TYPE_KEYS[v]).toBeTruthy();
    for (const v of Object.values(SettingsOperation))
      expect(SETTINGS_OPERATION_KEYS[v]).toBeTruthy();
  });

  it("maps statuses to the agreed badge colors", () => {
    expect(AUDIT_STATUS.SUCCESS.color).toBe("success");
    expect(AUDIT_STATUS.ACCESS_DENIED.color).toBe("destructive");
    expect(AUDIT_STATUS.ERROR.color).toBe("destructive");
    expect(AUDIT_STATUS.UNUSUAL_IP.color).toBe("warning");
    expect(AUDIT_STATUS.PENDING.color).toBe("secondary");
  });

  it("offers only the Access Report statuses on that report", () => {
    expect([...ACCESS_REPORT_STATUSES]).toEqual([
      "SUCCESS",
      "UNUSUAL_IP",
      "ACCESS_DENIED",
    ]);
  });

  it("keeps the API codes and translates only the labels", () => {
    expect(statusDisplay(t, "ACCESS_DENIED")).toEqual({
      label: "Acesso negado",
      color: "destructive",
    });
    expect(statusDisplay(translators.en, "ACCESS_DENIED")?.label).toBe(
      "Access denied",
    );
    expect(statusDisplay(translators.fr, "ACCESS_DENIED")?.label).toBe(
      "Accès refusé",
    );
    expect(operationLabel(t, "CREATE")).toBe("Criação");
    expect(operationLabel(translators.en, "CANCEL_INVITE")).toBe(
      "Invitation cancellation",
    );
  });

  it("falls back to the raw value, and to a dash when empty", () => {
    expect(statusDisplay(t, "SOMETHING_NEW")).toEqual({
      label: "SOMETHING_NEW",
      color: "secondary",
    });
    expect(statusDisplay(t, null)).toBeNull();
    expect(areaLabel(t, "USERS")).toBe("Utilizadores");
    expect(areaLabel(t, "NEW_AREA")).toBe("NEW_AREA");
    expect(areaLabel(t, undefined)).toBe("—");
    expect(entityTypeLabel(t, "NEW_TYPE")).toBe("NEW_TYPE");
    expect(operationLabel(t, "")).toBe("—");
  });
});
