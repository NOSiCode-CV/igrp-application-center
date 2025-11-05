"use client";

import { useApplications } from "@/features/applications/use-applications";
import { useAddRolesToMenu, useDepartmentMenus, useRemoveRolesFromMenu } from "@/features/menus/use-menus";
import { useRoles } from "@/features/roles/use-roles";
import {
  cn,
  IGRPBadgePrimitive,
  IGRPButtonPrimitive,
  IGRPIcon,
  IGRPInputPrimitive,
  IGRPSelectPrimitive,
  IGRPSelectTriggerPrimitive,
  IGRPSelectValuePrimitive,
  IGRPSelectContentPrimitive,
  IGRPSelectItemPrimitive,
  IGRPSkeletonPrimitive,
  IGRPTableBodyPrimitive,
  IGRPTableHeaderPrimitive,
  IGRPTableHeadPrimitive,
  IGRPTablePrimitive,
  IGRPTableRowPrimitive,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import { MenuEntryDTO } from "@igrp/platform-access-management-client-ts";
import { useState, useEffect } from "react";
import { ManageAppsModal } from "./Modal/manage-apps-modal";
import { MenuTreeRow } from "./dept-menu-tree";
import { buildMenuTree } from "../dept-lib";
import { ManageMenusModal } from "./Modal/manage-menus-modal";

interface MenuPermissionsProps {
  departmentCode: string;
}

export type MenuWithChildren = MenuEntryDTO & { children?: MenuWithChildren[] };

export function MenuPermissions({ 
  departmentCode,
}: MenuPermissionsProps) {
  const { igrpToast } = useIGRPToast();
  
  const [selectedApp, setSelectedApp] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [menuRoleAssignments, setMenuRoleAssignments] = useState<Map<string, Set<string>>>(new Map());
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  
  const [showMenusModal, setShowMenusModal] = useState(false);
  
  const { data: menus, isLoading: loading } = useDepartmentMenus(departmentCode || "");
  const { data: roles, isLoading: isLoadingRoles } = useRoles({ departmentCode: departmentCode || "" });
  const { data: assignedApps, isLoading: loadingApps } = useApplications({ departmentCode: departmentCode || "" });
  
  const addRolesMutation = useAddRolesToMenu();
  const removeRolesMutation = useRemoveRolesFromMenu();
  const saving = addRolesMutation.isPending || removeRolesMutation.isPending;

  useEffect(() => {
    if (menus && menus.length > 0 && menuRoleAssignments.size === 0) {
      const initialAssignments = new Map<string, Set<string>>();
      menus.forEach((menu) => {
        initialAssignments.set(menu.code, new Set(menu.roles || []));
      });
      setMenuRoleAssignments(initialAssignments);
    }
  }, [menus]);

  const handleSave = async () => {
    try {
      const promises = [];

      for (const [menuCode, currentRoles] of menuRoleAssignments.entries()) {
        const originalMenu = menus?.find(m => m.code === menuCode);
        const originalRoles = new Set(originalMenu?.roles || []);
        
        const rolesToAdd = Array.from(currentRoles).filter(role => !originalRoles.has(role));
        const rolesToRemove = Array.from(originalRoles).filter(role => !currentRoles.has(role));
        
        if (rolesToAdd.length > 0) {
          promises.push(
            addRolesMutation.mutateAsync({
              menuCode,
              roleCodes: rolesToAdd,
            })
          );
        }
        
        if (rolesToRemove.length > 0) {
          promises.push(
            removeRolesMutation.mutateAsync({
              menuCode,
              roleCodes: rolesToRemove,
            })
          );
        }
      }

      if (promises.length === 0) {
        igrpToast({
          type: "info",
          title: "Sem alterações",
          description: "Nenhuma mudança foi detectada.",
        });
        return;
      }

      await Promise.all(promises);

      igrpToast({
        type: "success",
        title: "Permissões salvas",
        description: "Os perfis foram atribuídos aos menus com sucesso.",
      });
      
    } catch (error) {
      console.error("Erro:", error);
      igrpToast({
        type: "error",
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  };


  const filteredByApp = selectedApp
    ? (menus || []).filter(menu => menu.applicationCode === selectedApp)
    : (menus || []);

  const filteredMenus = filteredByApp.filter((menu) => {
    if (!searchTerm) return true;
    return (
      menu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      menu.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const menuTree = buildMenuTree(filteredMenus as any);

  const hasChanges = Array.from(menuRoleAssignments.entries()).some(([menuCode, currentRoles]) => {
    const originalMenu = menus?.find(m => m.code === menuCode);
    const originalRoles = new Set(originalMenu?.roles || []);
    
    if (currentRoles.size !== originalRoles.size) return true;
    
    for (const role of currentRoles) {
      if (!originalRoles.has(role)) return true;
    }
    
    return false;
  });

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="leading-none font-semibold mb-1"> Menus</div>
            <div className="text-muted-foreground text-sm">
              Gerencie aplicações, menus e perfis do departamento.
            </div>
          </div>

          <div className="flex gap-2">
            
            <IGRPButtonPrimitive
              variant="outline"
              onClick={() => setShowMenusModal(true)}
              className="gap-2"
            >
              <IGRPIcon iconName="Menu" className="w-4 h-4" strokeWidth={2} />
              <span className="">Gerenciar Menus</span>
            </IGRPButtonPrimitive>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {!loading && menus && menus.length > 0 && (
            <div className="w-10/12">
              <div className="relative">
                <IGRPIcon
                  iconName="Search"
                  className="absolute left-2.5 top-2.5 size-4 text-muted-foreground"
                />
                <IGRPInputPrimitive
                  type="search"
                  placeholder="Pesquisar menu..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          )}

          {assignedApps?.length !== 0 && 
          <div className="w-2/12">
            <IGRPSelectPrimitive 
              value={selectedApp} 
              onValueChange={setSelectedApp}
              disabled={loading || loadingApps}
              
            >
              <IGRPSelectTriggerPrimitive className="w-full">
                <IGRPSelectValuePrimitive placeholder="Todas as aplicações" />
              </IGRPSelectTriggerPrimitive>
              <IGRPSelectContentPrimitive>
                {assignedApps?.map((app) => (
                  <IGRPSelectItemPrimitive key={app.code} value={app.code}>
                    <div className="flex items-center gap-2">
                      <IGRPIcon iconName="AppWindow" className="w-4 h-4" strokeWidth={2} />
                      <span>{app.name}</span>
                    </div>
                  </IGRPSelectItemPrimitive>
                ))}
              </IGRPSelectContentPrimitive>
            </IGRPSelectPrimitive>
          </div>
          }

          
        </div>

        {loading || isLoadingRoles ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <IGRPSkeletonPrimitive key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : menuTree.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border rounded-lg">
            <IGRPIcon iconName="Menu" className="w-16 h-16 mb-4 opacity-30" strokeWidth={1.5} />
            <p className="text-lg font-medium mb-2">Nenhum menu encontrado</p>
            <p className="text-sm mb-4">
              {searchTerm 
                ? "Tente ajustar os termos de pesquisa" 
                : "Configure aplicações e menus primeiro"
              }
            </p>
            <div className="flex gap-2">
              <IGRPButtonPrimitive
                variant="outline"
                onClick={() => setShowMenusModal(true)}
                className="gap-2"
              >
                <IGRPIcon iconName="Menu" className="w-4 h-4" strokeWidth={2} />
                Gerenciar Menus
              </IGRPButtonPrimitive>
            </div>
          </div>
        ) : (
          <>
            {selectedApp && (
              <div className="flex items-center gap-2">
                <IGRPBadgePrimitive variant="secondary" className="gap-1">
                  <IGRPIcon iconName="Filter" className="w-3 h-3" strokeWidth={2} />
                  Filtrado por: {selectedApp}
                </IGRPBadgePrimitive>
                <button
                  onClick={() => setSelectedApp("")}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Limpar
                </button>
              </div>
            )}

            <div className="rounded-md border overflow-x-auto">
              <IGRPTablePrimitive>
                <IGRPTableHeaderPrimitive>
                  <IGRPTableRowPrimitive>
                    <IGRPTableHeadPrimitive className="whitespace-nowrap min-w-[320px]">
                      Menu
                    </IGRPTableHeadPrimitive>
                    
                    {roles?.map((role) => (
                      <IGRPTableHeadPrimitive 
                        key={role.name} 
                        className="text-center whitespace-nowrap w-36"
                      >
                        <div className="flex flex-col items-center gap-1 py-1">
                          <IGRPIcon iconName="ShieldCheck" className="w-4 h-4 text-primary" strokeWidth={2} />
                          <span className="text-xs font-semibold truncate max-w-full px-1" title={role.name}>
                            {role.name.split('.').pop() || role.name}
                          </span>
                        </div>
                      </IGRPTableHeadPrimitive>
                    ))}
                  </IGRPTableRowPrimitive>
                </IGRPTableHeaderPrimitive>
                
                <IGRPTableBodyPrimitive>
                  {menuTree.map((menu) => (
                    <MenuTreeRow 
                      key={menu.code} 
                      menu={menu} 
                      menuRoleAssignments={menuRoleAssignments}
                      setMenuRoleAssignments={setMenuRoleAssignments}
                      roles={roles || []}
                      expandedMenus={expandedMenus} 
                      setExpandedMenus={setExpandedMenus}
                    />
                  ))}
                </IGRPTableBodyPrimitive>
              </IGRPTablePrimitive>
            </div>

            <div className="flex justify-between items-center pt-2">
              <div className="text-sm text-muted-foreground">
                {menus?.length} menu{menus?.length !== 1 ? 's' : ''} • {roles?.length || 0} perf{roles?.length !== 1 ? 'is' : 'il'}
              </div>
              
              <div className="flex gap-2">
                <IGRPButtonPrimitive
                  variant="outline"
                  onClick={() => {
                    if (menus) {
                      const reset = new Map<string, Set<string>>();
                      menus.forEach((menu) => {
                        reset.set(menu.code, new Set(menu.roles || []));
                      });
                      setMenuRoleAssignments(reset);
                    }
                  }}
                  disabled={saving}
                >
                  <IGRPIcon iconName="X" className="w-4 h-4 mr-1" strokeWidth={2} />
                  Cancelar
                </IGRPButtonPrimitive>
                
                <IGRPButtonPrimitive
                  onClick={handleSave}
                  disabled={saving || !hasChanges}
                  className="gap-2"
                >
                  {saving ? (
                    <>
                      <IGRPIcon iconName="Loader" className="w-4 h-4 animate-spin" strokeWidth={2} />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <IGRPIcon iconName="Check" className="w-4 h-4" strokeWidth={2} />
                      Salvar Permissões
                    </>
                  )}
                </IGRPButtonPrimitive>
              </div>
            </div>
          </>
        )}
      </div>

      <ManageMenusModal
        departmentCode={departmentCode}
        open={showMenusModal}
        onOpenChange={setShowMenusModal}
      />
    </>
  );
}