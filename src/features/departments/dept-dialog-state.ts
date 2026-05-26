import type { DepartmentDTO } from "@igrp/platform-access-management-client-ts";

export type DialogState =
  | { kind: "closed" }
  | { kind: "create"; parent: DepartmentDTO | null }
  | { kind: "edit"; dept: DepartmentDTO }
  | { kind: "delete"; code: string; name: string }
  | { kind: "manageApps" };

export type DialogAction =
  | { type: "openCreate" }
  | { type: "openCreateSub"; parent: DepartmentDTO }
  | { type: "openEdit"; dept: DepartmentDTO }
  | { type: "openDelete"; code: string; name: string }
  | { type: "openManageApps" }
  | { type: "close" };

export const closedDialog: DialogState = { kind: "closed" };

export function dialogReducer(
  _state: DialogState,
  action: DialogAction,
): DialogState {
  switch (action.type) {
    case "openCreate":
      return { kind: "create", parent: null };
    case "openCreateSub":
      return { kind: "create", parent: action.parent };
    case "openEdit":
      return { kind: "edit", dept: action.dept };
    case "openDelete":
      return { kind: "delete", code: action.code, name: action.name };
    case "openManageApps":
      return { kind: "manageApps" };
    case "close":
      return closedDialog;
  }
}
