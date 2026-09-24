"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import {
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  IGRPDataTable,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";
import type { ServiceAccountDTO } from "@igrp/platform-access-management-client-ts";

import { useApplications } from "@/features/applications/use-applications";
import { useCopyClientId } from "@/features/oauth-clients/use-copy-client-id";
import { ROUTES } from "@/lib/constants";

import { useServiceAccounts } from "../use-service-accounts";
import { ServiceAccountActivationDialog } from "./service-account-activation-dialog";
import { getServiceAccountColumns } from "./service-account-columns";
import { ServiceAccountDeleteDialog } from "./service-account-delete-dialog";
import {
  EMPTY_SERVICE_ACCOUNT_FILTERS,
  type ServiceAccountFilters,
  ServiceAccountToolbar,
} from "./service-account-toolbar";

type DialogState =
  | { kind: "none" }
  | { kind: "activation"; row: ServiceAccountDTO }
  | { kind: "delete"; row: ServiceAccountDTO };

const statusOf = (r: ServiceAccountDTO) => (r.active ? "ACTIVE" : "INACTIVE");
const appOf = (r: ServiceAccountDTO) => r.applicationCode ?? "—";

export function ServiceAccountList() {
  const copyClientId = useCopyClientId();
  const { data: rows = [] } = useServiceAccounts();
  const { data: applications = [] } = useApplications();
  const [dialog, setDialog] = useState<DialogState>({ kind: "none" });
  const [filters, setFilters] = useState<ServiceAccountFilters>(
    EMPTY_SERVICE_ACCOUNT_FILTERS,
  );
  const close = useCallback(() => setDialog({ kind: "none" }), []);

  const filteredRows = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return rows.filter((row) => {
      if (
        filters.application.length &&
        !filters.application.includes(appOf(row))
      )
        return false;
      if (filters.status.length && !filters.status.includes(statusOf(row)))
        return false;
      return (
        !term || `${row.name} ${row.clientId}`.toLowerCase().includes(term)
      );
    });
  }, [rows, filters]);

  const { statusCounts, appOptions } = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of rows) counts[statusOf(r)] = (counts[statusOf(r)] ?? 0) + 1;
    const nameByCode = new Map(applications.map((a) => [a.code, a.name]));
    return {
      statusCounts: counts,
      appOptions: [...new Set(rows.map(appOf))]
        .map((code) =>
          code === "—"
            ? { value: code, label: "Sem aplicação" }
            : {
                value: code,
                label: nameByCode.get(code) || code,
                description: code,
              },
        )
        .sort((a, b) => a.label.localeCompare(b.label)),
    };
  }, [rows, applications]);

  const columns = useMemo(
    () =>
      getServiceAccountColumns({
        onToggleActive: (row) => setDialog({ kind: "activation", row }),
        onDelete: (row) => setDialog({ kind: "delete", row }),
        onCopy: copyClientId,
      }),
    [copyClientId],
  );

  return (
    <div className="flex flex-col gap-4">
      <ServiceAccountToolbar
        filters={filters}
        onFiltersChange={setFilters}
        applicationOptions={appOptions}
        statusCounts={statusCounts}
        disabled={rows.length === 0}
      />

      {rows.length === 0 ? (
        <Empty className="rounded-xl border border-border">
          <EmptyHeader>
            <EmptyTitle>Ainda não há contas de serviço</EmptyTitle>
            <EmptyDescription>
              Uma conta de serviço envolve um cliente OAuth client_credentials e
              dá-lhe perfis e permissões, para que um sistema aceda às APIs sem
              utilizador.
            </EmptyDescription>
          </EmptyHeader>
          <Button asChild>
            <Link href={ROUTES.SERVICE_ACCOUNT_NEW}>
              <IGRPIcon iconName="Plus" aria-hidden="true" />
              Nova conta de serviço
            </Link>
          </Button>
        </Empty>
      ) : (
        <IGRPDataTable<ServiceAccountDTO, ServiceAccountDTO>
          showPagination
          tableClassName="table-fixed"
          tableHeaderClassName="bg-muted"
          columns={columns}
          data={filteredRows}
          notFoundLabel="Nenhuma conta corresponde aos filtros."
        />
      )}

      {dialog.kind === "activation" ? (
        <ServiceAccountActivationDialog
          account={dialog.row}
          open
          onOpenChange={(o) => !o && close()}
        />
      ) : null}
      {dialog.kind === "delete" ? (
        <ServiceAccountDeleteDialog
          account={dialog.row}
          open
          onOpenChange={(o) => !o && close()}
        />
      ) : null}
    </div>
  );
}
