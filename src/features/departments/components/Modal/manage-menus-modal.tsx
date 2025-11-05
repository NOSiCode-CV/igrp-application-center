"use client";

import {
  cn,
  IGRPBadgePrimitive,
  IGRPButtonPrimitive,
  IGRPCheckboxPrimitive,
  IGRPDialogPrimitive,
  IGRPDialogContentPrimitive,
  IGRPDialogHeaderPrimitive,
  IGRPDialogTitlePrimitive,
  IGRPDialogDescriptionPrimitive,
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
  IGRPTabsPrimitive,
  IGRPTabsListPrimitive,
  IGRPTabsTriggerPrimitive,
  IGRPTabsContentPrimitive,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import { useState, useEffect, useMemo } from "react";
import { useAddMenusToDepartment, useDepartmentAvailableMenus, useRemoveMenusFromDepartment } from "../../use-departments";
import { useDepartmentMenus } from "@/features/menus/use-menus";
import { MenuEntryDTO } from "@igrp/platform-access-management-client-ts";
import { buildMenuTree } from "../../dept-lib";

interface ManageMenusModalProps {
  departmentCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type MenuWithChildren = MenuEntryDTO & { children?: MenuWithChildren[] };

export function ManageMenusModal({ 
  departmentCode,
  open,
  onOpenChange
}: ManageMenusModalProps) {
  const { igrpToast } = useIGRPToast();
  
  const [selectedApp, setSelectedApp] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [menusToAdd, setMenusToAdd] = useState<Set<string>>(new Set());
  const [menusToRemove, setMenusToRemove] = useState<Set<string>>(new Set());

  const { data: availableMenus, isLoading: loadingAvailable } = useDepartmentAvailableMenus(departmentCode || "");
  const { data: assignedMenus, isLoading: loadingAssigned } = useDepartmentMenus(departmentCode || "");
  const addMenusMutation = useAddMenusToDepartment();
  const removeMenusMutation = useRemoveMenusFromDepartment();
  const saving = addMenusMutation.isPending || removeMenusMutation.isPending;
  const loading = loadingAvailable || loadingAssigned;

  useEffect(() => {
    if (open) {
      setMenusToAdd(new Set());
      setMenusToRemove(new Set());
      setSearchTerm("");
      setSelectedApp("");
    }
  }, [open]);

  const assignedCodes = new Set(assignedMenus?.map(menu => menu.code) || []);
  const menusNotAssigned = (availableMenus || []).filter(menu => !assignedCodes.has(menu.code));

  const appsFromMenus = useMemo(() => {
    if (!availableMenus) return [];
    const uniqueAppCodes = new Set(availableMenus.map(menu => menu.applicationCode));
    return Array.from(uniqueAppCodes).map(appCode => ({
      code: appCode,
      name: appCode,
    }));
  }, [availableMenus]);

  const toggleExpand = (menuCode: string) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(menuCode)) {
        newSet.delete(menuCode);
      } else {
        newSet.add(menuCode);
      }
      return newSet;
    });
  };

  const toggleMenuToAdd = (menuCode: string) => {
    setMenusToAdd(prev => {
      const newSet = new Set(prev);
      if (newSet.has(menuCode)) {
        newSet.delete(menuCode);
      } else {
        newSet.add(menuCode);
      }
      return newSet;
    });
  };

  const toggleMenuToRemove = (menuCode: string) => {
    setMenusToRemove(prev => {
      const newSet = new Set(prev);
      if (newSet.has(menuCode)) {
        newSet.delete(menuCode);
      } else {
        newSet.add(menuCode);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    try {
      const promises = [];

      if (menusToAdd.size > 0) {
        promises.push(
          addMenusMutation.mutateAsync({
            code: departmentCode,
            menuCodes: Array.from(menusToAdd),
          })
        );
      }

      if (menusToRemove.size > 0) {
        promises.push(
          removeMenusMutation.mutateAsync({
            code: departmentCode,
            menuCodes: Array.from(menusToRemove),
          })
        );
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
        title: "Menus atualizados",
        description: "Os menus foram atualizados com sucesso.",
      });

      onOpenChange(false);
      
    } catch (error) {
      console.error("Erro:", error);
      igrpToast({
        type: "error",
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  };

  const MenuTreeRow = ({ 
    menu, 
    level = 0,
    isAddMode = true
  }: { 
    menu: MenuWithChildren; 
    level?: number;
    isAddMode?: boolean;
  }) => {
    const hasChildren = menu.children && menu.children.length > 0;
    const isExpanded = expandedMenus.has(menu.code);
    const isSelected = isAddMode 
      ? menusToAdd.has(menu.code)
      : menusToRemove.has(menu.code);

    const getMenuIcon = (type: string) => {
      switch(type) {
        case "FOLDER": return "Folder";
        case "EXTERNAL_PAGE": return "ExternalLink";
        case "MENU_PAGE": return "FileText";
        default: return "FileText";
      }
    };

    return (
      <>
        <IGRPTableRowPrimitive className={cn(level > 0 && "bg-muted/20")}>
          <IGRPTableCellPrimitive className="text-center">
            <div className="flex items-center justify-center">
              <IGRPCheckboxPrimitive
                checked={isSelected}
                onCheckedChange={() => isAddMode ? toggleMenuToAdd(menu.code) : toggleMenuToRemove(menu.code)}
              />
            </div>
          </IGRPTableCellPrimitive>
          
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
              
              <div className="min-w-0">
                <div className="font-medium truncate">{menu.name}</div>
                {menu.url && (
                  <div className="text-xs text-muted-foreground truncate">
                    {menu.url}
                  </div>
                )}
              </div>
            </div>
          </IGRPTableCellPrimitive>

          <IGRPTableCellPrimitive>
            <IGRPBadgePrimitive 
              variant="secondary" 
              className="text-xs"
            >
              {menu.applicationCode}
            </IGRPBadgePrimitive>
          </IGRPTableCellPrimitive>
        </IGRPTableRowPrimitive>

        {hasChildren && isExpanded && menu.children?.map((child) => (
          <MenuTreeRow 
            key={child.code} 
            menu={child} 
            level={level + 1}
            isAddMode={isAddMode}
          />
        ))}
      </>
    );
  };

  const filterMenus = (menus: MenuEntryDTO[]) => {
    const filtered = selectedApp
      ? menus.filter(menu => menu.applicationCode === selectedApp)
      : menus;

    return filtered.filter((menu) => {
      if (!searchTerm) return true;
      return (
        menu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        menu.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  };

  const filteredNotAssigned = filterMenus(menusNotAssigned);
  const filteredAssigned = filterMenus(assignedMenus as any || []);
  const menuTreeNotAssigned = buildMenuTree(filteredNotAssigned);
  const menuTreeAssigned = buildMenuTree(filteredAssigned);

  const hasChanges = menusToAdd.size > 0 || menusToRemove.size > 0;

  return (
    <IGRPDialogPrimitive open={open} onOpenChange={onOpenChange}>
      <IGRPDialogContentPrimitive className="max-w-3xl! max-h-[90vh] overflow-hidden flex flex-col">
        <IGRPDialogHeaderPrimitive>
          <IGRPDialogTitlePrimitive className="flex items-center gap-2">
            <IGRPIcon iconName="Menu" className="w-5 h-5" strokeWidth={2} />
            Gerenciar Menus
          </IGRPDialogTitlePrimitive>
          <IGRPDialogDescriptionPrimitive>
            Adicione ou remova menus do departamento.
          </IGRPDialogDescriptionPrimitive>
        </IGRPDialogHeaderPrimitive>

        <div className="flex flex-col w-full sm:flex-row gap-3 pb-4">
          <div className="max-w-full w-9/12 relative">
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
          <div className="w-3/12">
            <IGRPSelectPrimitive 
              value={selectedApp} 
              onValueChange={setSelectedApp}
              disabled={loading}
            >
              <IGRPSelectTriggerPrimitive>
                <IGRPSelectValuePrimitive placeholder="Todas aplicações" />
              </IGRPSelectTriggerPrimitive>
              <IGRPSelectContentPrimitive>
                {appsFromMenus.map((app) => (
                  <IGRPSelectItemPrimitive key={app.code} value={app.code}>
                    <div className="flex items-center gap-2">
                      <IGRPIcon iconName="AppWindow" className="w-4 h-4" strokeWidth={2} />
                      {app.name}
                    </div>
                  </IGRPSelectItemPrimitive>
                ))}
              </IGRPSelectContentPrimitive>
            </IGRPSelectPrimitive>
          </div>
        </div>

        <IGRPTabsPrimitive defaultValue="add" className="flex-1 flex flex-col overflow-hidden">
          <IGRPTabsListPrimitive className="grid w-full grid-cols-2">
            <IGRPTabsTriggerPrimitive value="add" className="gap-2">
              <IGRPIcon iconName="Plus" className="w-4 h-4" strokeWidth={2} />
              Adicionar ({menusToAdd.size})
            </IGRPTabsTriggerPrimitive>
            <IGRPTabsTriggerPrimitive value="remove" className="gap-2">
              <IGRPIcon iconName="Minus" className="w-4 h-4" strokeWidth={2} />
              Remover ({menusToRemove.size})
            </IGRPTabsTriggerPrimitive>
          </IGRPTabsListPrimitive>

          <IGRPTabsContentPrimitive value="add" className="flex-1 overflow-y-auto mt-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <IGRPSkeletonPrimitive key={i} className="h-14 rounded-lg" />
                ))}
              </div>
            ) : menuTreeNotAssigned.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <IGRPIcon iconName="Menu" className="w-12 h-12 mb-3 opacity-30" strokeWidth={1.5} />
                <p className="font-medium">Nenhum menu disponível</p>
                <p className="text-sm">
                  {searchTerm 
                    ? "Tente ajustar os termos de pesquisa" 
                    : "Todos os menus já estão adicionados"
                  }
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <IGRPTablePrimitive>
                  <IGRPTableHeaderPrimitive>
                    <IGRPTableRowPrimitive>
                      <IGRPTableHeadPrimitive className="w-12 text-center" />
                      <IGRPTableHeadPrimitive>Menu</IGRPTableHeadPrimitive>
                      <IGRPTableHeadPrimitive className="w-48">Aplicação</IGRPTableHeadPrimitive>
                    </IGRPTableRowPrimitive>
                  </IGRPTableHeaderPrimitive>
                  
                  <IGRPTableBodyPrimitive>
                    {menuTreeNotAssigned.map((menu) => (
                      <MenuTreeRow key={menu.code} menu={menu} isAddMode={true} />
                    ))}
                  </IGRPTableBodyPrimitive>
                </IGRPTablePrimitive>
              </div>
            )}
          </IGRPTabsContentPrimitive>

          <IGRPTabsContentPrimitive value="remove" className="flex-1 overflow-y-auto mt-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <IGRPSkeletonPrimitive key={i} className="h-14 rounded-lg" />
                ))}
              </div>
            ) : menuTreeAssigned.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <IGRPIcon iconName="Menu" className="w-12 h-12 mb-3 opacity-30" strokeWidth={1.5} />
                <p className="font-medium">Nenhum menu adicionado</p>
                <p className="text-sm">
                  {searchTerm 
                    ? "Tente ajustar os termos de pesquisa" 
                    : "Não há menus para remover"
                  }
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <IGRPTablePrimitive>
                  <IGRPTableHeaderPrimitive>
                    <IGRPTableRowPrimitive>
                      <IGRPTableHeadPrimitive className="w-12 text-center" />
                      <IGRPTableHeadPrimitive>Menu</IGRPTableHeadPrimitive>
                      <IGRPTableHeadPrimitive className="w-48">Aplicação</IGRPTableHeadPrimitive>
                    </IGRPTableRowPrimitive>
                  </IGRPTableHeaderPrimitive>
                  
                  <IGRPTableBodyPrimitive>
                    {menuTreeAssigned.map((menu) => (
                      <MenuTreeRow key={menu.code} menu={menu} isAddMode={false} />
                    ))}
                  </IGRPTableBodyPrimitive>
                </IGRPTablePrimitive>
              </div>
            )}
          </IGRPTabsContentPrimitive>
        </IGRPTabsPrimitive>

        <div className="flex justify-between items-center px-6 py-4 border-t bg-muted/20">
          <div className="text-sm text-muted-foreground">
            {menusToAdd.size > 0 && `${menusToAdd.size} para adicionar`}
            {menusToAdd.size > 0 && menusToRemove.size > 0 && " • "}
            {menusToRemove.size > 0 && `${menusToRemove.size} para remover`}
            {!hasChanges && "Nenhuma alteração"}
          </div>
          
          <div className="flex gap-2">
            <IGRPButtonPrimitive
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
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
                  Salvar Alterações
                </>
              )}
            </IGRPButtonPrimitive>
          </div>
        </div>
      </IGRPDialogContentPrimitive>
    </IGRPDialogPrimitive>
  );
}