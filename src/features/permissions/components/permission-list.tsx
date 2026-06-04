"use client";

import { useMemo, useState } from "react";

import {
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

import { ButtonLink } from "@/components/button-link";
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
  const { igrpToast } = useIGRPToast();
  const [openManageResources, setOpenManageResources] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
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
      a.name.localeCompare(b.name, "pt"),
    );
  }, [availablePermissions, departmentPermissions]);

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
          title: "Permissão adicionada",
          description: "A permissão foi adicionada com sucesso.",
        });
      } else {
        await removePermissions.mutateAsync({
          departmentCode,
          permissionCodes: [permissionName],
        });
        igrpToast({
          type: "success",
          title: "Permissão removida",
          description: "A permissão foi removida com sucesso.",
        });
      }
    } catch (error) {
      igrpToast({
        type: "error",
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
      });
    } finally {
      setProcessingPermission(null);
    }
  };

  if (isLoading) {
    return <AppCenterLoading description="Carregando permissões..." />;
  }

  const permissionEmpty = allPermissions.length === 0;

  return (
    <>
      <div className="flex flex-col gap-6 min-w-0">
        <div>
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <div className="leading-none font-semibold">Permissões</div>
              <div className="text-muted-foreground text-sm">
                Gerir e reorganizar as permissões.
              </div>
            </div>
            <div className="flex justify-end shrink-0">
              <ButtonLink
                onClick={() => setOpenManageResources(true)}
                icon="Shield"
                href="#"
                label="Gerenciar Recursos"
                variant="outline"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row items-start gap-4 w-full min-w-0">
            <div className="relative w-full max-w-full">
              <IGRPIcon
                iconName="Search"
                className="absolute left-2.5 top-2.5 size-4 text-muted-foreground"
              />
              <Input
                type="search"
                placeholder="Pesquisar permissões..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {permissionEmpty ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border rounded-lg">
              <IGRPIcon
                iconName="ShieldOff"
                className="size-16 mb-4 opacity-30"
                strokeWidth={1.5}
              />
              <p className="text-lg font-medium mb-2">
                Nenhuma permissão disponível
              </p>
              <p className="text-sm mb-4">
                Não existem permissões para este departamento.
              </p>
            </div>
          ) : (
            <div className="w-full min-w-0">
              <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">
                        Permissão
                      </TableHead>
                      <TableHead className="whitespace-nowrap">
                        Descrição
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-right">
                        Ativo
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
                            {permission.description || "N/A"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isProcessing && (
                                <IGRPIcon
                                  iconName="LoaderCircle"
                                  className="size-4 animate-spin text-muted-foreground"
                                  strokeWidth={2}
                                />
                              )}
                              <Switch
                                checked={permission.isAssigned}
                                disabled={processingPermission !== null}
                                onCheckedChange={(checked) =>
                                  handleTogglePermission(
                                    permission.name,
                                    checked,
                                  )
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
    </>
  );
}
