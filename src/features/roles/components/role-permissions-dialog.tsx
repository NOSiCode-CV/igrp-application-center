"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { useIGRPFormat } from "@igrp/framework-next/i18n/client";
import {
  Badge,
  Checkbox,
  cn,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  IGRPBadge,
  IGRPButton,
  IGRPIcon,
  Input,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type PaginationState,
  type RowSelectionState,
  useReactTable,
} from "@tanstack/react-table";
import { useTranslations } from "next-intl";

import { SelectableDataTable } from "@/components/data-table/selectable-data-table";
import { AppCenterLoading } from "@/components/loading";
import {
  useAddPermissionsToRole,
  useDepartmentPermissions,
  usePermissionsByRole,
  useRemovePermissionsFromRole,
} from "@/features/departments/use-departments";
import type { RoleArgs } from "@/features/roles/role-schemas";
import { useServerErrorMessage } from "@/i18n/server-error";

// Local mirror of the SDK's `PermissionDTO` (not re-exported by the package).
interface PermissionLike {
  id?: number;
  name: string;
  description?: string | null;
}

const multiColumnFilterFn: FilterFn<PermissionLike> = (
  row,
  _columnId,
  filterValue,
) => {
  const term = String(filterValue ?? "")
    .toLowerCase()
    .trim();
  if (!term) return true;
  const name = String(row.original?.name ?? "").toLowerCase();
  const desc = String(row.original?.description ?? "").toLowerCase();
  return name.includes(term) || desc.includes(term);
};

type PermissionsTranslator = ReturnType<
  typeof useTranslations<"roles.permissions">
>;

const makeColumns = (t: PermissionsTranslator): ColumnDef<PermissionLike>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label={t("selectAll")}
        className="ring ring-current/50"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label={t("selectOne", { name: row.original.name })}
        className="ring ring-current/50"
      />
    ),
    size: 28,
    enableSorting: false,
  },
  {
    header: t("columnName"),
    accessorKey: "name",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("name")}</div>
    ),
    enableSorting: false,
    filterFn: multiColumnFilterFn,
    enableColumnFilter: true,
  },
  {
    header: t("columnDescription"),
    accessorKey: "description",
    cell: ({ row }) => (
      <div>{row.getValue("description") || t("noDescription")}</div>
    ),
    enableSorting: false,
  },
];

const norm = (s: string) => s.trim().toLowerCase();

function diffPermissions(
  selected: PermissionLike[],
  existing: PermissionLike[],
) {
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
    toRemove: toRemoveNorm
      .map((n) => existingByNorm.get(n) ?? "")
      .filter(Boolean),
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
  const t = useTranslations("roles.permissions");
  const serverError = useServerErrorMessage();
  const { compare } = useIGRPFormat();
  const columns = useMemo(() => makeColumns(t), [t]);
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
    return ((departmentPermissions ?? []) as PermissionLike[]).sort((a, b) =>
      compare(a.name, b.name),
    );
  }, [departmentPermissions, compare]);

  const getRowKey = useCallback(
    (r: PermissionLike) => String(r.id ?? r.name),
    [],
  );

  const preselectedKeys = useMemo(() => {
    const list = Array.isArray(permissionByRole) ? permissionByRole : [];
    return new Set<string>(list.map((p) => getRowKey(p)));
  }, [permissionByRole, getRowKey]);

  useEffect(() => {
    if (!allPermissions?.length) return;

    const next: RowSelectionState = {};
    for (const row of allPermissions) {
      const key = getRowKey(row);
      if (preselectedKeys.has(key)) next[key] = true;
    }
    setRowSelection(next);
  }, [allPermissions, preselectedKeys, getRowKey]);

  const table = useReactTable({
    data: allPermissions,
    columns,
    getCoreRowModel: getCoreRowModel(),
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
  // SDK declares `getPermissionsByRole` as `ApiResponse<any>`; cast at boundary.
  const existing = (
    Array.isArray(permissionByRole) ? permissionByRole : []
  ) as PermissionLike[];

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
        title: t("toast.noChangesTitle"),
        description: t("toast.noChangesDescription"),
      });
      return;
    }

    try {
      if (toAdd.length) {
        const res = await addPermissions({
          departmentCode,
          roleCode: role.code,
          permissionCodes: toAdd as string[],
        });

        if (!res.success) {
          throw new Error(res.error);
        }
      }
      if (toRemove.length) {
        const res = await removePermissions({
          departmentCode,
          roleCode: role.code,
          permissionCodes: toRemove,
        });

        if (!res.success) {
          throw new Error(res.error);
        }
      }

      igrpToast({
        type: "success",
        title: t("toast.updatedTitle"),
        description: t("toast.updatedDescription", {
          added: toAdd.length,
          removed: toRemove.length,
        }),
      });

      onOpenChange(false);
    } catch (error) {
      igrpToast({
        type: "error",
        title: t("toast.errorTitle"),
        description:
          error instanceof Error
            ? serverError(error.message)
            : t("toast.unknownError"),
      });
    }
  }

  useEffect(() => {
    if (errorPermissionsByRole) {
      igrpToast({
        type: "error",
        title: t("toast.loadErrorTitle"),
      });
    }
  }, [errorPermissionsByRole, igrpToast, t]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogContent className="md:min-w-2xl max-h-[95vh]">
        <DialogHeader>
          <DialogTitle className="text-base">
            {t("title")} <IGRPBadge>{role.name}</IGRPBadge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-w-0 overflow-x-hidden">
          <section className="flex flex-col gap-10 max-w-full px-2y">
            <div className="flex flex-col gap-4">
              <div className="relative py-4">
                <Input
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
                  placeholder={t("filterPlaceholder")}
                  type="search"
                  autoComplete="off"
                  aria-label={t("filterLabel")}
                />
                <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-2 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                  <IGRPIcon iconName="Search" aria-hidden />
                </div>
                {Boolean(table.getColumn("name")?.getFilterValue()) && (
                  <button
                    className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring absolute inset-y-0 end-2 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={t("clearFilter")}
                    onClick={() => {
                      table.getColumn("name")?.setFilterValue("");
                      inputRef.current?.focus();
                    }}
                    type="button"
                  >
                    <IGRPIcon iconName="CircleX" aria-hidden />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 px-3">
                <Badge>{t("selected", { count: selectedRows.length })}</Badge>
              </div>
              {isLoading ? (
                <AppCenterLoading description={t("loading")} />
              ) : (
                <SelectableDataTable
                  table={table}
                  columnCount={columns.length}
                  rowsPerPageLabel={t("rowsPerPage")}
                />
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
                  {t("save")}
                </IGRPButton>
              </div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
