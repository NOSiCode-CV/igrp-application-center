"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import {
  Badge,
  Button,
  Checkbox,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  IGRPButton,
  IGRPIcon,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import type { RoleDTO } from "@igrp/platform-access-management-client-ts";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type PaginationState,
  useReactTable,
} from "@tanstack/react-table";
import { useTranslations } from "next-intl";

import { SelectableDataTable } from "@/components/data-table/selectable-data-table";
import {
  saveMembership,
  useMembershipEditor,
} from "@/components/data-table/use-membership-editor";
import {
  useDepartments,
  useRoles,
} from "@/features/departments/use-departments";
import { computeRoleDiff } from "@/features/users/lib/role-diff";
import {
  useAddUserRole,
  useRemoveUserRole,
  useUserRoles,
} from "@/features/users/use-users";
import { useServerErrorMessage } from "@/i18n/server-error";
import { statusClass } from "@/lib/utilities";

import {
  type StatusTranslator,
  type UsersTranslator,
  userStatusLabel,
} from "../lib/i18n";

const norm = (s: string) => s.trim().toLowerCase();

const multiColumnFilterFn: FilterFn<RoleDTO> = (
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

const makeColumns = (
  t: UsersTranslator,
  tStatus: StatusTranslator,
): ColumnDef<RoleDTO>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label={t("roleDialog.selectAll")}
        className="ring ring-current/50"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label={t("roleDialog.selectRow")}
        className="ring ring-current/50"
      />
    ),
    size: 28,
    enableSorting: false,
  },
  {
    header: t("roleDialog.columns.name"),
    accessorKey: "name",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("name")}</div>
    ),
    enableSorting: false,
    filterFn: multiColumnFilterFn,
    enableColumnFilter: true,
  },
  {
    header: t("roleDialog.columns.description"),
    accessorKey: "description",
    cell: ({ row }) => (
      <div>{row.getValue("description") || t("notAvailable")}</div>
    ),
    enableSorting: false,
  },
  {
    header: t("roleDialog.columns.status"),
    accessorKey: "status",
    cell: ({ row }) => (
      <Badge className={cn(statusClass(row.getValue("status")), "capitalize")}>
        {userStatusLabel(tStatus, row.getValue("status"))}
      </Badge>
    ),
    size: 40,
    enableSorting: false,
  },
];

const getRowKey = (r: RoleDTO) => String(r.id ?? r.name);
const roleCodes = (list: RoleDTO[]) =>
  list.map((r) => r.code ?? "").filter(Boolean);
const diffRoles = (selected: RoleDTO[], existing: RoleDTO[]) => {
  const { toAdd, toRemove } = computeRoleDiff(
    roleCodes(existing),
    roleCodes(selected),
  );
  return { toAdd: toAdd.roles, toRemove };
};

type UserRolesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  id: string;
};

export function UserRolesDialog({
  open,
  onOpenChange,
  id,
}: UserRolesDialogProps) {
  const idValue = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { igrpToast } = useIGRPToast();
  const t = useTranslations("users");
  const serverError = useServerErrorMessage();
  const tStatus = useTranslations("common.status");
  const columns = useMemo(() => makeColumns(t, tStatus), [t, tStatus]);

  const {
    data: depts,
    isLoading: deptsLoading,
    error: deptsError,
  } = useDepartments();
  const [deptPopoverOpen, setDeptPopoverOpen] = useState(false);
  const [pickedDept, setPickedDept] = useState<string | undefined>(undefined);
  // Derived, not synced by an effect: the first department until one is picked.
  const departmentCode = open ? (pickedDept ?? depts?.[0]?.code) : undefined;

  const deptName = (code?: string) =>
    depts?.find((d) => d.code === code)?.name ?? code ?? "";

  const handleSelectDept = (code: string) => {
    setPickedDept(code);
    setDeptPopoverOpen(false);
  };

  const { data: roles, isLoading, error } = useRoles(departmentCode || "");

  const {
    data: userRoles,
    isLoading: isLoadingUserRoles,
    error: errorUserRoles,
    refetch: refetchUserRoles,
  } = useUserRoles(id);

  const data = useMemo(() => (open ? (roles ?? []) : []), [open, roles]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 15,
  });
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [expiresAt, setExpiresAt] = useState<string>("");

  const roleNameSet = useMemo(
    () => new Set((roles ?? []).map((r) => norm(r.name ?? ""))),
    [roles],
  );
  const userRolesInDept = useMemo(
    () => (userRoles ?? []).filter((r) => roleNameSet.has(norm(r.name ?? ""))),
    [userRoles, roleNameSet],
  );

  const { rowSelection, setRowSelection, toAdd, toRemove, hasChanges } =
    useMembershipEditor({
      rows: data,
      existing: userRolesInDept as RoleDTO[],
      getKey: getRowKey,
      diff: diffRoles,
    });

  // Reset on close while rendering (React's "adjust state on prop change"),
  // so the closed dialog never commits stale state first.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (!open) {
      setPickedDept(undefined);
      setColumnFilters([]);
      setPagination({ pageIndex: 0, pageSize: 15 });
      setExpiresAt("");
    }
  }

  // A new role list (another department) starts on its first page.
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset is keyed on the list itself.
  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [roles]);

  const table = useReactTable({
    data,
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

  const { mutateAsync: addUserRole, isPending: isAdding } = useAddUserRole();
  const { mutateAsync: removeUserRole, isPending: isRemoving } =
    useRemoveUserRole();

  async function onSubmit() {
    if (!departmentCode) {
      igrpToast({
        type: "warning",
        title: t("roleDialog.toasts.selectDepartmentFirst"),
      });
      return;
    }
    if (!hasChanges) {
      igrpToast({
        type: "info",
        title: t("roleDialog.toasts.noChanges"),
        description: t("roleDialog.toasts.noChangesDescription"),
      });
      return;
    }

    try {
      await saveMembership(
        { toAdd, toRemove },
        (codes) =>
          addUserRole({
            id,
            departmentCode,
            request: { roles: codes, ...(expiresAt ? { expiresAt } : {}) },
          }),
        (roleCodes) => removeUserRole({ id, departmentCode, roleCodes }),
      );

      igrpToast({
        type: "success",
        title: t("roleDialog.toasts.updated"),
        description: t("roleDialog.toasts.updatedDescription", {
          added: toAdd.length,
          removed: toRemove.length,
        }),
      });

      await refetchUserRoles();
      onOpenChange(false);
    } catch (error) {
      igrpToast({
        type: "error",
        title: t("roleDialog.toasts.updateFailed"),
        description:
          error instanceof Error
            ? serverError(error.message)
            : t("unknownError"),
      });
    }
  }

  const loading = (departmentCode ? isLoading : false) || isLoadingUserRoles;
  const err = error || errorUserRoles;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:min-w-2xl max-h-[95vh]">
        <DialogHeader>
          <DialogTitle className="text-base">
            {t("roleDialog.title")}
          </DialogTitle>
          <DialogDescription>
            {departmentCode
              ? t("roleDialog.departmentScope", {
                  department: deptName(departmentCode),
                })
              : t("roleDialog.pickDepartment")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-w-0 overflow-x-hidden">
          <section className="flex flex-col gap-8 max-w-full">
            <div className="flex flex-col gap-4">
              <div className="flex gap-2 ">
                <div className="relative flex-1">
                  <Input
                    id={`${idValue}-input`}
                    ref={inputRef}
                    className={cn(
                      "peer ps-9 border-foreground/30 focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:border-foreground/30",
                      Boolean(table.getColumn("name")?.getFilterValue()) &&
                        "pe-9",
                    )}
                    value={
                      (table.getColumn("name")?.getFilterValue() ??
                        "") as string
                    }
                    onChange={(e) =>
                      table.getColumn("name")?.setFilterValue(e.target.value)
                    }
                    placeholder={t("roleDialog.filterPlaceholder")}
                    type="text"
                    aria-label={t("roleDialog.filterLabel")}
                    disabled={!departmentCode}
                  />
                  <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-2 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                    <IGRPIcon iconName="ListFilter" />
                  </div>
                  {Boolean(table.getColumn("name")?.getFilterValue()) && (
                    <button
                      type="button"
                      className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-2 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px]"
                      aria-label={t("roleDialog.clearFilter")}
                      onClick={() => {
                        table.getColumn("name")?.setFilterValue("");
                        inputRef.current?.focus();
                      }}
                    >
                      <IGRPIcon iconName="CircleX" />
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Popover
                    open={deptPopoverOpen}
                    onOpenChange={setDeptPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between",
                          !departmentCode && "text-muted-foreground",
                        )}
                        disabled={
                          deptsLoading ||
                          !!deptsError ||
                          (depts?.length ?? 0) === 0
                        }
                      >
                        {deptsLoading
                          ? t("roleDialog.departments.loading")
                          : departmentCode
                            ? deptName(departmentCode)
                            : deptsError
                              ? t("roleDialog.departments.loadError")
                              : (depts?.length ?? 0) === 0
                                ? t("roleDialog.departments.empty")
                                : t("roleDialog.departments.placeholder")}
                        <IGRPIcon
                          iconName="ChevronsUpDown"
                          className="ml-2 h-4 w-4 opacity-50"
                        />
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput
                          placeholder={t("roleDialog.departments.search")}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {t("roleDialog.departments.notFound")}
                          </CommandEmpty>
                          <CommandGroup>
                            {depts?.map((dept) => (
                              <CommandItem
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
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Label
                  htmlFor="expires-at"
                  className="text-sm whitespace-nowrap"
                >
                  {t("roleDialog.expiresAt")}
                </Label>
                <Input
                  id="expires-at"
                  type="date"
                  value={expiresAt}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-44"
                />
              </div>

              {!departmentCode ? (
                <div className="rounded-md border py-10 text-center text-muted-foreground ">
                  {t("roleDialog.selectDepartmentHint")}
                </div>
              ) : loading ? (
                <div className="rounded-md border py-6 text-center ">
                  {t("roleDialog.loadingRoles")}
                </div>
              ) : err ? (
                <div className="rounded-md border py-6 ">
                  <p className="text-center">
                    {t("roleDialog.loadRolesError")}
                  </p>
                  <p className="text-center">
                    {err instanceof Error
                      ? serverError(err.message)
                      : String(err)}
                  </p>
                </div>
              ) : (
                <SelectableDataTable
                  table={table}
                  columnCount={columns.length}
                />
              )}

              <div className="flex items-center justify-between gap-3">
                <Badge>
                  {t("roleDialog.selectedCount", {
                    count: table.getSelectedRowModel().rows.length,
                  })}
                </Badge>

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
                    {t("roleDialog.clear")}
                  </IGRPButton>
                  <IGRPButton
                    variant="default"
                    onClick={onSubmit}
                    disabled={
                      !departmentCode ||
                      !hasChanges ||
                      loading ||
                      isAdding ||
                      isRemoving
                    }
                    size="sm"
                    iconName="Save"
                    showIcon
                  >
                    {loading || isAdding || isRemoving
                      ? t("roleDialog.saving")
                      : t("roleDialog.save")}
                  </IGRPButton>
                </div>
              </div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
