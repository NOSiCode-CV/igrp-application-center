"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

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
  type RowSelectionState,
  useReactTable,
} from "@tanstack/react-table";

import { SelectableDataTable } from "@/components/data-table/selectable-data-table";
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
import { getStatusColor, showStatus } from "@/lib/utilities";

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

const columns: ColumnDef<RoleDTO>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
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
      <Checkbox
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
      <Badge
        className={cn(getStatusColor(row.getValue("status")), "capitalize")}
      >
        {showStatus(row.getValue("status"))}
      </Badge>
    ),
    size: 40,
    enableSorting: false,
  },
];

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

  const {
    data: depts,
    isLoading: deptsLoading,
    error: deptsError,
  } = useDepartments();
  const [deptPopoverOpen, setDeptPopoverOpen] = useState(false);
  const [departmentCode, setDepartmentCode] = useState<string | undefined>(
    undefined,
  );

  useEffect(() => {
    if (open && depts?.length && !departmentCode) {
      setDepartmentCode(depts[0].code);
    }
  }, [open, depts, departmentCode]);

  const deptName = (code?: string) =>
    depts?.find((d) => d.code === code)?.name ?? code ?? "";

  const handleSelectDept = (code: string) => {
    setDepartmentCode(code);
    setDeptPopoverOpen(false);
  };

  const { data: roles, isLoading, error } = useRoles(departmentCode || "");

  const {
    data: userRoles,
    isLoading: isLoadingUserRoles,
    error: errorUserRoles,
    refetch: refetchUserRoles,
  } = useUserRoles(id);

  // Derived directly from the query — no state mirror / sync effect.
  const data = useMemo(() => (open ? (roles ?? []) : []), [open, roles]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [expiresAt, setExpiresAt] = useState<string>("");

  const getRowKey = useCallback((r: RoleDTO) => String(r.id ?? r.name), []);

  const roleNameSet = useMemo(
    () => new Set((roles ?? []).map((r) => norm(r.name ?? ""))),
    [roles],
  );
  const userRolesInDept = useMemo(
    () => (userRoles ?? []).filter((r) => roleNameSet.has(norm(r.name ?? ""))),
    [userRoles, roleNameSet],
  );

  const preselectedKeys = useMemo(() => {
    const list = Array.isArray(userRolesInDept) ? userRolesInDept : [];
    return new Set<string>(list.map((r) => getRowKey(r as RoleDTO)));
  }, [userRolesInDept, getRowKey]);

  useEffect(() => {
    if (!open) {
      setDepartmentCode(undefined);
      setRowSelection({});
      setColumnFilters([]);
      setPagination({ pageIndex: 0, pageSize: 5 });
      setExpiresAt("");
    }
  }, [open]);

  // When the role list (or the user's preselected roles) changes, reset the
  // selection to the preselected set and jump back to the first page.
  useEffect(() => {
    const next: RowSelectionState = {};
    for (const row of roles ?? []) {
      const key = getRowKey(row);
      if (preselectedKeys.has(key)) next[key] = true;
    }
    setRowSelection(next);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [roles, preselectedKeys, getRowKey]);

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

  const selectedRows = table.getSelectedRowModel().rows;
  const selectedData = selectedRows.map((r) => r.original);

  const existing = userRolesInDept ?? [];

  const diff = useMemo(
    () =>
      computeRoleDiff(
        (existing as RoleDTO[]).map((r) => r.code ?? "").filter(Boolean),
        selectedData.map((r) => r.code ?? "").filter(Boolean),
        expiresAt || undefined,
      ),
    [selectedData, existing, expiresAt],
  );

  const hasChanges = diff.toAdd.roles.length > 0 || diff.toRemove.length > 0;

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
      if (diff.toAdd.roles.length) {
        const res = await addUserRole({
          id,
          departmentCode,
          request: diff.toAdd,
        });
        if (!res.success) {
          throw new Error(res.error);
        }
      }
      if (diff.toRemove.length) {
        const res = await removeUserRole({
          id,
          departmentCode,
          roleCodes: diff.toRemove,
        });
        if (!res.success) {
          throw new Error(res.error);
        }
      }

      igrpToast({
        type: "success",
        title: "Perfis atualizados",
        description: `+${diff.toAdd.roles.length} adicionada(s), -${diff.toRemove.length} removida(s).`,
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
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent className="md:min-w-2xl max-h-[95vh]">
        <DialogHeader>
          <DialogTitle className="text-base">
            Adicionar ou Remover Perfis
          </DialogTitle>
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
                      type="button"
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
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Procurar departamento..." />
                        <CommandList>
                          <CommandEmpty>
                            Nenhum departamento encontrado.
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
                  Expiração (opcional)
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
                    {err instanceof Error ? err.message : String(err)}
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
                  {table.getSelectedRowModel().rows.length} selecionado(s)
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
                    Limpar
                  </IGRPButton>
                  <IGRPButton
                    variant="default"
                    onClick={onSubmit}
                    disabled={
                      !departmentCode ||
                      !(diff.toAdd.roles.length || diff.toRemove.length) ||
                      loading ||
                      isAdding ||
                      isRemoving
                    }
                    size="sm"
                    iconName="Save"
                    showIcon
                  >
                    {loading || isAdding || isRemoving
                      ? "Guardando..."
                      : "Guardar"}
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
