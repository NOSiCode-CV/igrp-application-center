"use client";

import { useCallback, useMemo, useState } from "react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  IGRPButton,
  IGRPDataTable,
  type IGRPDataTableClientFilterListProps,
} from "@igrp/igrp-framework-react-design-system";

import { ColumnFacetedFilter } from "@/components/data-table/faceted-filter";
import { ColumnSearchInput } from "@/components/data-table/search-input";
import { InlineError } from "@/components/inline-error";
import { useServiceAccounts } from "@/features/service-accounts/use-service-accounts";
import { STATUS_OPTIONS } from "@/lib/constants";

import {
  CLIENT_KIND_LABEL,
  findLinkedServiceAccount,
} from "../lib/oauth-client-utils";
import { useCopyClientId } from "../use-copy-client-id";
import { useOAuthClients } from "../use-oauth-clients";
import { OAuthClientActivationDialog } from "./oauth-client-activation-dialog";
import { type ClientRow, getOAuthClientColumns } from "./oauth-client-columns";
import { OAuthClientCreateDialog } from "./oauth-client-create-dialog";
import { OAuthClientDeleteDialog } from "./oauth-client-delete-dialog";

type DialogState =
  | { kind: "none" }
  | { kind: "create" }
  | { kind: "activation"; row: ClientRow }
  | { kind: "delete"; row: ClientRow };

const KIND_OPTIONS = [
  { value: "web", label: CLIENT_KIND_LABEL.web },
  { value: "machine", label: CLIENT_KIND_LABEL.machine },
];

export function OAuthClientList() {
  const copyClientId = useCopyClientId();
  const { data: clients = [] } = useOAuthClients();
  const accounts = useServiceAccounts();
  // Without SA links we cannot tell a linked client from a lone one, so delete
  // and activation fail safe until the list has loaded.
  const linkUnknown = accounts.isLoading || accounts.isError;
  const [dialog, setDialog] = useState<DialogState>({ kind: "none" });
  const close = useCallback(() => setDialog({ kind: "none" }), []);

  const rows: ClientRow[] = useMemo(
    () =>
      clients.map((c) => ({
        ...c,
        linkedAccount: findLinkedServiceAccount(accounts.data, c.id).account,
      })),
    [clients, accounts.data],
  );

  const appOptions = useMemo(
    () =>
      [...new Set(clients.map((c) => c.applicationCode ?? "—"))].map(
        (code) => ({
          value: code,
          label: code,
        }),
      ),
    [clients],
  );

  const columns = useMemo(
    () =>
      getOAuthClientColumns({
        onToggleActive: (row) => setDialog({ kind: "activation", row }),
        onDelete: (row) => setDialog({ kind: "delete", row }),
        onCopy: copyClientId,
        linkUnknown,
      }),
    [copyClientId, linkUnknown],
  );

  const filters: IGRPDataTableClientFilterListProps<ClientRow>[] = useMemo(
    () => [
      {
        // Column ids ("client", "kind", "application", "status") are synthetic
        // (see getOAuthClientColumns), not real ClientRow keys — the design
        // system's type only enforces `keyof TData` because it usually wires
        // filters to `accessorKey` columns; at runtime it just forwards the id
        // to `table.getColumn`, so the cast is safe here.
        columnId: "client" as keyof ClientRow,
        component: ({ column }) => (
          <ColumnSearchInput
            column={column}
            label="Pesquisar clientes"
            placeholder="Pesquisar por nome ou client ID…"
          />
        ),
      },
      {
        columnId: "kind" as keyof ClientRow,
        component: ({ column }) => (
          <ColumnFacetedFilter
            column={column}
            label="Tipo"
            options={KIND_OPTIONS}
          />
        ),
      },
      {
        columnId: "application" as keyof ClientRow,
        component: ({ column }) => (
          <ColumnFacetedFilter
            column={column}
            label="Aplicação"
            options={appOptions}
          />
        ),
      },
      {
        columnId: "status" as keyof ClientRow,
        component: ({ column }) => (
          <ColumnFacetedFilter
            column={column}
            label="Estado"
            options={STATUS_OPTIONS}
          />
        ),
      },
    ],
    [appOptions],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <IGRPButton
          iconName="Plus"
          showIcon
          onClick={() => setDialog({ kind: "create" })}
        >
          Registar cliente
        </IGRPButton>
      </div>

      {/* Supplementary data: without SA links, delete and activation fail safe. */}
      {accounts.isError ? (
        <InlineError
          title="Não foi possível verificar as contas de serviço."
          message="Eliminar, ativar e desativar estão indisponíveis até a verificação ser feita."
          onRetry={() => accounts.refetch()}
        />
      ) : null}

      {rows.length === 0 ? (
        <Empty className="rounded-xl border border-border">
          <EmptyHeader>
            <EmptyTitle>Ainda não há clientes OAuth</EmptyTitle>
            <EmptyDescription>
              Um cliente OAuth é uma aplicação ou serviço registado para pedir
              tokens ao servidor de autorização iGRP.
            </EmptyDescription>
          </EmptyHeader>
          <IGRPButton
            iconName="Plus"
            showIcon
            onClick={() => setDialog({ kind: "create" })}
          >
            Registar o primeiro cliente
          </IGRPButton>
        </Empty>
      ) : (
        <IGRPDataTable<ClientRow, ClientRow>
          showFilter
          showPagination
          tableClassName="table-fixed"
          columns={columns}
          data={rows}
          clientFilters={filters}
        />
      )}

      {dialog.kind === "create" ? (
        <OAuthClientCreateDialog open onOpenChange={(o) => !o && close()} />
      ) : null}
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
