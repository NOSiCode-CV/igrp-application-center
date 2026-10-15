"use client";

import { type Dispatch, useMemo, useState } from "react";

import {
  Badge,
  Button,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";

import { mergeScopedSelection } from "../../lib/service-account-utils";
import type { WizardAction, WizardState } from "../../lib/wizard-state";
import { useRoleDetails } from "../../use-role-details";
import { EffectivePermissionsCard } from "../effective-permissions-card";
import { PermissionPickerDialog } from "../permission-picker-dialog";
import { RolePickerDialog } from "../role-picker-dialog";

export function WizardAccessStep({
  state,
  dispatch,
  onSubmit,
  isSubmitting,
  submitNote,
}: {
  state: WizardState;
  dispatch: Dispatch<WizardAction>;
  onSubmit: () => void;
  isSubmitting: boolean;
  /** What "Criar conta" will do, stated before the click (spec §5.4). */
  submitNote: string;
}) {
  const [picker, setPicker] = useState<"none" | "roles" | "permissions">(
    "none",
  );
  // Memoized: ScopedPickerDialog re-seeds its ticks whenever `selectedIds`
  // changes reference, so a fresh array per render would wipe in-progress
  // ticks (deviation from the brief's inline `.map`, see task-9-report.md).
  const roleIds = useMemo(() => state.roles.map((r) => r.id), [state.roles]);
  const permissionIds = useMemo(
    () => state.permissions.map((p) => p.id),
    [state.permissions],
  );
  const roleDetails = useRoleDetails(roleIds);
  const directNames = useMemo(
    () => state.permissions.map((p) => p.name),
    [state.permissions],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h3 className="text-lg font-semibold">Perfis e permissões</h3>
        <p className="text-sm text-muted-foreground">
          O que esta conta pode fazer. Pode alterar depois.
        </p>
      </div>

      <section aria-labelledby="wz-roles" className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h4 id="wz-roles" className="font-medium">
            Perfis
          </h4>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPicker("roles")}
          >
            Adicionar perfil
          </Button>
        </div>
        <ul className="flex flex-wrap gap-2">
          {state.roles.map((r) => (
            <li key={r.id}>
              <Badge variant="secondary" className="gap-1 font-mono">
                {r.code}
                <button
                  type="button"
                  aria-label={`Remover perfil ${r.code}`}
                  onClick={() =>
                    dispatch({
                      type: "setRoles",
                      roles: state.roles.filter((x) => x.id !== r.id),
                    })
                  }
                >
                  <IGRPIcon
                    iconName="X"
                    className="size-3"
                    aria-hidden="true"
                  />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="wz-direct" className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h4 id="wz-direct" className="font-medium">
            Permissões diretas
          </h4>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPicker("permissions")}
          >
            Adicionar permissão
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Permissões diretas não são revogadas ao remover um perfil. Prefira
          perfis.
        </p>
        <ul className="flex flex-wrap gap-2">
          {state.permissions.map((p) => (
            <li key={p.id}>
              <Badge variant="secondary" className="gap-1 font-mono">
                {p.name}
                <span className="font-sans text-xs">direta</span>
                <button
                  type="button"
                  aria-label={`Remover permissão ${p.name}`}
                  onClick={() =>
                    dispatch({
                      type: "setPermissions",
                      permissions: state.permissions.filter(
                        (x) => x.id !== p.id,
                      ),
                    })
                  }
                >
                  <IGRPIcon
                    iconName="X"
                    className="size-3"
                    aria-hidden="true"
                  />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      </section>

      <EffectivePermissionsCard
        roles={roleDetails.roles}
        directNames={directNames}
        isLoading={roleDetails.isLoading}
        isError={roleDetails.isError}
        onRetry={roleDetails.refetch}
      />

      <div className="flex flex-col gap-3 border-border sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">{submitNote}</p>
        <div className="flex gap-2">
          {/* Roles and permissions live in the wizard state, so going back
              keeps them. */}
          <Button
            variant="secondary"
            onClick={() => dispatch({ type: "goTo", step: 2 })}
            disabled={isSubmitting}
          >
            <IGRPIcon iconName="ArrowLeft" aria-hidden="true" />
            Voltar
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            <IGRPIcon iconName="Save" aria-hidden="true" />
            {isSubmitting ? "A criar…" : "Criar conta"}
          </Button>
        </div>
      </div>

      {picker === "roles" ? (
        <RolePickerDialog
          open
          onOpenChange={(o) => !o && setPicker("none")}
          selectedIds={roleIds}
          isSaving={false}
          onConfirm={({ scope, selected }) => {
            const pick = (r: {
              id: number;
              code: string;
              departmentCode: string;
            }) => ({
              id: r.id,
              code: r.code,
              departmentCode: r.departmentCode,
            });
            dispatch({
              type: "setRoles",
              roles: mergeScopedSelection(
                state.roles,
                scope.map(pick),
                selected.map(pick),
                (r) => r.id,
              ),
            });
            setPicker("none");
          }}
        />
      ) : null}
      {picker === "permissions" ? (
        <PermissionPickerDialog
          open
          onOpenChange={(o) => !o && setPicker("none")}
          selectedIds={permissionIds}
          isSaving={false}
          onConfirm={({ scope, selected }) => {
            const pick = (p: {
              id: number;
              name: string;
              departmentCode: string;
            }) => ({
              id: p.id,
              name: p.name,
              departmentCode: p.departmentCode,
            });
            dispatch({
              type: "setPermissions",
              permissions: mergeScopedSelection(
                state.permissions,
                scope.map(pick),
                selected.map(pick),
                (p) => p.id,
              ),
            });
            setPicker("none");
          }}
        />
      ) : null}
    </div>
  );
}
