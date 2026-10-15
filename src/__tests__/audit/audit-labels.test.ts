import {
  AuditStatus,
  SettingsArea,
  SettingsEntityType,
  SettingsOperation,
} from "@igrp/platform-access-management-client-ts";
import { describe, expect, it } from "vitest";

import {
  ACCESS_STATUS_OPTIONS,
  AUDIT_STATUS,
  labelFor,
  SETTINGS_AREA_LABELS,
  SETTINGS_ENTITY_TYPE_LABELS,
  SETTINGS_OPERATION_LABELS,
  SETTINGS_OPERATION_OPTIONS,
  statusDisplay,
} from "@/features/audit/lib/audit-labels";

describe("audit labels", () => {
  it("labels every SDK enum value (catches SDK drift at runtime)", () => {
    for (const v of Object.values(AuditStatus))
      expect(AUDIT_STATUS[v].label).toBeTruthy();
    for (const v of Object.values(SettingsArea))
      expect(SETTINGS_AREA_LABELS[v]).toBeTruthy();
    for (const v of Object.values(SettingsEntityType))
      expect(SETTINGS_ENTITY_TYPE_LABELS[v]).toBeTruthy();
    for (const v of Object.values(SettingsOperation))
      expect(SETTINGS_OPERATION_LABELS[v]).toBeTruthy();
  });

  it("maps statuses to the agreed badge colors", () => {
    expect(AUDIT_STATUS.SUCCESS.color).toBe("success");
    expect(AUDIT_STATUS.ACCESS_DENIED.color).toBe("destructive");
    expect(AUDIT_STATUS.ERROR.color).toBe("destructive");
    expect(AUDIT_STATUS.UNUSUAL_IP.color).toBe("warning");
    expect(AUDIT_STATUS.PENDING.color).toBe("secondary");
  });

  it("offers only the Access Report statuses on that report", () => {
    expect(ACCESS_STATUS_OPTIONS.map((o) => o.value)).toEqual([
      "SUCCESS",
      "UNUSUAL_IP",
      "ACCESS_DENIED",
    ]);
  });

  it("builds one option per operation, in enum order", () => {
    expect(SETTINGS_OPERATION_OPTIONS).toHaveLength(12);
    expect(SETTINGS_OPERATION_OPTIONS[0]).toEqual({
      value: "CREATE",
      label: "Criação",
    });
  });

  it("falls back to the raw value, and to a dash when empty", () => {
    expect(statusDisplay("SOMETHING_NEW")).toEqual({
      label: "SOMETHING_NEW",
      color: "secondary",
    });
    expect(statusDisplay(null)).toBeNull();
    expect(labelFor(SETTINGS_AREA_LABELS, "USERS")).toBe("Utilizadores");
    expect(labelFor(SETTINGS_AREA_LABELS, "NEW_AREA")).toBe("NEW_AREA");
    expect(labelFor(SETTINGS_AREA_LABELS, undefined)).toBe("—");
  });
});
