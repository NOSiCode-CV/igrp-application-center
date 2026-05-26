import type { DepartmentDTO } from "@igrp/platform-access-management-client-ts";
import { describe, expect, it } from "vitest";
import {
  type DialogState,
  dialogReducer,
} from "@/features/departments/dept-dialog-state";

const dept = (code: string): DepartmentDTO =>
  ({ code, name: code, status: "ACTIVE" }) as DepartmentDTO;

const closed: DialogState = { kind: "closed" };

describe("dialogReducer", () => {
  it("opens create with no parent", () => {
    expect(dialogReducer(closed, { type: "openCreate" })).toEqual({
      kind: "create",
      parent: null,
    });
  });

  it("opens create with a parent", () => {
    const parent = dept("HR");
    expect(
      dialogReducer(closed, { type: "openCreateSub", parent }),
    ).toEqual({ kind: "create", parent });
  });

  it("opens edit", () => {
    const d = dept("HR");
    expect(dialogReducer(closed, { type: "openEdit", dept: d })).toEqual({
      kind: "edit",
      dept: d,
    });
  });

  it("opens delete", () => {
    expect(
      dialogReducer(closed, { type: "openDelete", code: "HR", name: "HR" }),
    ).toEqual({ kind: "delete", code: "HR", name: "HR" });
  });

  it("opens manage apps", () => {
    expect(dialogReducer(closed, { type: "openManageApps" })).toEqual({
      kind: "manageApps",
    });
  });

  it("closes from any state", () => {
    expect(dialogReducer({ kind: "edit", dept: dept("X") }, { type: "close" }))
      .toEqual(closed);
  });
});
