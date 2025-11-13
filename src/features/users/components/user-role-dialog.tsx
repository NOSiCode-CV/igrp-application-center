"use client";

import {
  cn,
  IGRPBadge,
  IGRPBadgePrimitive,
  IGRPButton,
  IGRPButtonPrimitive,
  IGRPCheckboxPrimitive,
  IGRPCommandEmptyPrimitive,
  IGRPCommandGroupPrimitive,
  IGRPCommandInputPrimitive,
  IGRPCommandItemPrimitive,
  IGRPCommandListPrimitive,
  IGRPCommandPrimitive,
  IGRPDialogContentPrimitive,
  IGRPDialogHeaderPrimitive,
  IGRPDialogPrimitive,
  IGRPDialogTitlePrimitive,
  IGRPIcon,
  IGRPInputPrimitive,
  IGRPLabelPrimitive,
  IGRPPaginationContentPrimitive,
  IGRPPaginationItemPrimitive,
  IGRPPaginationPrimitive,
  IGRPPopoverContentPrimitive,
  IGRPPopoverPrimitive,
  IGRPPopoverTriggerPrimitive,
  IGRPSelectContentPrimitive,
  IGRPSelectItemPrimitive,
  IGRPSelectPrimitive,
  IGRPSelectTriggerPrimitive,
  IGRPSelectValuePrimitive,
  IGRPTableBodyPrimitive,
  IGRPTableCellPrimitive,
  IGRPTableHeaderPrimitive,
  IGRPTableHeadPrimitive,
  IGRPTablePrimitive,
  IGRPTableRowPrimitive,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type RowSelectionState,
  useReactTable,
} from "@tanstack/react-table";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useDepartments } from "@/features/departments/use-departments";
import type { RoleArgs } from "@/features/roles/role-schemas";
import { useRoles } from "@/features/roles/use-roles";
import {
  useAddUserRole,
  useRemoveUserRole,
  useUserRoles,
} from "@/features/users/use-users";
import { getStatusColor, showStatus } from "@/lib/utils";

const norm = (s: string) => s.trim().toLowerCase();

const multiColumnFilterFn: FilterFn<RoleArgs> = (
  row,
  _columnId,
  filterValue,
) => {
  const term = String(filterValue ?? "")
    .toLowerCase()
    .trim();
  if (!term) return true;
  const name = String(row.original?.name ?? "").toLowerCase();
  const desc = String((row.original as any)?.description ?? "").toLowerCase();
  return name.includes(term) || desc.includes(term);
};

const columns: ColumnDef<RoleArgs>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <IGRPCheckboxPrimitive
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="ring ring-current/50"
      />
    ),
    cell: ({ row }) => (
      <IGRPCheckboxPrimitive
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="ring ring-current/50"
      />
    ),
    size: 28,
    enableSorting: false,
  },
  {
    header: "Nome",
    accessorKey: "name",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("name")}</div>
    ),
    enableSorting: false,
    filterFn: multiColumnFilterFn,
    enableColumnFilter: true,
  },
  {
    header: "Descrição",
    accessorKey: "description",
    cell: ({ row }) => <div>{row.getValue("description") || "N/A"}</div>,
    enableSorting: false,
  },
  {
    header: "Estado",
    accessorKey: "status",
    cell: ({ row }) => (
      <IGRPBadgePrimitive
        className={cn(getStatusColor(row.getValue("status")), "capitalize")}
      >
        {showStatus(row.getValue("status"))}
      </IGRPBadgePrimitive>
    ),
    size: 40,
    enableSorting: false,
  },
];

function diffRoles(selected: RoleArgs[], existing: RoleArgs[]) {
  const selectedNorm = new Set(selected.map((r) => norm(r.code)));
  const existingNorm = new Set(existing.map((r) => norm(r.code)));

  const toAddNorm = Array.from(selectedNorm).filter(
    (n) => !existingNorm.has(n),
  );
  const toRemoveNorm = Array.from(existingNorm).filter(
    (n) => !selectedNorm.has(n),
  );

  const selectedByNorm = new Map(selected.map((r) => [norm(r.code), r.code]));
  const existingByNorm = new Map(existing.map((r) => [norm(r.code), r.code]));

  return {
    toAdd: toAddNorm.map((n) => selectedByNorm.get(n)!).filter(Boolean),
    toRemove: toRemoveNorm.map((n) => existingByNorm.get(n)!).filter(Boolean),
  };
}

type UserRolesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
};

export function UserRolesDialog({
  open,
  onOpenChange,
  username,
}: UserRolesDialogProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { igrpToast } = useIGRPToast();

  const {
    data: depts,
    isLoading: deptsLoading,
    error: deptsError,
  } = useDepartments();
  const [deptPopoverOpen, setDeptPopoverOpen] = useState(false);
  const [departmentCode, setDepartmentCode] = useState<string | undefined>(
    undefined,
  );

  const deptName = (code?: string) =>
    depts?.find((d) => d.code === code)?.name ?? code ?? "";

  const handleSelectDept = (code: string) => {
    setDepartmentCode(code);
    setDeptPopoverOpen(false);
  };

  const {
    data: roles,
    isLoading,
    error,
  } = useRoles({ departmentCode, enabled: !!departmentCode });

  const {
    data: userRoles,
    isLoading: isLoadingUserRoles,
    error: errorUserRoles,
    refetch: refetchUserRoles,
  } = useUserRoles(username);

  const [data, setData] = useState<RoleArgs[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const getRowKey = (r: RoleArgs) => String((r as any).id ?? r.name);

  const roleNameSet = useMemo(
    () => new Set((roles ?? []).map((r) => norm(r.name))),
    [roles],
  );
  const userRolesInDept = useMemo(
    () => (userRoles ?? []).filter((r) => roleNameSet.has(norm(r.name ?? ""))),
    [userRoles, roleNameSet],
  );

  const preselectedKeys = useMemo(() => {
    const list = Array.isArray(userRolesInDept) ? userRolesInDept : [];
    return new Set<string>(list.map((r) => getRowKey(r as any)));
  }, [userRolesInDept]);

  useEffect(() => {
    if (!open) {
      setDepartmentCode(undefined);
      setRowSelection({});
      setData([]);
      setColumnFilters([]);
      setPagination({ pageIndex: 0, pageSize: 5 });
    }
  }, [open]);

  useEffect(() => {
    setData(roles ?? []);
    setRowSelection({});
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [roles, departmentCode]);

  useEffect(() => {
    if (!data?.length) return;
    const next: RowSelectionState = {};
    for (const row of data) {
      const key = getRowKey(row);
      if (preselectedKeys.has(key)) next[key] = true;
    }
    setRowSelection(next);
  }, [data, preselectedKeys]);

  const table = useReactTable({
    data,
    columns,
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => getRowKey(row),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    state: { pagination, columnFilters, rowSelection },
  });

  const selectedRows = table.getSelectedRowModel().rows;
  const selectedData = selectedRows.map((r) => r.original);

  const existing = userRolesInDept ?? [];

  const { toAdd, toRemove } = useMemo(
    () => diffRoles(selectedData, existing as RoleArgs[]),
    [selectedData, existing],
  );

  const hasChanges = toAdd.length > 0 || toRemove.length > 0;

  const { mutateAsync: addUserRole, isPending: isAdding } = useAddUserRole();
  const { mutateAsync: removeUserRole, isPending: isRemoving } =
    useRemoveUserRole();

  async function onSubmit() {
    if (!departmentCode) {
      igrpToast({
        type: "warning",
        title: "Selecione um departamento primeiro.",
      });
      return;
    }
    if (!hasChanges) {
      igrpToast({
        type: "info",
        title: "Sem alterações",
        description: "Nada para adicionar ou remover.",
      });
      return;
    }

    try {
      if (toAdd.length) {
        await addUserRole({ username, roleNames: toAdd });
      }
      if (toRemove.length) {
        await removeUserRole({ username, roleNames: toRemove });
      }

      igrpToast({
        type: "success",
        title: "Perfis atualizados",
        description: `+${toAdd.length} adicionada(s), -${toRemove.length} removida(s).`,
      });

      await refetchUserRoles();
      onOpenChange(false);
    } catch (error) {
      igrpToast({
        type: "error",
        title: "Falha ao atualizar perfis",
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro desconhecido.",
      });
    }
  }

  const loading = (departmentCode ? isLoading : false) || isLoadingUserRoles;
  const err = error || errorUserRoles;

  return (
    <IGRPDialogPrimitive open={open} onOpenChange={onOpenChange} modal={false}>
      <IGRPDialogContentPrimitive className="md:min-w-2xl max-h-[95vh]">
        <IGRPDialogHeaderPrimitive>
          <IGRPDialogTitlePrimitive className="text-base">
            Adicionar ou Remover Perfis de &nbsp;
            <IGRPBadge variant="solid" color="primary">
              {username}
            </IGRPBadge>
          </IGRPDialogTitlePrimitive>
        </IGRPDialogHeaderPrimitive>

        <div className="flex-1 min-w-0 overflow-x-hidden">
          <section className="space-y-8 max-w-full">
           

            <div className="flex flex-col gap-4">
              <div className="flex gap-2 ">
                <div className="relative flex-1">
                <IGRPInputPrimitive
                  id={`${id}-input`}
                  ref={inputRef}
                  className={cn(
                    "peer ps-9 border-foreground/30 focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:border-foreground/30",
                    Boolean(table.getColumn("name")?.getFilterValue()) &&
                      "pe-9",
                  )}
                  value={
                    (table.getColumn("name")?.getFilterValue() ?? "") as string
                  }
                  onChange={(e) =>
                    table.getColumn("name")?.setFilterValue(e.target.value)
                  }
                  placeholder="Filtar por nome..."
                  type="text"
                  aria-label="Filtar por nome"
                  disabled={!departmentCode}
                />
                <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-2 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                  <IGRPIcon iconName="ListFilter" />
                </div>
                {Boolean(table.getColumn("name")?.getFilterValue()) && (
                  <button
                    className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-2 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px]"
                    aria-label="Clear filter"
                    onClick={() => {
                      table.getColumn("name")?.setFilterValue("");
                      inputRef.current?.focus();
                    }}
                  >
                    <IGRPIcon iconName="CircleX" />
                  </button>
                )}
                </div>

                <div className="space-y-2">
                <IGRPPopoverPrimitive
                  open={deptPopoverOpen}
                  onOpenChange={setDeptPopoverOpen}
                >
                  <IGRPPopoverTriggerPrimitive asChild>
                    <IGRPButtonPrimitive
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between",
                        !departmentCode && "text-muted-foreground",
                      )}
                      disabled={
                        deptsLoading || !!deptsError || (depts?.length ?? 0) === 0
                      }
                    >
                      {deptsLoading
                        ? "A carregar departamentos..."
                        : departmentCode
                          ? deptName(departmentCode)
                          : deptsError
                            ? "Erro ao carregar departamentos"
                            : (depts?.length ?? 0) === 0
                              ? "Sem departamentos"
                              : "Selecionar departamento"}
                      <IGRPIcon
                        iconName="ChevronsUpDown"
                        className="ml-2 h-4 w-4 opacity-50"
                      />
                    </IGRPButtonPrimitive>
                  </IGRPPopoverTriggerPrimitive>

                  <IGRPPopoverContentPrimitive className="w-[--radix-popover-trigger-width] p-0">
                    <IGRPCommandPrimitive>
                      <IGRPCommandInputPrimitive placeholder="Procurar departamento..." />
                      <IGRPCommandListPrimitive>
                        <IGRPCommandEmptyPrimitive>
                          Nenhum departamento encontrado.
                        </IGRPCommandEmptyPrimitive>
                        <IGRPCommandGroupPrimitive>
                          {depts?.map((dept) => (
                            <IGRPCommandItemPrimitive
                              key={dept.code}
                              value={dept.code}
                              onSelect={(v) => handleSelectDept(v)}
                            >
                              <IGRPIcon
                                iconName="Check"
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  departmentCode === dept.code
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              {dept.name}
                            </IGRPCommandItemPrimitive>
                          ))}
                        </IGRPCommandGroupPrimitive>
                      </IGRPCommandListPrimitive>
                    </IGRPCommandPrimitive>
                  </IGRPPopoverContentPrimitive>
                </IGRPPopoverPrimitive>
              </div>
              </div>

             
              {!departmentCode ? (
                <div className="rounded-md border py-10 text-center text-muted-foreground ">
                  Selecione um departamento para listar os perfis.
                </div>
              ) : loading ? (
                <div className="rounded-md border py-6 text-center ">
                  A carregar perfis...
                </div>
              ) : err ? (
                <div className="rounded-md border py-6 ">
                  <p className="text-center">
                    Ocorreu um erro a carregar perfis do utilizador.
                  </p>
                  <p className="text-center">
                    {(err as any)?.message ?? String(err)}
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-background overflow-hidden rounded-md border ">
                    <IGRPTablePrimitive className="table-fixed">
                      <IGRPTableHeaderPrimitive>
                        {table.getHeaderGroups().map((headerGroup) => (
                          <IGRPTableRowPrimitive
                            key={headerGroup.id}
                            className="hover:bg-transparent"
                          >
                            {headerGroup.headers.map((header) => (
                              <IGRPTableHeadPrimitive
                                key={header.id}
                                style={{ width: `${header.getSize()}px` }}
                                className="h-12"
                              >
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(
                                      header.column.columnDef.header,
                                      header.getContext(),
                                    )}
                              </IGRPTableHeadPrimitive>
                            ))}
                          </IGRPTableRowPrimitive>
                        ))}
                      </IGRPTableHeaderPrimitive>

                      <IGRPTableBodyPrimitive>
                        {table.getRowModel().rows?.length ? (
                          table.getRowModel().rows.map((row) => (
                            <IGRPTableRowPrimitive
                              key={row.id}
                              data-state={row.getIsSelected() && "selected"}
                            >
                              {row.getVisibleCells().map((cell) => (
                                <IGRPTableCellPrimitive key={cell.id}>
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext(),
                                  )}
                                </IGRPTableCellPrimitive>
                              ))}
                            </IGRPTableRowPrimitive>
                          ))
                        ) : (
                          <IGRPTableRowPrimitive>
                            <IGRPTableCellPrimitive
                              colSpan={columns.length}
                              className="h-24 text-center"
                            >
                              Sem resultados!
                            </IGRPTableCellPrimitive>
                          </IGRPTableRowPrimitive>
                        )}
                      </IGRPTableBodyPrimitive>
                    </IGRPTablePrimitive>
                  </div>

                  <div className="flex items-center justify-between gap-8">
                    <div className="flex items-center justify-end gap-3">
                      <IGRPLabelPrimitive
                        htmlFor={`${id}-per-page`}
                        className="max-sm:sr-only"
                      >
                        Rows per page
                      </IGRPLabelPrimitive>
                      <IGRPSelectPrimitive
                        value={table.getState().pagination.pageSize.toString()}
                        onValueChange={(value) =>
                          table.setPageSize(Number(value))
                        }
                      >
                        <IGRPSelectTriggerPrimitive
                          id={`${id}-per-page`}
                          className="w-fit whitespace-nowrap"
                        >
                          <IGRPSelectValuePrimitive placeholder="Select number of results" />
                        </IGRPSelectTriggerPrimitive>
                        <IGRPSelectContentPrimitive className="[&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2">
                          {[5, 10].map((pageSize) => (
                            <IGRPSelectItemPrimitive
                              key={pageSize}
                              value={pageSize.toString()}
                            >
                              {pageSize}
                            </IGRPSelectItemPrimitive>
                          ))}
                        </IGRPSelectContentPrimitive>
                      </IGRPSelectPrimitive>
                    </div>

                    <div className="text-muted-foreground flex grow justify-end text-sm whitespace-nowrap">
                      <p
                        className="text-muted-foreground text-sm whitespace-nowrap"
                        aria-live="polite"
                      >
                        <span className="text-foreground">
                          {table.getState().pagination.pageIndex *
                            table.getState().pagination.pageSize +
                            1}
                          -
                          {Math.min(
                            Math.max(
                              table.getState().pagination.pageIndex *
                                table.getState().pagination.pageSize +
                                table.getState().pagination.pageSize,
                              0,
                            ),
                            table.getRowCount(),
                          )}
                        </span>{" "}
                        of{" "}
                        <span className="text-foreground">
                          {table.getRowCount().toString()}
                        </span>
                      </p>
                    </div>

                    <div>
                      <IGRPPaginationPrimitive>
                        <IGRPPaginationContentPrimitive>
                          <IGRPPaginationItemPrimitive>
                            <IGRPButtonPrimitive
                              size="icon"
                              variant="outline"
                              className="disabled:pointer-events-none disabled:opacity-50"
                              onClick={() => table.firstPage()}
                              disabled={!table.getCanPreviousPage()}
                              aria-label="Go to first page"
                            >
                              <IGRPIcon iconName="ChevronFirst" />
                            </IGRPButtonPrimitive>
                          </IGRPPaginationItemPrimitive>
                          <IGRPPaginationItemPrimitive>
                            <IGRPButtonPrimitive
                              size="icon"
                              variant="outline"
                              className="disabled:pointer-events-none disabled:opacity-50"
                              onClick={() => table.previousPage()}
                              disabled={!table.getCanPreviousPage()}
                              aria-label="Go to previous page"
                            >
                              <IGRPIcon iconName="ChevronLeft" />
                            </IGRPButtonPrimitive>
                          </IGRPPaginationItemPrimitive>
                          <IGRPPaginationItemPrimitive>
                            <IGRPButtonPrimitive
                              size="icon"
                              variant="outline"
                              className="disabled:pointer-events-none disabled:opacity-50"
                              onClick={() => table.nextPage()}
                              disabled={!table.getCanNextPage()}
                              aria-label="Go to next page"
                            >
                              <IGRPIcon iconName="ChevronRight" />
                            </IGRPButtonPrimitive>
                          </IGRPPaginationItemPrimitive>
                          <IGRPPaginationItemPrimitive>
                            <IGRPButtonPrimitive
                              size="icon"
                              variant="outline"
                              className="disabled:pointer-events-none disabled:opacity-50"
                              onClick={() => table.lastPage()}
                              disabled={!table.getCanNextPage()}
                              aria-label="Go to last page"
                            >
                              <IGRPIcon iconName="ChevronLast" />
                            </IGRPButtonPrimitive>
                          </IGRPPaginationItemPrimitive>
                        </IGRPPaginationContentPrimitive>
                      </IGRPPaginationPrimitive>
                    </div>
                  </div>
                </>
              )}

               <div className="flex items-center justify-between gap-3">
                <IGRPBadgePrimitive>
                  {table.getSelectedRowModel().rows.length} selecionado(s)
                </IGRPBadgePrimitive>

                <div className="flex gap-2">
                  
                  <IGRPButton
                    variant="outline"
                    disabled={table.getSelectedRowModel().rows.length === 0}
                    onClick={() => setRowSelection({})}
                    size="sm"
                    className={
                      table.getSelectedRowModel().rows.length === 0
                        ? "hidden"
                        : "inline-flex"
                    }
                    showIcon
                    iconName="X"
                  >
                    Limpar
                  </IGRPButton>
                  <IGRPButton
                    variant="default"
                    onClick={onSubmit}
                    disabled={
                      !departmentCode ||
                      !(toAdd.length || toRemove.length) ||
                      loading ||
                      isAdding ||
                      isRemoving
                    }
                    size="sm"
                    iconName="Save"
                    showIcon
                  >
                    {loading || isAdding || isRemoving ? "Guardando..." : "Guardar"}
                  </IGRPButton>

                </div>
              </div>
            </div>
            
          </section>
        </div>
      </IGRPDialogContentPrimitive>
    </IGRPDialogPrimitive>
  );
}
