"use client";

import type { DialogAction, DialogState } from "../dept-dialog-state";
import { DepartmentDeleteDialog } from "./dept-delete-dialog";
import { DepartmentFormDialog } from "./dept-form-dialog";
import { ManageAppsModal } from "./Modal/manage-apps-modal";

interface Props {
  state: DialogState;
  dispatch(action: DialogAction): void;
  selectedCode: string;
}

export function DepartmentDialogs({ state, dispatch, selectedCode }: Props) {
  const close = () => dispatch({ type: "close" });

  return (
    <>
      <DepartmentFormDialog
        open={state.kind === "create" || state.kind === "edit"}
        onOpenChange={(open) => !open && close()}
        department={state.kind === "edit" ? state.dept : null}
        parentDeptId={state.kind === "create" ? state.parent : null}
      />

      {state.kind === "delete" && (
        <DepartmentDeleteDialog
          open
          onOpenChange={(open) => !open && close()}
          deptToDelete={{ code: state.code, name: state.name }}
        />
      )}

      <ManageAppsModal
        departmentCode={selectedCode}
        open={state.kind === "manageApps"}
        onOpenChange={(open) => !open && close()}
      />
    </>
  );
}
