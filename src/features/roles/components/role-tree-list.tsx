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
import type { RoleArgs } from "../role-schemas";
import { useRoles } from "../use-roles";
import { RoleDeleteDialog } from "./role-delete-dialog";
import { RoleFormDialog } from "./role-form-dialog";
import { RoleDetails } from "./role-permissions-dialog";
import { RoleTreeRow } from "./role.tree-row";

interface RolesListProps {
  departmentCode: string;
}

export type RoleWithChildren = RoleArgs & { children?: RoleWithChildren[] };

export function RolesListTree({ departmentCode }: RolesListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleArgs | undefined>(
    undefined,
  );
  const [parentRoleName, setParentRoleName] = useState<string | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());

  const { data: roles, isLoading, error } = useRoles({ departmentCode });

  const buildRoleTree = (roles: RoleArgs[]): RoleWithChildren[] => {
    const map = new Map<string, RoleWithChildren>();
    const roots: RoleWithChildren[] = [];
    roles.forEach((role) => {
      map.set(role.code, { ...role, children: [] });
    });

    roles.forEach((role) => {
      const node = map.get(role.code)!;
      if (role.parentCode) {
        const parent = map.get(role.parentCode);
        if (parent) {
          parent.children!.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const toggleExpand = (roleCode: string) => {
    const newExpanded = new Set(expandedRoles);
    if (newExpanded.has(roleCode)) {
      newExpanded.delete(roleCode);
    } else {
      newExpanded.add(roleCode);
    }
    setExpandedRoles(newExpanded);
  };

  const handleNewRole = () => {
    setSelectedRole(undefined);
    setParentRoleName(null);
    setOpenDetailsDialog(false);
    setOpenFormDialog(true);
  };

  const handleDelete = (code: string) => {
    setRoleToDelete(code);
    setOpenDeleteDialog(true);
  };

  const handleEdit = (role: RoleArgs) => {
    setSelectedRole(role);
    setParentRoleName(null);
    setRoleToDelete(null);
    setOpenDetailsDialog(false);
    setOpenFormDialog(true);
  };

  const handleNewSubRole = (role: RoleArgs) => {
    setSelectedRole(undefined);
    setParentRoleName(role.code);
    setRoleToDelete(null);
    setOpenDetailsDialog(false);
    setOpenFormDialog(true);
  };

  const handlePermissions = (role: RoleArgs) => {
    setSelectedRole(role);
    setRoleToDelete(null);
    setOpenFormDialog(false);
    setOpenDetailsDialog(true);
  };

  if (error) {
    return (
      <div className="rounded-md border py-6">
        <p className="text-center">Ocorreu um erro ao carregar roles.</p>
        <p className="text-center">{error.message}</p>
      </div>
    );
  }

  const filteredRoles = roles?.filter((role) => {
    const matchesSearch =
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter.length === 0 || statusFilter.includes(role.status);

    return matchesSearch && matchesStatus;
  });

  const roleTree = filteredRoles ? buildRoleTree(filteredRoles) : [];
  const roleEmpty = roles && roles.length === 0;

  return (
    <div className="flex flex-col gap-3 overflow-hidden animate-fade-in">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <div className="leading-none font-semibold">Perfis</div>
            <div className="text-muted-foreground text-sm">
              Gerir e reorganizar os perfis.
            </div>
          </div>
          {!roleEmpty && (
            <div className="flex justify-end">
              <ButtonLink
                onClick={handleNewRole}
                icon="UserLock"
                href="#"
                label="Novo Perfil"
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
              placeholder="Pesquisar perfil..."
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
                  Estado {statusFilter.length > 0 && `(${statusFilter.length})`}
                </IGRPButtonPrimitive>
              </IGRPDropdownMenuTriggerPrimitive>
              <IGRPDropdownMenuContentPrimitive align="start" className="w-40">
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
                      <IGRPIcon iconName="X" className="mr-1" strokeWidth={2} />
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
        ) : roleEmpty ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border rounded-lg">
            <IGRPIcon
              iconName="UserLock"
              className="w-16 h-16 mb-4 opacity-30"
              strokeWidth={1.5}
            />
            <p className="text-lg font-medium mb-2">Nenhum perfil criado</p>
            <p className="text-sm mb-4">Ainda não existem perfis criados.</p>
            {searchTerm ? (
              "Tente ajustar a sua pesquisa."
            ) : (
              <ButtonLink
                onClick={handleNewRole}
                icon="UserLock"
                href="#"
                label="Novo Perfil"
                variant="outline"
              />
            )}
          </div>
        ) : (
          <div className="rounded-md border">
            <IGRPTablePrimitive>
              <IGRPTableHeaderPrimitive>
                <IGRPTableRowPrimitive>
                  <IGRPTableHeadPrimitive className="whitespace-nowrap">
                    Perfil
                  </IGRPTableHeadPrimitive>
                  <IGRPTableHeadPrimitive className="whitespace-nowrap">
                    Descrição
                  </IGRPTableHeadPrimitive>
                  <IGRPTableHeadPrimitive className="whitespace-nowrap">
                    Estado
                  </IGRPTableHeadPrimitive>
                  <IGRPTableHeadPrimitive className="w-24" />
                </IGRPTableRowPrimitive>
              </IGRPTableHeaderPrimitive>
              <IGRPTableBodyPrimitive>
                {roleTree.map((role) => (
                  <RoleTreeRow
                    key={role.id}
                    role={role}
                    handlePermissions={handlePermissions}
                    expandedRoles={expandedRoles}
                    toggleExpand={toggleExpand}
                    handleEdit={handleEdit}
                    handleDelete={handleDelete}
                    handleNewSubRole={handleNewSubRole}
                  />
                ))}
              </IGRPTableBodyPrimitive>
            </IGRPTablePrimitive>
          </div>
        )}
      </div>

      <RoleFormDialog
        open={openFormDialog}
        onOpenChange={setOpenFormDialog}
        departmentCode={departmentCode}
        parentRoleName={parentRoleName}
        role={selectedRole}
      />

      {selectedRole && (
        <RoleDetails
          departmentCode={departmentCode}
          role={selectedRole}
          open={openDetailsDialog}
          onOpenChange={setOpenDetailsDialog}
        />
      )}

      {roleToDelete && (
        <RoleDeleteDialog
          open={openDeleteDialog}
          onOpenChange={setOpenDeleteDialog}
          roleToDelete={roleToDelete}
        />
      )}
    </div>
  );
}
