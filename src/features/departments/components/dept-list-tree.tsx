"use client";

import {
  IGRPBadgePrimitive,
  IGRPButtonPrimitive,
  IGRPIcon,
  IGRPInputPrimitive,
  IGRPTabItem,
  IGRPTabs,
} from "@igrp/igrp-framework-react-design-system";
import { useEffect, useState } from "react";

import { ButtonLink } from "@/components/button-link";
import { AppCenterLoading } from "@/components/loading";
import { useDepartments, useDepartmentByCode } from "../use-departments";
import { DepartmentDeleteDialog } from "./dept-delete-dialog";
import { DepartmentFormDialog } from "./dept-form-dialog";
import DepartmentTreeItem from "./dept-tree-item";
import { PermissionList } from "@/features/permissions/components/permission-list";
import { CopyToClipboard } from "@/components/copy-to-clipboard";
import { RolesListTree } from "@/features/roles/components/role-tree-list";
import { MenuPermissions } from "./dept-menu";
import { ManageAppsModal } from "./Modal/manage-apps-modal";
import { getStatusColor } from "@/lib/utils";
import { DepartmentDTO } from "@igrp/platform-access-management-client-ts";

export type DepartmentWithChildren = DepartmentDTO & {
  children?: DepartmentWithChildren[];
};

export const buildTree = (depts: DepartmentDTO[]): DepartmentWithChildren[] => {
  const map = new Map<string, DepartmentWithChildren>();
  const roots: DepartmentWithChildren[] = [];

  depts?.forEach((dept) => {
    map.set(dept.code, { ...dept, children: [] });
  });

  depts?.forEach((dept) => {
    const node = map.get(dept.code)!;
    if (dept.parentCode) {
      const parent = map.get(dept.parentCode);
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

export const filterTree = (
  depts: DepartmentWithChildren[],
  term: string,
): DepartmentWithChildren[] => {
  if (!term) return depts;

  return depts
    .map((dept) => {
      const matchesCurrent =
        dept.name.toLowerCase().includes(term.toLowerCase()) ||
        dept.code.toLowerCase().includes(term.toLowerCase());

      const filteredChildren = dept.children
        ? filterTree(dept.children, term)
        : [];

      if (matchesCurrent || filteredChildren.length > 0) {
        return { ...dept, children: filteredChildren };
      }
      return null;
    })
    .filter(Boolean) as DepartmentWithChildren[];
};

export function DepartmentListTree() {
  const [selectedDeptCode, setSelectedDeptCode] = useState<string | null>(null);
  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentDept, setCurrentDept] = useState<DepartmentDTO | null>(null);
  const [parentDeptId, setParentDeptId] = useState<DepartmentDTO | null>(null);
  const [deptToDelete, setDeptToDelete] = useState<{
    code: string;
    name: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAppsModal, setShowAppsModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { data: departments, isLoading, error } = useDepartments();
  const { data: selectedDepartment, isLoading: isLoadSelectedDep } =
    useDepartmentByCode(selectedDeptCode || "");

  const handleOpenCreate = () => {
    setCurrentDept(null);
    setDeptToDelete(null);
    setParentDeptId(null);
    setOpenFormDialog(true);
  };

  const handleDelete = (code: string, name: string) => {
    setOpenFormDialog(false);
    setCurrentDept(null);
    setParentDeptId(null);
    setDeptToDelete({ code, name });
    setOpenDeleteDialog(true);
  };

  const handleEdit = (dept: DepartmentDTO) => {
    setDeptToDelete(null);
    setParentDeptId(null);
    setCurrentDept(dept);
    setOpenFormDialog(true);
  };

  const handleCreateSubDept = (parentCode: any) => {
    setDeptToDelete(null);
    setCurrentDept(null);
    setParentDeptId(parentCode);
    setOpenFormDialog(true);
  };

  const handleSelectDept = (code: string) => {
    setSelectedDeptCode(code);
    setIsSidebarOpen(false);
  };

  useEffect(() => {
    departments && setSelectedDeptCode(departments[0]?.code);
  }, [departments]);

  if (isLoading || (!departments && !error)) {
    return <AppCenterLoading descrption="Carregando departamentos..." />;
  }

  if (error) throw error;
  const departmentTree = buildTree(departments as any);
  const filteredTree = filterTree(departmentTree, searchTerm);

  const tabs: IGRPTabItem[] = [
    {
      label: "Perfis (Roles)",
      value: "roles",
      content: <RolesListTree departmentCode={selectedDeptCode ?? ""} />,
    },
    {
      label: "Permissões",
      value: "permissions",
      content: <PermissionList departmentCode={selectedDeptCode ?? ""} />,
    },
    {
      label: "Menus",
      value: "menus",
      content: <MenuPermissions departmentCode={selectedDeptCode ?? ""} />,
    },
  ];

  return (
    <div className="flex flex-col overflow-hidden">
      <div className="block! lg:hidden! mb-4">
        <IGRPButtonPrimitive
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          variant="outline"
          className="w-full! cursor-pointer"
        >
          <IGRPIcon
            iconName={isSidebarOpen ? "X" : "Menu"}
            className="w-4 h-4"
            strokeWidth={2}
          />
          {isSidebarOpen ? "Fechar" : "Departamentos"}
        </IGRPButtonPrimitive>
      </div>

      <div className="flex h-full">
        <div
          className={`
            ${isSidebarOpen ? "block!" : "hidden!"} lg:block!
            fixed! lg:relative! inset-0! lg:inset-auto!
            z-50! lg:z-auto!
            w-full! lg:w-80!
            bg-background!
            overflow-y-auto!
            flex pr-0! lg:pr-2! border-accent flex-col
            p-4! lg:p-0!
          `}
        >
          <div className="flex! lg:hidden! justify-end mb-2">
            <IGRPButtonPrimitive
              onClick={() => setIsSidebarOpen(false)}
              variant="ghost"
              size="sm"
              className="cursor-pointer"
            >
              <IGRPIcon iconName="X" className="w-5 h-5" strokeWidth={2} />
            </IGRPButtonPrimitive>
          </div>

          <div className="flex flex-col min-w-0">
            <h2 className="text-xl font-bold tracking-tight truncate">
              Gestão de Departamentos
            </h2>

            <p className="text-muted-foreground text-sm mb-4">
              Ver e gerir todos os departamentos do sistema.
            </p>

            <ButtonLink
              onClick={handleOpenCreate}
              icon="Plus"
              href="#"
              label="Novo Departamento"
            />
          </div>

          <div className="mt-4">
            <div className="relative">
              <IGRPIcon
                iconName="Search"
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground"
              />
              <IGRPInputPrimitive
                type="text"
                placeholder="Pesquisar departamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-background pl-8"
              />
            </div>
          </div>

          <div className="flex-1 mt-3 overflow-y-auto">
            {filteredTree.map((dept) => (
              <DepartmentTreeItem
                expandedDepts={expandedDepts}
                setExpandedDepts={setExpandedDepts}
                setSelectedDeptCode={setSelectedDeptCode}
                selectedDeptCode={selectedDeptCode}
                handleEdit={handleEdit}
                handleCreateSubDept={handleCreateSubDept}
                handleDelete={handleDelete}
                key={dept.code}
                dept={dept}
              />
            ))}
          </div>
        </div>

        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div
            className="fixed! inset-0! bg-black/50! z-40! lg:hidden!"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          {isLoadSelectedDep && (
            <AppCenterLoading descrption="Carregando departamentos..." />
          )}
          {!isLoadSelectedDep && selectedDepartment && (
            <div className="container mx-auto px-0 md:px-6!">
              <div className="flex flex-col lg:flex-row! items-start justify-between mb-6 gap-4">
                <div className="w-full! lg:w-auto!">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-xl font-bold">
                      {selectedDepartment.name}
                    </h1>

                    <IGRPBadgePrimitive
                      className={getStatusColor(
                        selectedDepartment.status || "ACTIVE",
                      )}
                    >
                      {selectedDepartment.status}
                    </IGRPBadgePrimitive>
                  </div>
                  <div className="flex items-center">
                    <span className="text-muted-foreground text-xs">
                      #{selectedDepartment.code}
                    </span>
                    <CopyToClipboard value={selectedDepartment?.code || ""} />
                  </div>

                  <p className="text-muted-foreground text-sm">
                    {selectedDepartment?.description || "Sem descrição."}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row! w-full! lg:w-auto! gap-2">
                  <IGRPButtonPrimitive
                    onClick={() => handleEdit(selectedDepartment as any)}
                    variant="outline"
                    className="cursor-pointer w-full! sm:w-auto!"
                  >
                    <IGRPIcon
                      iconName="Pencil"
                      className="w-4 h-4"
                      strokeWidth={2}
                    />
                    Editar
                  </IGRPButtonPrimitive>

                  <IGRPButtonPrimitive
                    variant="outline"
                    onClick={() => setShowAppsModal(true)}
                    className="gap-2 cursor-pointer w-full! sm:w-auto!"
                  >
                    <IGRPIcon
                      iconName="AppWindow"
                      className="w-4 h-4"
                      strokeWidth={2}
                    />
                    Gerenciar Apps
                  </IGRPButtonPrimitive>
                </div>
              </div>

              <IGRPTabs
                defaultValue="roles"
                items={tabs}
                className="min-w-0"
                tabContentClassName="px-0"
              />
            </div>
          )}
        </div>
      </div>

      <DepartmentFormDialog
        open={openFormDialog}
        onOpenChange={setOpenFormDialog}
        department={currentDept}
        parentDeptId={parentDeptId}
      />

      {deptToDelete && (
        <DepartmentDeleteDialog
          open={openDeleteDialog}
          onOpenChange={setOpenDeleteDialog}
          deptToDelete={deptToDelete}
        />
      )}

      <ManageAppsModal
        departmentCode={selectedDeptCode ?? ""}
        open={showAppsModal}
        onOpenChange={setShowAppsModal}
      />
    </div>
  );
}
