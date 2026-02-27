"use client";

import {
  cn,
  IGRPAlertDialogPrimitive,
  IGRPAlertDialogContentPrimitive,
  IGRPAlertDialogHeaderPrimitive,
  IGRPAlertDialogTitlePrimitive,
  IGRPAlertDialogDescriptionPrimitive,
  IGRPAlertDialogFooterPrimitive,
  IGRPBadgePrimitive,
  IGRPButtonPrimitive,
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
  IGRPSwitchPrimitive,
  useIGRPToast,
  IGRPButton,
  IGRPScrollAreaPrimitive,
} from "@igrp/igrp-framework-react-design-system";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  useAddMenusToDepartment,
  useDepartmentAvailableMenus,
  useDepartmentMenus,
  useRemoveMenusFromDepartment,
} from "../../use-departments";
import { MenuEntryDTO } from "@igrp/platform-access-management-client-ts";
import { buildMenuTree } from "../../dept-lib";
import { getMenuIcon } from "@/lib/utils";
import { useApplications } from "@/features/applications/use-applications";

interface ManageMenusModalProps {
  departmentCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type MenuWithChildren = MenuEntryDTO & {
  children?: MenuWithChildren[];
  isAssigned?: boolean;
};

export function ManageMenusModal({
  departmentCode,
  open,
  onOpenChange,
}: ManageMenusModalProps) {
  const { igrpToast } = useIGRPToast();

  const [selectedApp, setSelectedApp] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [processingMenu, setProcessingMenu] = useState<string | null>(null);
  const [menuToRemove, setMenuToRemove] = useState<{
    code: string;
    name: string;
  } | null>(null);

  const { data: availableMenus, isLoading: loadingAvailable } =
    useDepartmentAvailableMenus(selectedApp, departmentCode || "");
  const { data: assignedMenus, isLoading: loadingAssigned } =
    useDepartmentMenus(selectedApp, departmentCode || "");

  const addMenusMutation = useAddMenusToDepartment();
  const removeMenusMutation = useRemoveMenusFromDepartment();

  const { data: assignedApps, isLoading: loadingApps } = useApplications({
    departmentCode: departmentCode || "",
  });

  const loading = loadingAvailable || loadingAssigned;

  const seenMenusRef = useRef(new Map());

  useEffect(() => {
    if (availableMenus) {
      availableMenus.forEach((menu) => {
        seenMenusRef.current.set(menu.code, menu);
      });
    }
    if (assignedMenus) {
      assignedMenus.forEach((menu) => {
        seenMenusRef.current.set(menu.code, menu);
      });
    }
  }, [availableMenus, assignedMenus]);

  useEffect(() => {
    if (open) {
      setSearchTerm("");
      setSelectedApp("");
    }
  }, [open]);

  const assignedCodes = new Set(assignedMenus?.map((menu) => menu.code) || []);

  const allMenus = useMemo(() => {
    const menusArray = Array.from(seenMenusRef.current.values()).map(
      (menu) => ({
        ...menu,
        isAssigned: assignedCodes.has(menu.code),
      }),
    );

    return menusArray.sort((a, b) => a.name.localeCompare(b.name, "pt"));
  }, [assignedCodes, availableMenus, assignedMenus]);

  const appsFromMenus = useMemo(() => {
    if (allMenus.length === 0) return [];
    const uniqueAppCodes = new Set(
      allMenus.map((menu) => menu.applicationCode),
    );
    return Array.from(uniqueAppCodes)
      .map((appCode) => ({
        code: appCode,
        name: appCode,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt"));
  }, [allMenus]);

  useEffect(() => {
    if (open && appsFromMenus.length > 0 && !selectedApp) {
      setSelectedApp(appsFromMenus[0].code);
    }
  }, [open, appsFromMenus, selectedApp]);

  useEffect(() => {
    if (open) {
      setSearchTerm("");
    }
  }, [open]);

  useEffect(() => {
    if (assignedApps && assignedApps.length > 0 && !selectedApp) {
      const sortedApps = [...assignedApps].sort((a, b) =>
        a.name.localeCompare(b.name, "pt"),
      );
      setSelectedApp(sortedApps[0].code);
    }
  }, [assignedApps, selectedApp]);

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

  const handleToggleMenu = async (
    menuCode: string,
    currentlyAssigned: boolean,
  ) => {
    if (currentlyAssigned) {
      const menu = allMenus.find((m) => m.code === menuCode);
      setMenuToRemove({ code: menuCode, name: menu?.name || menuCode });
    } else {
      await handleAddMenu(menuCode);
    }
  };

  const handleAddMenu = async (menuCode: string) => {
    setProcessingMenu(menuCode);
    try {
      const response = await addMenusMutation.mutateAsync({
        appCode: selectedApp,
        departmentCode,
        menuCodes: [menuCode],
      });

      if (!response.success) {
        throw new Error(response.error);
      }

      igrpToast({
        type: "success",
        title: "Menu adicionado",
        description: "O menu foi adicionado com sucesso.",
      });
    } catch (error) {
      igrpToast({
        type: "error",
        title: "Erro ao adicionar",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
      });
    } finally {
      setProcessingMenu(null);
    }
  };

  const handleConfirmRemove = async () => {
    if (!menuToRemove) return;

    setProcessingMenu(menuToRemove.code);
    try {
      const result = await removeMenusMutation.mutateAsync({
        appCode: selectedApp,
        departmentCode,
        menuCodes: [menuToRemove.code],
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      igrpToast({
        type: "success",
        title: "Menu removido",
        description: "O menu foi removido com sucesso.",
      });

      setMenuToRemove(null);
    } catch (error) {
      igrpToast({
        type: "error",
        title: "Erro ao remover",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
      });
    } finally {
      setProcessingMenu(null);
    }
  };

  const filteredMenus = useMemo(() => {
    let filtered = allMenus;

    if (selectedApp) {
      filtered = filtered.filter(
        (menu) => menu.applicationCode === selectedApp,
      );
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (menu) =>
          menu.name.toLowerCase().includes(term) ||
          menu.code.toLowerCase().includes(term) ||
          menu.url?.toLowerCase().includes(term),
      );
    }

    return filtered;
  }, [allMenus, selectedApp, searchTerm]);

  const menuTree = useMemo(() => {
    return buildMenuTree(filteredMenus);
  }, [filteredMenus]);

  const MenuTreeItem = ({
    menu,
    level = 0,
  }: {
    menu: MenuWithChildren;
    level?: number;
  }) => {
    const hasChildren = menu.children && menu.children.length > 0;
    const isExpanded = expandedMenus.has(menu.code);
    const isAssigned = menu.isAssigned || false;

    return (
      <>
        <div
          className={cn(
            "group relative rounded-lg border transition-all duration-200",
            level > 0 && "ml-6",
            isAssigned
              ? "bg-primary/5 border-primary/20 hover:border-primary/40 hover:bg-primary/10"
              : "bg-muted/30 border-muted hover:border-accent hover:bg-muted/50",
          )}
        >
          <div className="flex items-center gap-3 p-3">
            {hasChildren && (
              <button
                onClick={() => toggleExpand(menu.code)}
                className="w-8 h-8 flex items-center justify-center hover:bg-accent rounded transition-colors shrink-0"
              >
                <IGRPIcon
                  iconName="ChevronRight"
                  className={cn(
                    "w-4 h-4 transition-transform",
                    isExpanded && "rotate-90",
                  )}
                  strokeWidth={2}
                />
              </button>
            )}

            <div
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-lg shrink-0 transition-colors",
                isAssigned
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <IGRPIcon
                iconName={getMenuIcon(menu.type)}
                className="w-5 h-5"
                strokeWidth={2}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h4 className="font-semibold text-sm truncate">{menu.name}</h4>
                <IGRPBadgePrimitive
                  variant={isAssigned ? "default" : "secondary"}
                  className="text-[10px] px-1.5 py-0.5 shrink-0"
                >
                  {menu.applicationCode}
                </IGRPBadgePrimitive>
              </div>
              {menu.url && (
                <p className="text-xs text-muted-foreground truncate">
                  {menu.url}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="flex flex-col items-end gap-0.5">
                <span
                  className={cn(
                    "text-[10px] font-medium uppercase tracking-wider transition-colors",
                    isAssigned ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {isAssigned ? "Adicionado" : "Disponível"}
                </span>
                {isAssigned && (
                  <div className="flex items-center gap-1 text-[10px] text-primary/70">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    Ativo
                  </div>
                )}
              </div>
              <IGRPSwitchPrimitive
                checked={isAssigned}
                onCheckedChange={() => handleToggleMenu(menu.code, isAssigned)}
                disabled={processingMenu !== null}
                className={cn(
                  "data-[state=checked]:bg-green-200",
                  processingMenu === menu.code && "opacity-50",
                )}
              />
            </div>
          </div>

          {processingMenu === menu.code && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] rounded-lg flex items-center justify-center">
              <div className="flex items-center gap-2 text-sm font-medium">
                <IGRPIcon
                  iconName="LoaderCircle"
                  className="w-4 h-4 animate-spin"
                  strokeWidth={2}
                />
                Processando...
              </div>
            </div>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-2 space-y-2">
            {menu.children?.map((child) => (
              <MenuTreeItem key={child.code} menu={child} level={level + 1} />
            ))}
          </div>
        )}
      </>
    );
  };

  const sortedApps = useMemo(() => {
    if (!assignedApps) return [];
    return [...assignedApps].sort((a, b) => a.name.localeCompare(b.name, "pt"));
  }, [assignedApps]);

  return (
    <>
      <IGRPDialogPrimitive open={open} onOpenChange={onOpenChange}>
        <IGRPDialogContentPrimitive className="sm:min-w-2xl ! max-h-[85vh] overflow-hidden flex flex-col">
          <IGRPDialogHeaderPrimitive>
            <IGRPDialogTitlePrimitive className="flex items-center gap-2">
              <IGRPIcon iconName="Menu" className="w-5 h-5" strokeWidth={2} />
              Gerenciar Menus
            </IGRPDialogTitlePrimitive>
            <IGRPDialogDescriptionPrimitive>
              Adicione ou remova menus do departamento com um clique.
            </IGRPDialogDescriptionPrimitive>
          </IGRPDialogHeaderPrimitive>

          <div className="flex flex-col sm:flex-row gap-3 pb-4">
            <div className="flex-1 relative">
              <IGRPIcon
                iconName="Search"
                className="absolute left-2.5 top-2.5 size-4 text-muted-foreground"
              />
              <IGRPInputPrimitive
                type="search"
                placeholder="Pesquisar por nome, código ou URL..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="">
              <IGRPSelectPrimitive
                value={selectedApp}
                onValueChange={setSelectedApp}
                disabled={loadingApps}
              >
                <IGRPSelectTriggerPrimitive className="h-10">
                  <IGRPSelectValuePrimitive placeholder="Todas aplicações" />
                </IGRPSelectTriggerPrimitive>
                <IGRPSelectContentPrimitive>
                  {loadingApps && (
                    <IGRPSelectItemPrimitive value="loading">
                      Carregando...
                    </IGRPSelectItemPrimitive>
                  )}
                  {sortedApps.map((app) => (
                    <IGRPSelectItemPrimitive key={app.code} value={app.code}>
                      <div className="flex items-center gap-2">
                        <IGRPIcon
                          iconName="AppWindow"
                          className="w-4 h-4"
                          strokeWidth={2}
                        />
                        {app.name}
                      </div>
                    </IGRPSelectItemPrimitive>
                  ))}
                </IGRPSelectContentPrimitive>
              </IGRPSelectPrimitive>
            </div>
          </div>

          <IGRPScrollAreaPrimitive className="h-[95vh] w-full ">
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <IGRPSkeletonPrimitive key={i} className="h-20 rounded-lg" />
                ))}
              </div>
            ) : menuTree.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <IGRPIcon
                  iconName="Menu"
                  className="w-16 h-16 mb-4 opacity-20"
                  strokeWidth={1.5}
                />
                <p className="font-semibold text-lg">Nenhum menu encontrado</p>
                <p className="text-sm mt-1">
                  {searchTerm || selectedApp
                    ? "Tente ajustar os filtros de pesquisa"
                    : "Não há menus disponíveis"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {menuTree.map((menu) => (
                  <MenuTreeItem key={menu.code} menu={menu} />
                ))}
              </div>
            )}
          </IGRPScrollAreaPrimitive>

          <div className="flex justify-between items-center py-4 ">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">
                {filteredMenus.filter((m) => m.isAssigned).length}
              </span>{" "}
              de <span className="font-medium">{filteredMenus.length}</span>{" "}
              menus adicionados
            </div>

            <IGRPButtonPrimitive
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={processingMenu !== null}
              className="gap-2"
            >
              <IGRPIcon iconName="X" className="w-4 h-4" strokeWidth={2} />
              Fechar
            </IGRPButtonPrimitive>
          </div>
        </IGRPDialogContentPrimitive>
      </IGRPDialogPrimitive>

      <IGRPAlertDialogPrimitive
        open={!!menuToRemove}
        onOpenChange={(open) => !open && setMenuToRemove(null)}
      >
        <IGRPAlertDialogContentPrimitive>
          <IGRPAlertDialogHeaderPrimitive>
            <IGRPAlertDialogTitlePrimitive className="flex items-center gap-2">
              <IGRPIcon
                iconName="AlertTriangle"
                className="w-5 h-5 text-destructive"
                strokeWidth={2}
              />
              Remover Menu
            </IGRPAlertDialogTitlePrimitive>
            <IGRPAlertDialogDescriptionPrimitive>
              Tem certeza que deseja remover o menu{" "}
              <strong className="text-foreground">{menuToRemove?.name}</strong>{" "}
              deste departamento? Esta ação não pode ser desfeita.
            </IGRPAlertDialogDescriptionPrimitive>
          </IGRPAlertDialogHeaderPrimitive>
          <IGRPAlertDialogFooterPrimitive>
            <IGRPButton
              disabled={processingMenu !== null}
              variant="outline"
              onClick={() => {
                setMenuToRemove(null);
              }}
              type="button"
              showIcon
              iconPlacement="start"
              iconName="X"
            >
              Cancelar
            </IGRPButton>
            <IGRPButton
              onClick={handleConfirmRemove}
              disabled={processingMenu !== null}
              className="bg-destructive hover:bg-destructive/90 text-white gap-2"
            >
              {processingMenu ? (
                <>
                  <IGRPIcon
                    iconName="LoaderCircle"
                    className="w-4 h-4 animate-spin"
                    strokeWidth={2}
                  />
                  Removendo...
                </>
              ) : (
                <>
                  <IGRPIcon
                    iconName="Trash"
                    className="w-4 h-4"
                    strokeWidth={2}
                  />
                  Remover
                </>
              )}
            </IGRPButton>
          </IGRPAlertDialogFooterPrimitive>
        </IGRPAlertDialogContentPrimitive>
      </IGRPAlertDialogPrimitive>
    </>
  );
}
