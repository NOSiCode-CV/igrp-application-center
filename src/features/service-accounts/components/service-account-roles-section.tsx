"use client";

import { useMemo, useState } from "react";

import { Button, useIGRPToast } from "@igrp/igrp-framework-react-design-system";
import type {
  RoleDTO,
  ServiceAccountDTO,
} from "@igrp/platform-access-management-client-ts";
import { useTranslations } from "next-intl";

import type { AccessChange } from "@/actions/service-accounts";
import { InlineError } from "@/components/inline-error";
import { useServerErrorMessage } from "@/i18n/server-error";

import {
  groupRolesByDepartment,
  roleIdsOf,
} from "../lib/service-account-utils";
import {
  useAccountBusy,
  useSetServiceAccountAccess,
} from "../use-service-accounts";
import { RolePickerDialog } from "./role-picker-dialog";

// Stable across renders — a fresh `[]` literal every render would re-seed
// `ScopedPickerDialog`'s selection effect and wipe unsaved ticks while open.

export function ServiceAccountRolesSection({
  account,
  roles,
  isLoading,
  isError,
  onRetry,
}: {
  account: ServiceAccountDTO;
  roles: readonly RoleDTO[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const t = useTranslations("serviceAccounts");
  const serverError = useServerErrorMessage();
  const { igrpToast } = useIGRPToast();
  const access = useSetServiceAccountAccess(account.id);
  const busy = useAccountBusy(account.id);
  const [picking, setPicking] = useState(false);
  const [confirming, setConfirming] = useState<number | null>(null);
  const roleIds = useMemo(() => roleIdsOf(account), [account]);

  async function save(
    roles: NonNullable<AccessChange["roles"]>,
    success: string,
  ) {
    const result = await access.mutateAsync({
      id: account.id,
      change: { roles },
    });
    if (!result.success) {
      igrpToast({
        type: "error",
        title: t("rolesSection.saveError"),
        description: serverError(result.error),
      });
      return false;
    }
    igrpToast({ type: "success", title: success, description: account.name });
    return true;
  }

  return (
    <section
      aria-labelledby="sa-roles"
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 id="sa-roles" className="font-semibold">
          {t("shared.roles")}
        </h3>
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => setPicking(true)}
        >
          {t("rolesSection.assign")}
        </Button>
      </div>
      {isError ? (
        <InlineError
          title={t("rolesSection.loadErrorTitle")}
          message={t("rolesSection.loadErrorMessage")}
          onRetry={onRetry}
        />
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">
          {t("rolesSection.loading")}
        </p>
      ) : roleIds.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("rolesSection.empty")}
        </p>
      ) : (
        groupRolesByDepartment(roles).map((group) => (
          <div key={group.departmentCode} className="flex flex-col gap-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group.departmentCode}
            </h4>
            <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
              {group.roles.map((role) => (
                <li key={role.id} className="flex items-center gap-3 p-3">
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className="font-mono text-sm">{role.code}</span>
                    {role.description ? (
                      <span className="text-sm text-muted-foreground">
                        {role.description}
                      </span>
                    ) : null}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {t("permissionCount", {
                      count: (role.permissions ?? []).length,
                    })}
                  </span>
                  {confirming === role.id ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirming(null)}
                        disabled={busy}
                      >
                        {t("shared.cancel")}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={busy}
                        onClick={async () => {
                          if (
                            await save(
                              { remove: [role.id] },
                              t("rolesSection.removed"),
                            )
                          )
                            setConfirming(null);
                        }}
                      >
                        {t("shared.confirmRemove")}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={t("rolesSection.removeLabel", {
                        code: role.code,
                      })}
                      disabled={busy}
                      onClick={() => setConfirming(role.id)}
                    >
                      {t("shared.remove")}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
      {picking ? (
        <RolePickerDialog
          open
          onOpenChange={setPicking}
          selectedIds={roleIds}
          isSaving={busy}
          onConfirm={async ({ scope, selected }) => {
            const change = {
              scope: scope.map((r) => r.id),
              selected: selected.map((r) => r.id),
            };
            if (await save(change, t("rolesSection.updated")))
              setPicking(false);
          }}
        />
      ) : null}
    </section>
  );
}
