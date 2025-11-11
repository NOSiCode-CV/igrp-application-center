"use client";

import { useApplications } from "@/features/applications/use-applications";
import {
  useAddRolesToMenu,
  useDepartmentMenus,
  useRemoveRolesFromMenu,
} from "@/features/menus/use-menus";
import { useRoles } from "@/features/roles/use-roles";
import {
  cn,
  IGRPBadgePrimitive,
  IGRPButtonPrimitive,
  IGRPCheckboxPrimitive,
  IGRPIcon,
  IGRPInputPrimitive,
  IGRPSelectPrimitive,
  IGRPSelectTriggerPrimitive,
  IGRPSelectValuePrimitive,
  IGRPSelectContentPrimitive,
  IGRPSelectItemPrimitive,
  IGRPSkeletonPrimitive,
  IGRPTableBodyPrimitive,
  IGRPTableCellPrimitive,
  IGRPTableHeaderPrimitive,
  IGRPTableHeadPrimitive,
  IGRPTablePrimitive,
  IGRPTableRowPrimitive,
  useIGRPToast,
  IGRPTooltipProviderPrimitive,
  IGRPTooltipPrimitive,
  IGRPTooltipTriggerPrimitive,
  IGRPTooltipContentPrimitive,
} from "@igrp/igrp-framework-react-design-system";
import { MenuEntryDTO } from "@igrp/platform-access-management-client-ts";
import { useState, useEffect, useMemo } from "react";
import { ManageMenusModal } from "./Modal/manage-menus-modal";
import { buildMenuTree } from "../dept-lib";

interface MenuPermissionsProps {
  departmentCode: string;
}

type MenuWithChildren = MenuEntryDTO & { children?: MenuWithChildren[] };

export function MenuPermissions({ departmentCode }: MenuPermissionsProps) {
  const { igrpToast } = useIGRPToast();

  const [selectedApp, setSelectedApp] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [menuRoleAssignments, setMenuRoleAssignments] = useState<
    Map<string, Set<string>>
  >(new Map());
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [showMenusModal, setShowMenusModal] = useState(false);

  const { data: menus, isLoading: loading } = useDepartmentMenus(
    departmentCode || ""
  );
  const { data: roles, isLoading: isLoadingRoles } = useRoles({
    departmentCode: departmentCode || "",
  });
  const { data: assignedApps, isLoading: loadingApps } = useApplications({
    departmentCode: departmentCode || "",
  });

  const addRolesMutation = useAddRolesToMenu();
  const removeRolesMutation = useRemoveRolesFromMenu();
  const saving = addRolesMutation.isPending || removeRolesMutation.isPending;

  useEffect(() => {
    if (assignedApps && assignedApps.length > 0 && !selectedApp) {
      const sortedApps = [...assignedApps].sort((a, b) =>
        a.name.localeCompare(b.name, "pt")
      );
      setSelectedApp(sortedApps[0].code);
    }
  }, [assignedApps, selectedApp]);

  useEffect(() => {
    if (menus && menus.length > 0 && menuRoleAssignments.size === 0) {
      const initialAssignments = new Map<string, Set<string>>();
      menus.forEach((menu) => {
        initialAssignments.set(menu.code, new Set(menu.roles || []));
      });
      setMenuRoleAssignments(initialAssignments);
    }
  }, [menus, menuRoleAssignments.size]);

  const handleSave = async () => {
    try {
      const promises = [];

      for (const [menuCode, currentRoles] of menuRoleAssignments.entries()) {
        const originalMenu = menus?.find((m) => m.code === menuCode);
        const originalRoles = new Set(originalMenu?.roles || []);

        const rolesToAdd = Array.from(currentRoles).filter(
          (role) => !originalRoles.has(role)
        );
        const rolesToRemove = Array.from(originalRoles).filter(
          (role) => !currentRoles.has(role)
        );

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
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  };

  const filteredByApp = selectedApp
    ? (menus || []).filter((menu) => menu.application.code === selectedApp)
    : menus || [];

  const filteredMenus = filteredByApp.filter((menu) => {
    if (!searchTerm) return true;
    return (
      menu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      menu.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const menuTree = buildMenuTree(filteredMenus as MenuWithChildren[]);

  const getColumnCheckState = (roleCode: string) => {
    const visibleMenuCodes = filteredMenus.map((m) => m.code);
    const menusWithRole = visibleMenuCodes.filter((code) =>
      menuRoleAssignments.get(code)?.has(roleCode)
    );

    if (menusWithRole.length === 0) return false;
    if (menusWithRole.length === visibleMenuCodes.length) return true;
    return "indeterminate";
  };

  const toggleAllMenusForRole = (roleCode: string) => {
    const visibleMenuCodes = filteredMenus.map((m) => m.code);
    const currentState = getColumnCheckState(roleCode);

    setMenuRoleAssignments((prev) => {
      const newMap = new Map(prev);

      visibleMenuCodes.forEach((menuCode) => {
        const currentRoles = new Set(newMap.get(menuCode) || []);

        if (currentState === true) {
          currentRoles.delete(roleCode);
        } else {
          currentRoles.add(roleCode);
        }

        newMap.set(menuCode, currentRoles);
      });

      return newMap;
    });
  };

  const toggleMenuRole = (menuCode: string, roleCode: string) => {
    setMenuRoleAssignments((prev) => {
      const newMap = new Map(prev);
      const currentRoles = new Set(newMap.get(menuCode) || []);

      if (currentRoles.has(roleCode)) {
        currentRoles.delete(roleCode);
      } else {
        currentRoles.add(roleCode);
      }

      newMap.set(menuCode, currentRoles);
      return newMap;
    });
  };

  const hasChanges = Array.from(menuRoleAssignments.entries()).some(
    ([menuCode, currentRoles]) => {
      const originalMenu = menus?.find((m) => m.code === menuCode);
      const originalRoles = new Set(originalMenu?.roles || []);

      if (currentRoles.size !== originalRoles.size) return true;

      for (const role of currentRoles) {
        if (!originalRoles.has(role)) return true;
      }

      return false;
    }
  );

  const sortedApps = useMemo(() => {
    if (!assignedApps) return [];
    return [...assignedApps].sort((a, b) => a.name.localeCompare(b.name, "pt"));
  }, [assignedApps]);

  const getMenuIcon = (type: string) => {
    switch (type) {
      case "FOLDER":
        return "Folder";
      case "EXTERNAL_PAGE":
        return "ExternalLink";
      case "MENU_PAGE":
        return "FileText";
      default:
        return "FileText";
    }
  };

  const toggleExpand = (menuCode: string) => {
    setExpandedMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(menuCode)) {
        newSet.delete(menuCode);
      } else {
        newSet.add(menuCode);
      }
      return newSet;
    });
  };

  const MenuTreeRow = ({
    menu,
    level = 0,
  }: {
    menu: MenuWithChildren;
    level?: number;
  }) => {
    const hasChildren = menu.children && menu.children.length > 0;
    const isExpanded = expandedMenus.has(menu.code);

    return (
      <>
        <IGRPTableRowPrimitive className={cn(level > 0 && "bg-muted/20")}>
          <IGRPTableCellPrimitive>
            <div
              className="flex items-center gap-2"
              style={{ paddingLeft: `${level * 1.5}rem` }}
            >
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(menu.code)}
                  className="w-5 h-5 flex items-center justify-center hover:bg-accent rounded transition-colors shrink-0"
                >
                  <IGRPIcon
                    iconName="ChevronRight"
                    className={cn(
                      "w-4 h-4 transition-transform",
                      isExpanded && "rotate-90"
                    )}
                    strokeWidth={2}
                  />
                </button>
              ) : (
                <div className="w-5 shrink-0" />
              )}

              <IGRPIcon
                iconName={getMenuIcon(menu.type)}
                className="w-4 h-4 text-primary shrink-0"
                strokeWidth={2}
              />

              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{menu.name}</div>
                {menu.url && (
                  <div className="text-xs text-muted-foreground truncate">
                    {menu.url}
                  </div>
                )}
              </div>
            </div>
          </IGRPTableCellPrimitive>

          {roles?.map((role) => (
            <IGRPTableCellPrimitive
              key={role.name}
              className="text-center border-l"
            >
              <div className="flex items-center justify-center">
                <IGRPCheckboxPrimitive
                  checked={menuRoleAssignments.get(menu.code)?.has(role.name)}
                  onCheckedChange={() => toggleMenuRole(menu.code, role.name)}
                />
              </div>
            </IGRPTableCellPrimitive>
          ))}
        </IGRPTableRowPrimitive>

        {hasChildren &&
          isExpanded &&
          menu.children?.map((child) => (
            <MenuTreeRow key={child.code} menu={child} level={level + 1} />
          ))}
      </>
    );
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="leading-none font-semibold mb-1">Menus</div>
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
              <span>Gerenciar Menus</span>
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

          {sortedApps.length !== 0 && (
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
                  {sortedApps.map((app) => (
                    <IGRPSelectItemPrimitive key={app.code} value={app.code}>
                      <div className="flex items-center gap-2">
                        <IGRPIcon
                          iconName="AppWindow"
                          className="w-4 h-4"
                          strokeWidth={2}
                        />
                        <span>{app.name}</span>
                      </div>
                    </IGRPSelectItemPrimitive>
                  ))}
                </IGRPSelectContentPrimitive>
              </IGRPSelectPrimitive>
            </div>
          )}
        </div>

        {loading || isLoadingRoles ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <IGRPSkeletonPrimitive key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : menuTree.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border rounded-lg">
            <IGRPIcon
              iconName="Menu"
              className="w-16 h-16 mb-4 opacity-30"
              strokeWidth={1.5}
            />
            <p className="text-lg font-medium mb-2">Nenhum menu encontrado</p>
            <p className="text-sm mb-4">
              {searchTerm
                ? "Tente ajustar os termos de pesquisa"
                : "Configure aplicações e menus primeiro"}
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
                  <IGRPIcon
                    iconName="Filter"
                    className="w-3 h-3"
                    strokeWidth={2}
                  />
                  Filtrado por:{" "}
                  {sortedApps.find((app) => app.code === selectedApp)?.name ||
                    selectedApp}
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
                        className="text-center whitespace-nowrap w-36 border-l"
                      >
                        <div className="flex flex-col items-center gap-2 py-2">
                          <div className="flex items-center gap-2">
                            {/* <IGRPIcon
                              iconName="ShieldCheck"
                              className="w-4 h-4 text-primary"
                              strokeWidth={2}
                            /> */}
                            <IGRPTooltipProviderPrimitive delayDuration={350}>
                              <IGRPTooltipPrimitive>
                                <IGRPTooltipTriggerPrimitive asChild>
                                  <button
                                    onClick={() =>
                                      toggleAllMenusForRole(role.name)
                                    }
                                    className="group flex items-center gap-1 hover:bg-primary/10 px-2 py-1 rounded transition-colors"
                                    
                                  >
                                    <IGRPIcon
                                      iconName={
                                        getColumnCheckState(role.name) === true
                                          ? "Check"
                                          : getColumnCheckState(role.name) ===
                                            "indeterminate"
                                          ? "MinusSquare"
                                          : "Square"
                                      }
                                      className={cn(
                                        "w-4 h-4 transition-colors",
                                        getColumnCheckState(role.name) === true
                                          ? "text-primary"
                                          : getColumnCheckState(role.name) ===
                                            "indeterminate"
                                          ? "text-primary/60"
                                          : "text-muted-foreground group-hover:text-primary"
                                      )}
                                      strokeWidth={2}
                                    />
                                    <span className="sr-only">
                                      Selecionar todos
                                    </span>
                                  </button>
                                </IGRPTooltipTriggerPrimitive>
                                <IGRPTooltipContentPrimitive className="px-2 py-1 text-xs">
                                  Marcar/desmarcar todos
                                </IGRPTooltipContentPrimitive>
                              </IGRPTooltipPrimitive>
                            </IGRPTooltipProviderPrimitive>
                          </div>
                          <span
                            className="text-xs font-semibold truncate max-w-full px-1"
                            title={role.name}
                          >
                            {role.name.split(".").pop() || role.name}
                          </span>
                        </div>
                      </IGRPTableHeadPrimitive>
                    ))}
                  </IGRPTableRowPrimitive>
                </IGRPTableHeaderPrimitive>

                <IGRPTableBodyPrimitive>
                  {menuTree.map((menu) => (
                    <MenuTreeRow key={menu.code} menu={menu} />
                  ))}
                </IGRPTableBodyPrimitive>
              </IGRPTablePrimitive>
            </div>

            <div className="flex justify-between items-center pt-2">
              <div className="text-sm text-muted-foreground">
                {menus?.length} menu{menus?.length !== 1 ? "s" : ""} •{" "}
                {roles?.length || 0} perf{roles?.length !== 1 ? "is" : "il"}
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
                  <IGRPIcon
                    iconName="X"
                    className="w-4 h-4 mr-1"
                    strokeWidth={2}
                  />
                  Cancelar
                </IGRPButtonPrimitive>

                <IGRPButtonPrimitive
                  onClick={handleSave}
                  disabled={saving || !hasChanges}
                  className="gap-2"
                >
                  {saving ? (
                    <>
                      <IGRPIcon
                        iconName="Loader"
                        className="w-4 h-4 animate-spin"
                        strokeWidth={2}
                      />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <IGRPIcon
                        iconName="Save"
                        className="w-4 h-4"
                        strokeWidth={2}
                      />
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
