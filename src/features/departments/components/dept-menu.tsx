"use client";

import { useEffect, useMemo, useState } from "react";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  cn,
  IGRPIcon,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import type { MenuEntryDTO } from "@igrp/platform-access-management-client-ts";

import { AppCenterLoading } from "@/components/loading";
import {
  useAddRolesToMenu,
  useRemoveRolesFromMenu,
} from "@/features/applications/use-applications";

import { buildMenuTree } from "../dept-lib";
import {
  useDepartmentApplications,
  useDepartmentMenus,
  useRoles,
} from "../use-departments";
import { ManageMenusModal } from "./Modal/manage-menus-modal";
import MenuTreeRow from "./menu-tree-row";

interface MenuPermissionsProps {
  departmentCode: string;
}

export type MenuWithChildren = MenuEntryDTO & { children?: MenuWithChildren[] };

export function MenuPermissions({ departmentCode }: MenuPermissionsProps) {
  const { igrpToast } = useIGRPToast();

  const [selectedApp, setSelectedApp] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [menuRoleAssignments, setMenuRoleAssignments] = useState<
    Map<string, Set<string>>
  >(new Map());

  const [showMenusModal, setShowMenusModal] = useState(false);
  const [pendingAppSwitch, setPendingAppSwitch] = useState<string | null>(null);

  const { data: menus, isLoading: loading } = useDepartmentMenus(
    selectedApp,
    departmentCode || "",
  );
  const { data: assignedApps, isLoading: loadingApps } =
    useDepartmentApplications({ departmentCode: departmentCode || "" });
  const { data: roles, isLoading: isLoadingRoles } = useRoles(
    departmentCode || "",
  );

  const addRolesMutation = useAddRolesToMenu();
  const removeRolesMutation = useRemoveRolesFromMenu();
  const saving = addRolesMutation.isPending || removeRolesMutation.isPending;

  useEffect(() => {
    if (assignedApps && assignedApps.length > 0 && !selectedApp) {
      const sortedApps = [...assignedApps].sort((a, b) =>
        a.name.localeCompare(b.name, "pt"),
      );
      setSelectedApp(sortedApps[0].code);
    }
  }, [assignedApps, selectedApp]);

  useEffect(() => {
    if (menus && menus.length > 0 && menuRoleAssignments.size === 0) {
      const initialAssignments = new Map<string, Set<string>>();
      menus.forEach((menu) => {
        initialAssignments.set(
          menu.code,
          new Set(menu.roles.map((r) => r?.roleCode) || []),
        );
      });
      setMenuRoleAssignments(initialAssignments);
    }
  }, [menus, menuRoleAssignments.size]);

  const handleSave = async (): Promise<boolean> => {
    try {
      const promises = [];

      for (const [menuCode, currentRoles] of menuRoleAssignments.entries()) {
        const originalMenu = menus?.find((m) => m.code === menuCode);
        const originalRoles = new Set(
          originalMenu?.roles.map((r) => r?.roleCode) || [],
        );

        const rolesToAdd = Array.from(currentRoles).filter(
          (role) => !originalRoles.has(role),
        );
        const rolesToRemove = Array.from(originalRoles).filter(
          (role) => !currentRoles.has(role),
        );

        if (rolesToAdd.length > 0) {
          promises.push(
            addRolesMutation.mutateAsync({
              appCode: selectedApp,
              menuCode,
              departmentCode,
              roleNames: rolesToAdd,
            }),
          );
        }

        if (rolesToRemove.length > 0) {
          promises.push(
            removeRolesMutation.mutateAsync({
              appCode: selectedApp,
              menuCode,
              departmentCode,
              roleNames: rolesToRemove,
            }),
          );
        }
      }

      if (promises.length === 0) {
        igrpToast({
          type: "info",
          title: "Sem alterações",
          description: "Nenhuma mudança foi detectada.",
        });
        return true;
      }

      const results = await Promise.all(promises);

      const failed = results.find((result) => !result.success);
      if (failed) {
        throw new Error(failed.error);
      }

      igrpToast({
        type: "success",
        title: "Permissões salvas",
        description: "Os perfis foram atribuídos aos menus com sucesso.",
      });
      return true;
    } catch (error) {
      console.error("Erro:", error);
      igrpToast({
        type: "error",
        title: "Erro ao salvar",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
      });
      return false;
    }
  };

  const handleAppChange = (newAppCode: string) => {
    if (newAppCode === selectedApp) return;
    if (hasChanges) {
      setPendingAppSwitch(newAppCode);
    } else {
      setSelectedApp(newAppCode);
    }
  };

  const handleDiscardAndSwitch = () => {
    if (pendingAppSwitch != null) {
      setMenuRoleAssignments(new Map());
      setSelectedApp(pendingAppSwitch);
      setPendingAppSwitch(null);
    }
  };

  const handleSaveAndSwitch = async () => {
    const toSwitch = pendingAppSwitch;
    const ok = await handleSave();
    if (ok && toSwitch != null) {
      setSelectedApp(toSwitch);
      setPendingAppSwitch(null);
    }
  };

  const filteredByApp = selectedApp
    ? (menus || []).filter((menu) => menu.applicationCode === selectedApp)
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
      menuRoleAssignments.get(code)?.has(roleCode),
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

  const hasChanges = Array.from(menuRoleAssignments.entries()).some(
    ([menuCode, currentRoles]) => {
      const originalMenu = menus?.find((m) => m.code === menuCode);
      const originalRoles = new Set(
        originalMenu?.roles.map((r) => r?.roleCode) || [],
      );

      if (currentRoles.size !== originalRoles.size) return true;

      for (const role of currentRoles) {
        if (!originalRoles.has(role)) return true;
      }

      return false;
    },
  );

  const sortedApps = useMemo(() => {
    if (!assignedApps) return [];
    return [...assignedApps].sort((a, b) => a.name.localeCompare(b.name, "pt"));
  }, [assignedApps]);

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
            <Button
              variant="outline"
              onClick={() => setShowMenusModal(true)}
              className="gap-2"
            >
              <IGRPIcon iconName="Menu" className="size-4" strokeWidth={2} />
              <span>Gerenciar Menus</span>
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {sortedApps.length !== 0 && (
            <div className="w-full sm:w-auto sm:min-w-[220px]">
              <Select
                value={selectedApp}
                onValueChange={handleAppChange}
                disabled={loading || loadingApps}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas as aplicações" />
                </SelectTrigger>
                <SelectContent>
                  {sortedApps.map((app) => (
                    <SelectItem key={app.code} value={app.code}>
                      <div className="flex items-center gap-2">
                        <IGRPIcon
                          iconName="AppWindow"
                          className="size-4"
                          strokeWidth={2}
                        />
                        <span>{app.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {!loading && menus && menus.length > 0 && (
            <div className="flex-1">
              <div className="relative">
                <IGRPIcon
                  iconName="Search"
                  className="absolute left-2.5 top-2.5 size-4 text-muted-foreground"
                />
                <Input
                  type="search"
                  placeholder="Pesquisar menu..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {loading || isLoadingRoles ? (
          <AppCenterLoading description="A carregar menus..." />
        ) : menuTree.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border rounded-lg">
            <IGRPIcon
              iconName="Menu"
              className="size-16 mb-4 opacity-30"
              strokeWidth={1.5}
            />
            <p className="text-lg font-medium mb-2">Nenhum menu encontrado</p>
            <p className="text-sm mb-4">
              {searchTerm
                ? "Tente ajustar os termos de pesquisa"
                : "Configure aplicações e menus primeiro"}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowMenusModal(true)}
                className="gap-2"
              >
                <IGRPIcon iconName="Menu" className="size-4" strokeWidth={2} />
                Gerenciar Menus
              </Button>
            </div>
          </div>
        ) : (
          <>
            {selectedApp && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <IGRPIcon
                    iconName="Filter"
                    className="size-3"
                    strokeWidth={2}
                  />
                  Filtrado por:{" "}
                  {sortedApps.find((app) => app.code === selectedApp)?.name ||
                    selectedApp}
                </Badge>
              </div>
            )}

            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap min-w-[320px]">
                      Menu
                    </TableHead>

                    {roles?.map((role) => (
                      <TableHead
                        key={role.name}
                        className="text-center whitespace-nowrap w-36 border-l"
                      >
                        <div className="flex flex-col items-center gap-2 py-2">
                          <div className="flex items-center gap-2">
                            {/* <IGRPIcon
                              iconName="ShieldCheck"
                              className="size-4 text-primary"
                              strokeWidth={2}
                            /> */}
                            <TooltipProvider delayDuration={350}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() =>
                                      toggleAllMenusForRole(role.code)
                                    }
                                    className="group flex items-center gap-1 hover:bg-primary/10 px-2 py-1 rounded transition-colors"
                                    type="button"
                                  >
                                    <IGRPIcon
                                      iconName={
                                        getColumnCheckState(role.code) === true
                                          ? "Check"
                                          : getColumnCheckState(role.code) ===
                                              "indeterminate"
                                            ? "Check"
                                            : "Square"
                                      }
                                      className={cn(
                                        "size-4 transition-colors",
                                        getColumnCheckState(role.code) === true
                                          ? "text-primary"
                                          : getColumnCheckState(role.code) ===
                                              "indeterminate"
                                            ? "text-primary/60"
                                            : "text-muted-foreground group-hover:text-primary",
                                      )}
                                      strokeWidth={2}
                                    />
                                    <span className="sr-only">
                                      Selecionar todos
                                    </span>
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent className="px-2 py-1 text-xs">
                                  Marcar/desmarcar todos
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <span
                            className="text-xs font-semibold truncate max-w-full px-1"
                            title={role.name}
                          >
                            {role?.name?.split(".").pop() ?? role?.name ?? ""}
                          </span>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {menuTree.map((menu) => (
                    <MenuTreeRow
                      setMenuRoleAssignments={setMenuRoleAssignments}
                      key={menu.code}
                      menu={menu}
                      roles={roles?.map((role) => ({
                        name: role.name ?? "",
                        code: role.code,
                      }))}
                      menuRoleAssignments={menuRoleAssignments}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between items-center pt-2">
              <div className="text-sm text-muted-foreground">
                {menus?.length} menu{menus?.length !== 1 ? "s" : ""} •{" "}
                {roles?.length || 0} perf{roles?.length !== 1 ? "is" : "il"}
              </div>

              <div className="flex gap-2">
                {/* <Button
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
                    className="size-4 mr-1"
                    strokeWidth={2}
                  />
                  Cancelar
                </Button> */}

                <Button
                  onClick={handleSave}
                  disabled={saving || !hasChanges}
                  className="gap-2"
                >
                  {saving ? (
                    <>
                      <IGRPIcon
                        iconName="LoaderCircle"
                        className="size-4 animate-spin"
                        strokeWidth={2}
                      />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <IGRPIcon
                        iconName="Save"
                        className="size-4"
                        strokeWidth={2}
                      />
                      Guardar Permissões
                    </>
                  )}
                </Button>
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

      <AlertDialog
        open={pendingAppSwitch != null}
        onOpenChange={(open) => !open && setPendingAppSwitch(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <IGRPIcon
                iconName="TriangleAlert"
                className="size-5 text-warning"
                strokeWidth={2}
              />
              Alterações por guardar
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem alterações nas permissões dos menus que ainda não foram
              guardadas. Guardar antes de mudar de aplicação ou descartar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:justify-between sm:flex-row gap-2">
            <div>
              <Button
                variant="outline"
                onClick={() => setPendingAppSwitch(null)}
                className="gap-2 w-full sm:w-auto"
              >
                <IGRPIcon iconName="X" className="size-4" strokeWidth={2} />
                Cancelar
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleDiscardAndSwitch}
                disabled={saving}
                className="gap-2 sm:w-auto"
              >
                <IGRPIcon
                  iconName="Trash2"
                  className="size-4"
                  strokeWidth={2}
                />
                Descartar e mudar
              </Button>
              <Button
                onClick={handleSaveAndSwitch}
                disabled={saving}
                className="gap-2 sm:w-auto"
              >
                {saving ? (
                  <>
                    <IGRPIcon
                      iconName="LoaderCircle"
                      className="size-4 animate-spin"
                      strokeWidth={2}
                    />
                    Guardando...
                  </>
                ) : (
                  <>
                    <IGRPIcon
                      iconName="Save"
                      className="size-4"
                      strokeWidth={2}
                    />
                    Guardar e mudar
                  </>
                )}
              </Button>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
