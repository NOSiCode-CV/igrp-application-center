"use client";

import { useCallback, useMemo, useState } from "react";

import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IGRPIcon,
  Input,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@igrp/igrp-framework-react-design-system";
import type { RoleDTO } from "@igrp/platform-access-management-client-ts";
import { useTranslations } from "next-intl";

import { AppCenterLoading } from "@/components/loading";
import { useRoles } from "@/features/departments/use-departments";
import { useStatusOptions } from "@/i18n/status";

import type { RoleArgs } from "../role-schemas";
import { RoleTreeRow } from "./role.tree-row";
import { RoleDeleteDialog } from "./role-delete-dialog";
import { RoleFormDialog } from "./role-form-dialog";
import { RoleDetails } from "./role-permissions-dialog";
import { RoleTreeContext } from "./role-tree-context";

interface RolesListProps {
  departmentCode: string;
}

export type RoleWithChildren = RoleArgs & { children?: RoleWithChildren[] };

export function RolesListTree({ departmentCode }: RolesListProps) {
  const t = useTranslations("roles.list");
  const tc = useTranslations("common.actions");
  const statusOptions = useStatusOptions();
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

  const { data: roles, isLoading, error } = useRoles(departmentCode);

  const buildRoleTree = (roles: RoleDTO[]): RoleWithChildren[] => {
    const map = new Map<string, RoleWithChildren>();
    const roots: RoleWithChildren[] = [];
    roles.forEach((role) => {
      map.set(role.code, { ...role, name: role.name ?? "", children: [] });
    });

    roles.forEach((role) => {
      const node = map.get(role.code);
      if (!node) return;
      if (role.parentCode) {
        const parent = map.get(role.parentCode);
        if (parent) {
          parent.children?.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const toggleExpand = useCallback((roleCode: string) => {
    setExpandedRoles((prev) => {
      const next = new Set(prev);
      next.has(roleCode) ? next.delete(roleCode) : next.add(roleCode);
      return next;
    });
  }, []);

  const handleNewRole = () => {
    setSelectedRole(undefined);
    setParentRoleName(null);
    setOpenDetailsDialog(false);
    setOpenFormDialog(true);
  };

  const handleDelete = useCallback((code: string) => {
    setRoleToDelete(code);
    setOpenDeleteDialog(true);
  }, []);

  const handleEdit = useCallback((role: RoleArgs) => {
    setSelectedRole(role);
    setParentRoleName(null);
    setRoleToDelete(null);
    setOpenDetailsDialog(false);
    setOpenFormDialog(true);
  }, []);

  const handleNewSubRole = useCallback((role: RoleArgs) => {
    setSelectedRole(undefined);
    setParentRoleName(role.code);
    setRoleToDelete(null);
    setOpenDetailsDialog(false);
    setOpenFormDialog(true);
  }, []);

  const handlePermissions = useCallback((role: RoleArgs) => {
    setSelectedRole(role);
    setRoleToDelete(null);
    setOpenFormDialog(false);
    setOpenDetailsDialog(true);
  }, []);

  const treeContextValue = useMemo(
    () => ({
      expandedRoles,
      toggleExpand,
      handleEdit,
      handleNewSubRole,
      handlePermissions,
      handleDelete,
    }),
    [
      expandedRoles,
      toggleExpand,
      handleEdit,
      handleNewSubRole,
      handlePermissions,
      handleDelete,
    ],
  );

  if (error) {
    return (
      <div className="rounded-md border py-6">
        <p className="text-center">{t("loadError")}</p>
        <p className="text-center">{error.message}</p>
      </div>
    );
  }

  const filteredRoles = roles?.filter((role) => {
    if (!role) return false;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !!role.name?.toLowerCase().includes(term) ||
      !!role.description?.toLowerCase().includes(term);

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
            <div className="leading-none font-semibold">{t("title")}</div>
            <div className="text-muted-foreground text-sm">{t("subtitle")}</div>
          </div>
          {!roleEmpty && (
            <div className="flex justify-end">
              <Button onClick={handleNewRole}>
                <IGRPIcon
                  iconName="UserLock"
                  aria-hidden
                  className="size-4"
                  strokeWidth={2}
                />
                {t("newRole")}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start gap-4 w-full min-w-0">
          <div className="relative w-full max-w-sm">
            <IGRPIcon
              iconName="Search"
              aria-hidden
              className="absolute left-2.5 top-2.5 size-4 text-muted-foreground"
            />
            <Input
              type="search"
              aria-label={t("searchLabel")}
              autoComplete="off"
              placeholder={t("searchPlaceholder")}
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <IGRPIcon iconName="ListFilter" aria-hidden strokeWidth={2} />
                  {t("statusFilter")}{" "}
                  {statusFilter.length > 0 && `(${statusFilter.length})`}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                <DropdownMenuSeparator />
                {statusOptions.map(({ value, label }) => (
                  <DropdownMenuCheckboxItem
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
                  </DropdownMenuCheckboxItem>
                ))}
                {statusFilter.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setStatusFilter([])}
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    >
                      <IGRPIcon
                        iconName="X"
                        aria-hidden
                        className="mr-1"
                        strokeWidth={2}
                      />
                      {tc("clear")}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {isLoading ? (
          <AppCenterLoading description={t("loading")} />
        ) : roleEmpty ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border rounded-lg">
            <IGRPIcon
              iconName="UserLock"
              aria-hidden
              className="size-16 mb-4 opacity-30"
              strokeWidth={1.5}
            />
            <p className="text-lg font-medium mb-2">{t("emptyTitle")}</p>
            <p className="text-sm mb-4">{t("emptyDescription")}</p>
            {searchTerm ? (
              t("adjustSearch")
            ) : (
              <Button onClick={handleNewRole}>
                <IGRPIcon
                  iconName="UserLock"
                  aria-hidden
                  className="size-4"
                  strokeWidth={2}
                />
                {t("newRole")}
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">
                    {t("columnRole")}
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    {t("columnDescription")}
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    {t("columnStatus")}
                  </TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                <RoleTreeContext value={treeContextValue}>
                  {roleTree.map((role) => (
                    <RoleTreeRow key={role.id} role={role} />
                  ))}
                </RoleTreeContext>
              </TableBody>
            </Table>
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
          departmentCode={departmentCode}
          open={openDeleteDialog}
          onOpenChange={setOpenDeleteDialog}
          roleToDelete={roleToDelete}
        />
      )}
    </div>
  );
}
