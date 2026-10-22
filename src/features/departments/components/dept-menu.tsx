"use client";

import { useEffect, useMemo, useState } from "react";

import { igrpCompare } from "@igrp/framework-next/i18n";
import { useIGRPFormat } from "@igrp/framework-next/i18n/client";
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
import { useTranslations } from "next-intl";

import { AppCenterLoading } from "@/components/loading";
import {
  useAddRolesToMenu,
  useRemoveRolesFromMenu,
} from "@/features/applications/use-applications";
import { useServerErrorMessage } from "@/i18n/server-error";

import { buildMenuTree } from "../dept-lib";
import {
  useDepartmentApplications,
  useDepartmentMenus,
  useRoles,
} from "../use-departments";
import { useMenuRoleAssignments } from "../use-menu-role-assignments";
import MenuTreeRow from "./menu-tree-row";
import { ManageMenusModal } from "./modal/manage-menus-modal";

interface MenuPermissionsProps {
  departmentCode: string;
}

export type MenuWithChildren = MenuEntryDTO & { children?: MenuWithChildren[] };

export function MenuPermissions({ departmentCode }: MenuPermissionsProps) {
  const t = useTranslations("departments.menus");
  const serverError = useServerErrorMessage();
  const tActions = useTranslations("departments.actions");
  const tRoot = useTranslations("departments");
  const { formatLocale } = useIGRPFormat();
  const { igrpToast } = useIGRPToast();

  const [selectedApp, setSelectedApp] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

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
        igrpCompare(a.name, b.name, formatLocale),
      );
      setSelectedApp(sortedApps[0].code);
    }
  }, [assignedApps, selectedApp, formatLocale]);

  const filteredByApp = useMemo(
    () =>
      selectedApp
        ? (menus || []).filter((menu) => menu.applicationCode === selectedApp)
        : menus || [],
    [menus, selectedApp],
  );

  const filteredMenus = useMemo(
    () =>
      filteredByApp.filter((menu) => {
        if (!searchTerm) return true;
        return (
          menu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          menu.code.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }),
    [filteredByApp, searchTerm],
  );

  const menuTree = useMemo(
    () => buildMenuTree(filteredMenus as MenuWithChildren[]),
    [filteredMenus],
  );

  const {
    assignments: menuRoleAssignments,
    hasChanges,
    columnCheckState,
    toggleMenuRole,
    toggleAllMenusForRole,
    reset,
    diffForSave,
  } = useMenuRoleAssignments({ menus, roles, filteredMenus, selectedApp });

  const handleSave = async (): Promise<boolean> => {
    try {
      const promises = [];

      for (const { menuCode, toAdd, toRemove } of diffForSave()) {
        if (toAdd.length > 0) {
          promises.push(
            addRolesMutation.mutateAsync({
              appCode: selectedApp,
              menuCode,
              departmentCode,
              roleNames: toAdd,
            }),
          );
        }

        if (toRemove.length > 0) {
          promises.push(
            removeRolesMutation.mutateAsync({
              appCode: selectedApp,
              menuCode,
              departmentCode,
              roleNames: toRemove,
            }),
          );
        }
      }

      if (promises.length === 0) {
        igrpToast({
          type: "info",
          title: t("toast.noChangesTitle"),
          description: t("toast.noChangesDescription"),
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
        title: t("toast.savedTitle"),
        description: t("toast.savedDescription"),
      });
      return true;
    } catch (error) {
      console.error("Erro:", error);
      igrpToast({
        type: "error",
        title: t("toast.errorTitle"),
        description:
          error instanceof Error
            ? serverError(error.message)
            : tRoot("unknownError"),
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
      reset();
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

  const sortedApps = useMemo(() => {
    if (!assignedApps) return [];
    return [...assignedApps].sort((a, b) =>
      igrpCompare(a.name, b.name, formatLocale),
    );
  }, [assignedApps, formatLocale]);

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="leading-none font-semibold mb-1">{t("title")}</div>
            <div className="text-muted-foreground text-sm">{t("subtitle")}</div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowMenusModal(true)}
              className="gap-2"
            >
              <IGRPIcon
                iconName="Menu"
                aria-hidden
                className="size-4"
                strokeWidth={2}
              />
              <span>{t("manage")}</span>
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
                  <SelectValue placeholder={t("allApps")} />
                </SelectTrigger>
                <SelectContent>
                  {sortedApps.map((app) => (
                    <SelectItem key={app.code} value={app.code}>
                      <div className="flex items-center gap-2">
                        <IGRPIcon
                          iconName="AppWindow"
                          aria-hidden
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
            </div>
          )}
        </div>

        {loading || isLoadingRoles ? (
          <AppCenterLoading description={t("loading")} />
        ) : menuTree.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border rounded-lg">
            <IGRPIcon
              iconName="Menu"
              aria-hidden
              className="size-16 mb-4 opacity-30"
              strokeWidth={1.5}
            />
            <p className="text-lg font-medium mb-2">{t("emptyTitle")}</p>
            <p className="text-sm mb-4">
              {searchTerm ? t("emptySearch") : t("emptySetup")}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowMenusModal(true)}
                className="gap-2"
              >
                <IGRPIcon
                  iconName="Menu"
                  aria-hidden
                  className="size-4"
                  strokeWidth={2}
                />
                {t("manage")}
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
                    aria-hidden
                    className="size-3"
                    strokeWidth={2}
                  />
                  {t("filteredBy", {
                    app:
                      sortedApps.find((app) => app.code === selectedApp)
                        ?.name || selectedApp,
                  })}
                </Badge>
              </div>
            )}

            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap min-w-[320px]">
                      {t("columnMenu")}
                    </TableHead>

                    {roles?.map((role) => (
                      <TableHead
                        key={role.name}
                        className="text-center whitespace-nowrap w-36 border-l"
                      >
                        <div className="flex flex-col items-center gap-2 py-2">
                          <div className="flex items-center gap-2">
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
                                      aria-hidden
                                      iconName={
                                        (columnCheckState.get(role.code) ??
                                          false) === true
                                          ? "Check"
                                          : (columnCheckState.get(role.code) ??
                                                false) === "indeterminate"
                                            ? "Check"
                                            : "Square"
                                      }
                                      className={cn(
                                        "size-4 transition-colors",
                                        (columnCheckState.get(role.code) ??
                                          false) === true
                                          ? "text-primary"
                                          : (columnCheckState.get(role.code) ??
                                                false) === "indeterminate"
                                            ? "text-primary/60"
                                            : "text-muted-foreground group-hover:text-primary",
                                      )}
                                      strokeWidth={2}
                                    />
                                    <span className="sr-only">
                                      {t("selectAll")}
                                    </span>
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent className="px-2 py-1 text-xs">
                                  {t("toggleAll")}
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
                      toggleMenuRole={toggleMenuRole}
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
                {t("summary", {
                  menus: menus?.length ?? 0,
                  roles: roles?.length ?? 0,
                })}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={saving || !hasChanges}
                  className="gap-2"
                >
                  {saving ? (
                    <>
                      <IGRPIcon
                        iconName="LoaderCircle"
                        aria-hidden
                        className="size-4 animate-spin motion-reduce:animate-none"
                        strokeWidth={2}
                      />
                      {tActions("saving")}
                    </>
                  ) : (
                    <>
                      <IGRPIcon
                        iconName="Save"
                        aria-hidden
                        className="size-4"
                        strokeWidth={2}
                      />
                      {t("savePermissions")}
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
                aria-hidden
                className="size-5 text-warning"
                strokeWidth={2}
              />
              {t("unsaved.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("unsaved.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:justify-between sm:flex-row gap-2">
            <div>
              <Button
                variant="outline"
                onClick={() => setPendingAppSwitch(null)}
                className="gap-2 w-full sm:w-auto"
              >
                <IGRPIcon
                  iconName="X"
                  aria-hidden
                  className="size-4"
                  strokeWidth={2}
                />
                {tActions("cancel")}
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
                  aria-hidden
                  className="size-4"
                  strokeWidth={2}
                />
                {t("unsaved.discard")}
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
                      aria-hidden
                      className="size-4 animate-spin motion-reduce:animate-none"
                      strokeWidth={2}
                    />
                    {tActions("saving")}
                  </>
                ) : (
                  <>
                    <IGRPIcon
                      iconName="Save"
                      aria-hidden
                      className="size-4"
                      strokeWidth={2}
                    />
                    {t("unsaved.saveAndSwitch")}
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
