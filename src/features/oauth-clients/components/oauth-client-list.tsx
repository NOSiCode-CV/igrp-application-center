"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import { useIGRPFormat } from "@igrp/framework-next/i18n/client";
import {
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  IGRPDataTable,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";

import { InlineError } from "@/components/inline-error";
import { useApplications } from "@/features/applications/use-applications";
import { useServiceAccounts } from "@/features/service-accounts/use-service-accounts";
import { ROUTES } from "@/lib/constants";

import {
  findLinkedServiceAccount,
  getClientKind,
} from "../lib/oauth-client-utils";
import { useCopyClientId } from "../use-copy-client-id";
import { useOAuthClients } from "../use-oauth-clients";
import { OAuthClientActivationDialog } from "./oauth-client-activation-dialog";
import { type ClientRow, getOAuthClientColumns } from "./oauth-client-columns";
import { OAuthClientDeleteDialog } from "./oauth-client-delete-dialog";
import {
  EMPTY_OAUTH_CLIENT_FILTERS,
  type OAuthClientFilters,
  OAuthClientToolbar,
} from "./oauth-client-toolbar";

type DialogState =
  | { kind: "none" }
  | { kind: "activation"; row: ClientRow }
  | { kind: "delete"; row: ClientRow };

function facetsOf(row: ClientRow) {
  return {
    kind: getClientKind(row.grantTypes),
    application: row.applicationCode ?? "—",
    status: row.active ? "ACTIVE" : "INACTIVE",
  };
}

function countBy(values: string[]) {
  const counts: Record<string, number> = {};
  for (const v of values) counts[v] = (counts[v] ?? 0) + 1;
  return counts;
}

export function OAuthClientList() {
  const t = useTranslations("oauthClients");
  const tAccounts = useTranslations("accounts.cells");
  const { compare } = useIGRPFormat();
  const copyClientId = useCopyClientId();
  const { data: clients = [] } = useOAuthClients();
  const accounts = useServiceAccounts();
  const { data: applications = [] } = useApplications();
  const linkUnknown = accounts.isLoading || accounts.isError;
  const [dialog, setDialog] = useState<DialogState>({ kind: "none" });
  const [filters, setFilters] = useState<OAuthClientFilters>(
    EMPTY_OAUTH_CLIENT_FILTERS,
  );
  const close = useCallback(() => setDialog({ kind: "none" }), []);

  const rows: ClientRow[] = useMemo(
    () =>
      clients.map((c) => ({
        ...c,
        linkedAccount: findLinkedServiceAccount(accounts.data, c.id).account,
      })),
    [clients, accounts.data],
  );

  const filteredRows = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return rows.filter((row) => {
      const f = facetsOf(row);
      if (filters.kind.length && !filters.kind.includes(f.kind)) return false;
      if (filters.application && f.application !== filters.application)
        return false;
      if (filters.status.length && !filters.status.includes(f.status))
        return false;
      if (!term) return true;
      return `${row.clientName ?? ""} ${row.clientId}`
        .toLowerCase()
        .includes(term);
    });
  }, [rows, filters]);

  const nameByCode = useMemo(
    () => new Map(applications.map((a) => [a.code, a.name])),
    [applications],
  );

  const { counts, appOptions } = useMemo(() => {
    const all = rows.map(facetsOf);
    return {
      counts: {
        kind: countBy(all.map((f) => f.kind)),
        status: countBy(all.map((f) => f.status)),
      },
      appOptions: [...new Set(all.map((f) => f.application))]
        .map((code) =>
          code === "—"
            ? { value: code, label: tAccounts("noApplication") }
            : {
                value: code,
                label: nameByCode.get(code) || code,
                description: code,
              },
        )
        .sort((a, b) => compare(a.label, b.label)),
    };
  }, [rows, nameByCode, tAccounts, compare]);

  const columns = useMemo(
    () =>
      getOAuthClientColumns({
        t,
        onToggleActive: (row) => setDialog({ kind: "activation", row }),
        onDelete: (row) => setDialog({ kind: "delete", row }),
        onCopy: copyClientId,
        linkUnknown,
        applicationName: (code) => nameByCode.get(code),
      }),
    [copyClientId, linkUnknown, nameByCode, t],
  );

  return (
    <div className="flex flex-col gap-4">
      <OAuthClientToolbar
        filters={filters}
        onFiltersChange={setFilters}
        applicationOptions={appOptions}
        counts={counts}
        disabled={rows.length === 0}
      />

      {accounts.isError ? (
        <InlineError
          title={t("list.accountsErrorTitle")}
          message={t("list.accountsErrorMessage")}
          onRetry={() => accounts.refetch()}
        />
      ) : null}

      {rows.length === 0 ? (
        <Empty className="rounded-xl border border-border">
          <EmptyHeader>
            <EmptyTitle>{t("list.emptyTitle")}</EmptyTitle>
            <EmptyDescription>{t("list.emptyDescription")}</EmptyDescription>
          </EmptyHeader>
          <Button asChild>
            <Link href={ROUTES.OAUTH_CLIENT_NEW}>
              <IGRPIcon iconName="Plus" aria-hidden="true" />
              {t("list.emptyAction")}
            </Link>
          </Button>
        </Empty>
      ) : (
        <IGRPDataTable<ClientRow, ClientRow>
          showPagination
          tableClassName="table-fixed"
          tableHeaderClassName="bg-muted"
          columns={columns}
          data={filteredRows}
          notFoundLabel={t("list.noMatches")}
        />
      )}

      {dialog.kind === "activation" ? (
        <OAuthClientActivationDialog
          client={dialog.row}
          linkedAccount={dialog.row.linkedAccount}
          open
          onOpenChange={(o) => !o && close()}
        />
      ) : null}
      {dialog.kind === "delete" ? (
        <OAuthClientDeleteDialog
          client={dialog.row}
          open
          onOpenChange={(o) => !o && close()}
        />
      ) : null}
    </div>
  );
}
