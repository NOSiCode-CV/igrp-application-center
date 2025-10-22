"use client";

import {
  cn,
  IGRPBadgePrimitive,
  IGRPButtonPrimitive,
  IGRPDropdownMenuCheckboxItemPrimitive,
  IGRPDropdownMenuContentPrimitive,
  IGRPDropdownMenuItemPrimitive,
  IGRPDropdownMenuLabelPrimitive,
  IGRPDropdownMenuPrimitive,
  IGRPDropdownMenuSeparatorPrimitive,
  IGRPDropdownMenuTriggerPrimitive,
  IGRPIcon,
  IGRPInputPrimitive,
  IGRPSkeletonPrimitive,
  IGRPTableBodyPrimitive,
  IGRPTableCellPrimitive,
  IGRPTableHeaderPrimitive,
  IGRPTableHeadPrimitive,
  IGRPTablePrimitive,
  IGRPTableRowPrimitive,
} from "@igrp/igrp-framework-react-design-system";
import { useState } from "react";

import { ButtonLink } from "@/components/button-link";
import { STATUS_OPTIONS } from "@/lib/constants";
import { showStatus, statusClass } from "@/lib/utils";
import type { PermissionArgs } from "../permissions-schemas";
import { usePermissions } from "../use-permission";
import { PermissionDeleteDialog } from "./permisssion-delete-dialog";
import { PermissionFormDialog } from "./permisssion-form-dialog";

interface PermissionListProps {
  departmentCode: string;
}

export function PermissionList({ departmentCode }: PermissionListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<
    PermissionArgs | undefined
  >(undefined);
  const [permissionToDelete, setPermissionToDelete] = useState<string | null>(
    null,
  );
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  const {
    data: permissions,
    isLoading,
    error,
  } = usePermissions({ departmentCode });

  if (error) {
    return (
      <div className="rounded-md border py-6">
        <p className="text-center">Ocorreu um erro ao carregar permissões.</p>
        <p className="text-center">{error.message}</p>
      </div>
    );
  }

  const filteredPermissions = permissions?.filter((perm) => {
    const matchesSearch =
      perm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      perm.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter.length === 0 || statusFilter.includes(perm.status);

    return matchesSearch && matchesStatus;
  });

  const handleDelete = (name: string) => {
    setPermissionToDelete(name);
    setOpenDeleteDialog(true);
  };

  const handleEdit = (permission: PermissionArgs) => {
    setSelectedPermission(permission);
    setOpenFormDialog(true);
  };

  const handleNewpermssion = () => {
    setSelectedPermission(undefined);
    setOpenFormDialog(true);
  };

  const permissionEmpty = permissions?.length === 0;

  return (
    <>
      <div className="flex flex-col gap-6 py-4 px-3 min-w-0">
        <div>
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <div className="leading-none font-semibold">Permissões</div>
              <div className="text-muted-foreground text-sm">
                Gerir e reorganizar os permissões.
              </div>
            </div>
            {!permissionEmpty && (
              <div className="flex justify-end flex-shrink-0">
                <ButtonLink
                  onClick={handleNewpermssion}
                  icon="UserLock"
                  href="#"
                  label="Nova Permissão"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row items-start gap-4 w-full min-w-0">
            <div className="relative w-full max-w-sm">
              <IGRPIcon
                iconName="Search"
                className="absolute left-2.5 top-2.5 size-4 text-muted-foreground"
              />
              <IGRPInputPrimitive
                type="search"
                placeholder="Pesquisar permissões..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2 flex-shirnk-0">
              <IGRPDropdownMenuPrimitive>
                <IGRPDropdownMenuTriggerPrimitive asChild>
                  <IGRPButtonPrimitive variant="outline" className="gap-2">
                    <IGRPIcon iconName="ListFilter" strokeWidth={2} />
                    Estado{" "}
                    {statusFilter.length > 0 && `(${statusFilter.length})`}
                  </IGRPButtonPrimitive>
                </IGRPDropdownMenuTriggerPrimitive>
                <IGRPDropdownMenuContentPrimitive
                  align="start"
                  className="w-40"
                >
                  <IGRPDropdownMenuSeparatorPrimitive />
                  {STATUS_OPTIONS.map(({ value, label }) => (
                    <IGRPDropdownMenuCheckboxItemPrimitive
                      key={value}
                      checked={statusFilter.includes(value)}
                      onCheckedChange={(checked) => {
                        setStatusFilter(
                          checked
                            ? [...statusFilter, value]
                            : statusFilter.filter((s) => s !== value),
                        );
                      }}
                    >
                      {label}
                    </IGRPDropdownMenuCheckboxItemPrimitive>
                  ))}
                  {statusFilter.length > 0 && (
                    <>
                      <IGRPDropdownMenuSeparatorPrimitive />
                      <IGRPDropdownMenuItemPrimitive
                        onClick={() => setStatusFilter([])}
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      >
                        <IGRPIcon
                          iconName="X"
                          className="mr-1"
                          strokeWidth={2}
                        />
                        Limpar
                      </IGRPDropdownMenuItemPrimitive>
                    </>
                  )}
                </IGRPDropdownMenuContentPrimitive>
              </IGRPDropdownMenuPrimitive>
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-4 animate-pulse">
              {Array.from({ length: 5 }).map((_, i) => (
                <IGRPSkeletonPrimitive
                  key={i}
                  className="h-12 rounded-lg bg-muted"
                />
              ))}
            </div>
          ) : permissionEmpty ? (
            <div className="text-center py-6 text-muted-foreground">
              <div>Nenhuma permissão encontrada </div>
              {searchTerm ? (
                "Tente ajustar a sua pesquisa."
              ) : (
                <ButtonLink
                  onClick={handleNewpermssion}
                  icon="UserLock"
                  href="#"
                  label="Nova Permissão"
                  variant="outline"
                />
              )}
            </div>
          ) : (
            <div className="w-full min-w-0">
              <div className="rounded-md border overflow-x-auto">
                <IGRPTablePrimitive className="min-w-full">
                  <IGRPTableHeaderPrimitive>
                    <IGRPTableRowPrimitive>
                      <IGRPTableHeadPrimitive className="whitespace-nowrap">
                        Permissão
                      </IGRPTableHeadPrimitive>
                      <IGRPTableHeadPrimitive className="whitespace-nowrap">
                        Descrição
                      </IGRPTableHeadPrimitive>
                      <IGRPTableHeadPrimitive className="whitespace-nowrap">
                        Estado
                      </IGRPTableHeadPrimitive>
                      <IGRPTableHeadPrimitive className="whitespace-nowrap">
                        Nro. de Perfis
                      </IGRPTableHeadPrimitive>
                      <IGRPTableHeadPrimitive className="w-24" />
                    </IGRPTableRowPrimitive>
                  </IGRPTableHeaderPrimitive>
                  <IGRPTableBodyPrimitive>
                    {filteredPermissions?.map((permssion) => (
                      <IGRPTableRowPrimitive key={permssion.id}>
                        <IGRPTableCellPrimitive className="font-medium whitespace-nowrap">
                          {permssion.name}
                        </IGRPTableCellPrimitive>
                        <IGRPTableCellPrimitive className="whitespace-nowrap">
                          {permssion.description || "N/A"}
                        </IGRPTableCellPrimitive>
                        <IGRPTableCellPrimitive className="whitespace-nowrap">
                          <IGRPBadgePrimitive
                            className={cn(
                              statusClass(permssion.status),
                              "capitalize",
                            )}
                          >
                            {showStatus(permssion.status)}
                          </IGRPBadgePrimitive>
                        </IGRPTableCellPrimitive>
                        <IGRPTableCellPrimitive className="whitespace-nowrap">
                          {permssion.description || "N/A"}
                        </IGRPTableCellPrimitive>

                        <IGRPTableCellPrimitive>
                          <IGRPDropdownMenuPrimitive>
                            <IGRPDropdownMenuTriggerPrimitive asChild>
                              <IGRPButtonPrimitive
                                variant="ghost"
                                className="size-8 p-0"
                              >
                                <span className="sr-only">Abrir Menu</span>
                                <IGRPIcon
                                  iconName="Ellipsis"
                                  className="size-4"
                                />
                              </IGRPButtonPrimitive>
                            </IGRPDropdownMenuTriggerPrimitive>
                            <IGRPDropdownMenuContentPrimitive align="end">
                              <IGRPDropdownMenuLabelPrimitive>
                                Ações
                              </IGRPDropdownMenuLabelPrimitive>
                              <IGRPDropdownMenuItemPrimitive
                                onSelect={() => handleEdit(permssion)}
                              >
                                <IGRPIcon
                                  iconName="Pencil"
                                  className="mr-1 size-4"
                                />
                                Editar
                              </IGRPDropdownMenuItemPrimitive>
                              <IGRPDropdownMenuSeparatorPrimitive />
                              <IGRPDropdownMenuItemPrimitive
                                onClick={() => handleDelete(permssion.name)}
                                variant="destructive"
                              >
                                <IGRPIcon
                                  iconName="Trash"
                                  className="mr-1 size-4"
                                />
                                Eliminar
                              </IGRPDropdownMenuItemPrimitive>
                            </IGRPDropdownMenuContentPrimitive>
                          </IGRPDropdownMenuPrimitive>
                        </IGRPTableCellPrimitive>
                      </IGRPTableRowPrimitive>
                    ))}
                  </IGRPTableBodyPrimitive>
                </IGRPTablePrimitive>
              </div>
            </div>
          )}
        </div>
      </div>

      <PermissionFormDialog
        open={openFormDialog}
        onOpenChange={setOpenFormDialog}
        departmentCode={departmentCode}
        permission={selectedPermission}
      />

      {permissionToDelete && (
        <PermissionDeleteDialog
          open={openDeleteDialog}
          onOpenChange={setOpenDeleteDialog}
          permissionToDelete={permissionToDelete}
        />
      )}
    </>
  );
}
