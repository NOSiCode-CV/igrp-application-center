"use client";

import { useMemo, useState } from "react";

import { useIGRPFormat } from "@igrp/framework-next/i18n/client";
import {
  Button,
  cn,
  IGRPIcon,
  Input,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";

import { ConfirmDialog } from "@/components/confirmation-modal";
import { AppCenterLoading } from "@/components/loading";
import {
  useAddPermissionsToDepartment,
  useAvailablePermissions,
  useDepartmentPermissions,
  useRemovePermissionsFromDepartment,
} from "@/features/departments/use-departments";

import { ManageResourcesModal } from "./resource-manage-modal";

interface PermissionListProps {
  departmentCode: string;
}

export function PermissionList({ departmentCode }: PermissionListProps) {
  const t = useTranslations("permissions");
  const tCommon = useTranslations("common");
  const { compare } = useIGRPFormat();
  const { igrpToast } = useIGRPToast();
  const [openManageResources, setOpenManageResources] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [permissionToRevoke, setPermissionToRevoke] = useState<string | null>(
    null,
  );
  const [processingPermission, setProcessingPermission] = useState<
    string | null
  >(null);

  const { data: availablePermissions, isLoading: isLoadingAvailable } =
    useAvailablePermissions(departmentCode);
  const { data: departmentPermissions, isLoading: isLoadingDepartment } =
    useDepartmentPermissions(departmentCode);

  const addPermissions = useAddPermissionsToDepartment();
  const removePermissions = useRemovePermissionsFromDepartment();

  const isLoading = isLoadingAvailable || isLoadingDepartment;

  const allPermissions = useMemo(() => {
    const permissionsMap = new Map();

    availablePermissions?.forEach((perm) => {
      permissionsMap.set(perm.name, {
        ...perm,
        isAssigned: false,
      });
    });

    departmentPermissions?.forEach((perm) => {
      permissionsMap.set(perm.name, {
        ...perm,
        isAssigned: true,
      });
    });

    return Array.from(permissionsMap.values()).sort((a, b) =>
      compare(a.name, b.name),
    );
  }, [availablePermissions, departmentPermissions, compare]);

  const filteredPermissions = useMemo(() => {
    if (!searchTerm) return allPermissions;

    const term = searchTerm.toLowerCase();
    return allPermissions.filter(
      (perm) =>
        perm.name.toLowerCase().includes(term) ||
        perm.description?.toLowerCase().includes(term),
    );
  }, [allPermissions, searchTerm]);

  const handleTogglePermission = async (
    permissionName: string,
    isEnabled: boolean,
  ) => {
    setProcessingPermission(permissionName);
    try {
      if (isEnabled) {
        await addPermissions.mutateAsync({
          departmentCode,
          permissionCodes: [permissionName],
        });
        igrpToast({
          type: "success",
          title: t("toast.addedTitle"),
          description: t("toast.addedDescription"),
        });
      } else {
        await removePermissions.mutateAsync({
          departmentCode,
          permissionCodes: [permissionName],
        });
        igrpToast({
          type: "success",
          title: t("toast.removedTitle"),
          description: t("toast.removedDescription"),
        });
      }
    } catch (error) {
      igrpToast({
        type: "error",
        title: t("toast.errorTitle"),
        description:
          error instanceof Error ? error.message : tCommon("unknownError"),
      });
    } finally {
      setProcessingPermission(null);
    }
  };

  if (isLoading) {
    return <AppCenterLoading description={t("list.loading")} />;
  }

  const permissionEmpty = allPermissions.length === 0;

  return (
    <>
      <div className="flex flex-col gap-6 min-w-0">
        <div>
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <div className="leading-none font-semibold">
                {t("list.title")}
              </div>
              <div className="text-muted-foreground text-sm">
                {t("list.subtitle")}
              </div>
            </div>
            <div className="flex justify-end shrink-0">
              <Button
                variant="outline"
                onClick={() => setOpenManageResources(true)}
              >
                <IGRPIcon
                  iconName="Shield"
                  aria-hidden
                  className="size-4"
                  strokeWidth={2}
                />
                {t("list.manageResources")}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row items-start gap-4 w-full min-w-0">
            <div className="relative w-full max-w-full">
              <IGRPIcon
                iconName="Search"
                aria-hidden
                className="absolute left-2.5 top-2.5 size-4 text-muted-foreground"
              />
              <Input
                type="search"
                aria-label={t("list.searchLabel")}
                autoComplete="off"
                placeholder={t("list.searchPlaceholder")}
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {permissionEmpty ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border rounded-lg">
              <IGRPIcon
                iconName="ShieldOff"
                aria-hidden
                className="size-16 mb-4 opacity-30"
                strokeWidth={1.5}
              />
              <p className="text-lg font-medium mb-2">{t("list.emptyTitle")}</p>
              <p className="text-sm mb-4">{t("list.emptyDescription")}</p>
            </div>
          ) : (
            <div className="w-full min-w-0">
              <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">
                        {t("list.columnPermission")}
                      </TableHead>
                      <TableHead className="whitespace-nowrap">
                        {t("list.columnDescription")}
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-right">
                        {t("list.columnActive")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPermissions.map((permission) => {
                      const isProcessing =
                        processingPermission === permission.name;

                      return (
                        <TableRow key={permission.id}>
                          <TableCell className="font-medium whitespace-nowrap">
                            {permission.name}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {permission.description || t("list.noDescription")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isProcessing && (
                                <IGRPIcon
                                  iconName="LoaderCircle"
                                  aria-hidden
                                  className="size-4 animate-spin motion-reduce:animate-none text-muted-foreground"
                                  strokeWidth={2}
                                />
                              )}
                              <Switch
                                checked={permission.isAssigned}
                                disabled={processingPermission !== null}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    handleTogglePermission(
                                      permission.name,
                                      true,
                                    );
                                  } else {
                                    setPermissionToRevoke(permission.name);
                                  }
                                }}
                                aria-label={
                                  permission.isAssigned
                                    ? t("list.removeLabel", {
                                        name: permission.name,
                                      })
                                    : t("list.addLabel", {
                                        name: permission.name,
                                      })
                                }
                                className={cn(
                                  "data-[state=checked]:bg-success",
                                  isProcessing && "opacity-50",
                                )}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </div>

      <ManageResourcesModal
        departmentCode={departmentCode}
        open={openManageResources}
        onOpenChange={setOpenManageResources}
      />

      <ConfirmDialog
        open={permissionToRevoke !== null}
        onOpenChange={(open) => {
          if (!open) setPermissionToRevoke(null);
        }}
        title={t("revoke.title")}
        description={
          permissionToRevoke
            ? t("revoke.description", {
                name: permissionToRevoke,
                department: departmentCode,
              })
            : ""
        }
        onConfirm={() => {
          if (permissionToRevoke) {
            const name = permissionToRevoke;
            setPermissionToRevoke(null);
            void handleTogglePermission(name, false);
          }
        }}
        isLoading={processingPermission === permissionToRevoke}
        cancelText={t("revoke.cancel")}
        confirmText={t("revoke.confirm")}
        loadingText={t("revoke.loading")}
        iconName="ShieldOff"
        variant="destructive"
      />
    </>
  );
}
