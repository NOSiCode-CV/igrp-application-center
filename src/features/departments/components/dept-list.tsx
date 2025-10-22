"use client";

import {
  cn,
  type ColumnDef,
  IGRPBadgePrimitive,
  IGRPDataTable,
  IGRPDataTableCellBadge,
  IGRPDataTableCellTooltip,
  type IGRPDataTableClientFilterListProps,
  IGRPDataTableDropdownMenu,
  IGRPDataTableDropdownMenuLink,
  IGRPDataTableFacetedFilterFn,
  IGRPDataTableFilterFaceted,
  IGRPDataTableFilterInput,
  IGRPDataTableHeaderSortToggle,
  IGRPDataTableRowAction,
  type Row,
} from "@igrp/igrp-framework-react-design-system";
import { useEffect, useMemo, useState } from "react";

import { ButtonLink } from "@/components/button-link";
import { AppCenterLoading } from "@/components/loading";
import { PageHeader } from "@/components/page-header";
import { ROUTES, STATUS_OPTIONS } from "@/lib/constants";
import { showStatus, statusClass } from "@/lib/utils";
import type { DepartmentArgs } from "../dept-schemas";
import { useDepartments } from "../use-departments";
import { DepartmentDeleteDialog } from "./dept-delete-dialog";
import { DepartmentFormDialog } from "./dept-form-dialog";
// import { useCurrentUser } from '@/features/users/use-users';

export function DepartmentList() {
  const [data, setData] = useState<DepartmentArgs[]>([]);

  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentDept, setCurrentDept] = useState<DepartmentArgs | null>(null);
  const [deptToDelete, setDeptToDelete] = useState<{
    code: string;
    name: string;
  } | null>(null);

  const { data: departments, isLoading, error } = useDepartments();

  useEffect(() => {
    setData(departments ?? []);
  }, [departments]);

  const columns: ColumnDef<DepartmentArgs>[] = [
    {
      header: ({ column }) => (
        <IGRPDataTableHeaderSortToggle column={column} title="Nome" />
      ),
      accessorKey: "name",
      cell: ({ row }) => {
        const code = String(row.getValue("code"));
        const name = String(row.getValue("name"));
        return (
          <ButtonLink
            href={`${ROUTES.DEPARTMENTS}/${code}`}
            btnClassName="cursor-pointer hover:underline px-0"
            icon={""}
            variant="link"
            label={name}
          />
        );
      },
    },
    {
      header: "Código",
      accessorKey: "code",
      cell: ({ row }) => (
        <IGRPDataTableCellBadge
          color="primary"
          variant="soft"
          label={row.getValue("code")}
        />
      ),
    },
    {
      header: "Descrição",
      accessorKey: "description",
      cell: ({ row }) => {
        const description = String(row.getValue("description"));
        return <IGRPDataTableCellTooltip text={description} />;
      },
    },
    {
      header: "Estado",
      accessorKey: "status",
      cell: ({ row }) => {
        const status = String(row.getValue("status"));
        return (
          <IGRPBadgePrimitive className={cn(statusClass(status), "capitalize")}>
            {showStatus(status)}
          </IGRPBadgePrimitive>
        );
      },
      filterFn: IGRPDataTableFacetedFilterFn,
      size: 70,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Ações</span>,
      cell: ({ row }) => <RowActions row={row} />,
      size: 50,
      enableHiding: false,
    },
  ];

  function RowActions({ row }: { row: Row<DepartmentArgs> }) {
    const code = String(row.getValue("code"));
    const name = String(row.getValue("name"));
    return (
      <IGRPDataTableRowAction>
        <IGRPDataTableDropdownMenu
          iconName="EllipsisVertical"
          items={[
            {
              component: IGRPDataTableDropdownMenuLink,
              props: {
                labelTrigger: "Ver",
                icon: "Eye",
                showIcon: true,
                href: `${ROUTES.DEPARTMENTS}/${code}`,
              },
            },
            {
              component: IGRPDataTableDropdownMenuLink,
              props: {
                labelTrigger: "Editar",
                icon: "Pencil",
                showIcon: true,
                action: () => {
                  setDeptToDelete(null);
                  setCurrentDept(row.original);
                  setOpenFormDialog(true);
                },
              },
            },
            {
              component: IGRPDataTableDropdownMenuLink,
              props: {
                labelTrigger: "Eliminar",
                icon: "Trash",
                showIcon: true,
                action: () => {
                  handleDelete(code, name);
                },
                variant: "destructive",
              },
            },
          ]}
        />
      </IGRPDataTableRowAction>
    );
  }

  const filters: IGRPDataTableClientFilterListProps<DepartmentArgs>[] = [
    {
      columnId: "name",
      component: (column) => <IGRPDataTableFilterInput column={column} />,
    },
    {
      columnId: "status",
      component: (column) => (
        <IGRPDataTableFilterFaceted
          column={column}
          options={STATUS_OPTIONS}
          placeholder="Estado"
        />
      ),
    },
  ];

  if (isLoading || !departments) {
    return <AppCenterLoading descrption="Carregando departamentos..." />;
  }

  if (error) throw error;

  const emptyList = departments.length === 0;

  const handleDelete = (code: string, name: string) => {
    setOpenFormDialog(false);
    setCurrentDept(null);
    setDeptToDelete({ code, name });
    setOpenDeleteDialog(true);
  };

  const handleOpenCreate = () => {
    setCurrentDept(null);
    setDeptToDelete(null);
    setOpenFormDialog(true);
  };

  return (
    <div className="flex flex-col gap-10 animate-fade-in">
      <PageHeader
        title="Gestão de Departamentos"
        description="Gerir departamentos e roles."
        showActions
      >
        {!emptyList && (
          <ButtonLink
            onClick={() => handleOpenCreate()}
            icon="GlobeLock"
            href="#"
            label="Novo Departamento"
          />
        )}
      </PageHeader>

      <IGRPDataTable<DepartmentArgs, DepartmentArgs>
        showFilter
        showPagination
        tableClassName="table-fixed"
        columns={columns}
        data={data}
        clientFilters={filters}
        getRowCanExpand={(row) => Boolean(row.original.description)}
      />

      <DepartmentFormDialog
        open={openFormDialog}
        onOpenChange={setOpenFormDialog}
        department={currentDept}
      />

      {deptToDelete && (
        <DepartmentDeleteDialog
          open={openDeleteDialog}
          onOpenChange={setOpenDeleteDialog}
          deptToDelete={deptToDelete}
        />
      )}
    </div>
  );
}
