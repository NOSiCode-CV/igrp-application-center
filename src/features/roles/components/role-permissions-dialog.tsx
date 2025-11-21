"use client";

import {
  cn,
  IGRPBadge,
  IGRPBadgePrimitive,
  IGRPButton,
  IGRPButtonPrimitive,
  IGRPCheckboxPrimitive,
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

import type { RoleArgs } from "@/features/roles/role-schemas";

import {
  useAddPermissionsToRole,
  useDepartmentPermissions,
  usePermissionsByRole,
  useRemovePermissionsFromRole,
} from "@/features/departments/use-departments";
import { AppCenterLoading } from "@/components/loading";

const multiColumnFilterFn: FilterFn<any> = (row, _columnId, filterValue) => {
  const term = String(filterValue ?? "")
    .toLowerCase()
    .trim();
  if (!term) return true;
  const name = String(row.original?.name ?? "").toLowerCase();
  const desc = String(row.original?.description ?? "").toLowerCase();
  return name.includes(term) || desc.includes(term);
};

const columns: ColumnDef<any>[] = [
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
];

const norm = (s: string) => s.trim().toLowerCase();

function diffPermissions(selected: any[], existing: any[]) {
  const selectedNorm = new Set(selected.map((p) => norm(p.name)));
  const existingNorm = new Set(existing.map((p) => norm(p.name)));

  const toAddNorm = Array.from(selectedNorm).filter(
    (n) => !existingNorm.has(n),
  );
  const toRemoveNorm = Array.from(existingNorm).filter(
    (n) => !selectedNorm.has(n),
  );

  const selectedByNorm = new Map(selected.map((p) => [norm(p.name), p.name]));
  const existingByNorm = new Map(existing.map((p) => [norm(p.name), p.name]));

  return {
    toAdd: toAddNorm.map((n) => selectedByNorm.get(n)).filter(Boolean),
    toRemove: toRemoveNorm.map((n) => existingByNorm.get(n)!).filter(Boolean),
  };
}

interface RoleDetailsProps {
  departmentCode: string;
  role: RoleArgs;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoleDetails({
  departmentCode,
  role,
  open,
  onOpenChange,
}: RoleDetailsProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { igrpToast } = useIGRPToast();

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const { data: departmentPermissions, isLoading: isLoadingDepartment } =
    useDepartmentPermissions(departmentCode);

  const {
    data: permissionByRole,
    isLoading: isLoadingPermissionsByRole,
    error: errorPermissionsByRole,
  } = usePermissionsByRole(departmentCode, role.code);

  const { mutateAsync: addPermissions, isPending: isAdding } =
    useAddPermissionsToRole();
  const { mutateAsync: removePermissions, isPending: isRemoving } =
    useRemovePermissionsFromRole();

  const allPermissions = useMemo(() => {
    return (departmentPermissions ?? []).sort((a, b) =>
      a.name.localeCompare(b.name, "pt"),
    );
  }, [departmentPermissions]);

  const getRowKey = (r: any) => String(r.id ?? r.name);

  const preselectedKeys = useMemo(() => {
    const list = Array.isArray(permissionByRole) ? permissionByRole : [];
    return new Set<string>(list.map((p) => getRowKey(p)));
  }, [permissionByRole]);

  useEffect(() => {
    if (!allPermissions?.length) return;

    const next: RowSelectionState = {};
    for (const row of allPermissions) {
      const key = getRowKey(row);
      if (preselectedKeys.has(key)) next[key] = true;
    }
    setRowSelection(next);
  }, [allPermissions, preselectedKeys]);

  const table = useReactTable({
    data: allPermissions,
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
  const existing = permissionByRole ?? [];

  const { toAdd, toRemove } = useMemo(
    () => diffPermissions(selectedData, existing),
    [selectedData, existing],
  );

  const hasChanges = toAdd.length > 0 || toRemove.length > 0;

  const isLoading = isLoadingDepartment || isLoadingPermissionsByRole;

  async function onSubmit() {
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
        await addPermissions({
          departmentCode,
          roleCode: role.code,
          permissionCodes: toAdd as string[],
        });
      }
      if (toRemove.length) {
        await removePermissions({
          departmentCode,
          roleCode: role.code,
          permissionCodes: toRemove,
        });
      }

      igrpToast({
        type: "success",
        title: "Permissões atualizadas",
        description: `+${toAdd.length} adicionada(s), -${toRemove.length} removida(s).`,
      });

      onOpenChange(false);
    } catch (error) {
      igrpToast({
        type: "error",
        title: "Falha ao atualizar permissões",
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro desconhecido.",
      });
    }
  }

  if (errorPermissionsByRole) {
    igrpToast({
      type: "error",
      title: "Perfil tem permissões associadas, mas não foram carregadas.",
    });
  }

  return (
    <IGRPDialogPrimitive open={open} onOpenChange={onOpenChange} modal>
      <IGRPDialogContentPrimitive className="md:min-w-2xl max-h-[95vh]">
        <IGRPDialogHeaderPrimitive>
          <IGRPDialogTitlePrimitive className="text-base">
            Adicionar ou Remover Permissões de perfil{" "}
            <IGRPBadge>{role.name}</IGRPBadge>
          </IGRPDialogTitlePrimitive>
        </IGRPDialogHeaderPrimitive>

        <div className="flex-1 min-w-0 overflow-x-hidden">
          <section className="space-y-10 max-w-full">
            <div className="flex flex-col gap-4">
              <div className="relative py-4">
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
                />
                <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-2 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                  <IGRPIcon iconName="Search" />
                </div>
                {Boolean(table.getColumn("name")?.getFilterValue()) && (
                  <button
                    className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-2 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Clear filter"
                    onClick={() => {
                      table.getColumn("name")?.setFilterValue("");
                      inputRef.current?.focus();
                    }}
                    type="button"
                  >
                    <IGRPIcon iconName="CircleX" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 px-3">
                <IGRPBadgePrimitive>
                  {selectedRows.length} selecionado(s)
                </IGRPBadgePrimitive>
              </div>
              {isLoading ? (
                <AppCenterLoading descrption="Carregando permissões..." />
              ) : (
                <>
                  <div className="bg-background overflow-hidden rounded-md border">
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

                  <div className="flex items-center gap-4">
                    <div className="flex items-center grow justify-end gap-3">
                      <IGRPLabelPrimitive
                        htmlFor={`${id}-per-page`}
                        className="max-sm:sr-only"
                      >
                        Registos por página
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

                    <div className="text-muted-foreground flex text-sm whitespace-nowrap">
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
                        de{" "}
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

              <div className="flex justify-end gap-2">
                <IGRPButton
                  variant="default"
                  onClick={onSubmit}
                  disabled={!hasChanges || isAdding || isRemoving}
                  size="sm"
                  iconName="Save"
                  showIcon
                >
                  Guardar
                </IGRPButton>
              </div>
            </div>
          </section>
        </div>
      </IGRPDialogContentPrimitive>
    </IGRPDialogPrimitive>
  );
}
