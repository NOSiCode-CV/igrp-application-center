"use client";

import {
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
  IGRPSkeletonPrimitive,
  IGRPSwitchPrimitive,
  cn,
  useIGRPToast,
  IGRPButton,
} from "@igrp/igrp-framework-react-design-system";
import { useState, useMemo, useRef, useEffect } from "react";
import {
  useAddApplicationsToDepartment,
  useDepartmentAvailableApps,
  useRemoveApplicationsFromDepartment,
} from "../../use-departments";
import { useApplications } from "@/features/applications/use-applications";
import { ScrollArea } from "@igrp/igrp-framework-react-design-system/dist/components/primitives/scroll-area";

interface ManageAppsModalProps {
  departmentCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageAppsModal({
  departmentCode,
  open,
  onOpenChange,
}: ManageAppsModalProps) {
  const { igrpToast } = useIGRPToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [processingApp, setProcessingApp] = useState<string | null>(null);
  const [appToRemove, setAppToRemove] = useState<{
    code: string;
    name: string;
  } | null>(null);

  const { data: availableApps, isLoading: loadingAvailable } =
    useDepartmentAvailableApps(departmentCode || "");
  const { data: assignedApps, isLoading: loadingAssigned } = useApplications({
    departmentCode: departmentCode || "",
  });
  const addApplicationsMutation = useAddApplicationsToDepartment();
  const removeApplicationsMutation = useRemoveApplicationsFromDepartment();

  const loading = loadingAvailable || loadingAssigned;

  const seenAppsRef = useRef(new Map());

  useEffect(() => {
    if (availableApps) {
      availableApps.forEach((app) => {
        seenAppsRef.current.set(app.code, app);
      });
    }
    if (assignedApps) {
      assignedApps.forEach((app) => {
        seenAppsRef.current.set(app.code, app);
      });
    }
  }, [availableApps, assignedApps]);

  const assignedCodes = new Set(assignedApps?.map((app) => app.code) || []);

  const allApps = useMemo(() => {
    const appsArray = Array.from(seenAppsRef.current.values()).map((app) => ({
      ...app,
      isAssigned: assignedCodes.has(app.code),
    }));

    return appsArray.sort((a, b) => a.name.localeCompare(b.name, "pt"));
  }, [assignedCodes, availableApps, assignedApps]);

  const filteredApps = useMemo(() => {
    if (!searchTerm) return allApps;

    const term = searchTerm.toLowerCase();
    return allApps.filter(
      (app) =>
        app.name.toLowerCase().includes(term) ||
        app.code.toLowerCase().includes(term) ||
        app.description?.toLowerCase().includes(term),
    );
  }, [allApps, searchTerm]);

  const handleToggleApp = async (
    appCode: string,
    currentlyAssigned: boolean,
  ) => {
    if (currentlyAssigned) {
      const app = allApps.find((a) => a.code === appCode);
      setAppToRemove({ code: appCode, name: app?.name || appCode });
    } else {
      await handleAddApp(appCode);
    }
  };

  const handleAddApp = async (appCode: string) => {
    setProcessingApp(appCode);
    try {
      await addApplicationsMutation.mutateAsync({
        code: departmentCode,
        appCodes: [appCode],
      });

      igrpToast({
        type: "success",
        title: "Aplicação adicionada",
        description: "A aplicação foi adicionada com sucesso.",
      });
    } catch (error) {
      igrpToast({
        type: "error",
        title: "Erro ao adicionar",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
      });
    } finally {
      setProcessingApp(null);
    }
  };

  const handleConfirmRemove = async () => {
    if (!appToRemove) return;

    setProcessingApp(appToRemove.code);
    try {
      await removeApplicationsMutation.mutateAsync({
        code: departmentCode,
        appCodes: [appToRemove.code],
      });

      igrpToast({
        type: "success",
        title: "Aplicação removida",
        description: "A aplicação foi removida com sucesso.",
      });

      setAppToRemove(null);
    } catch (error) {
      igrpToast({
        type: "error",
        title: "Erro ao remover",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
      });
    } finally {
      setProcessingApp(null);
    }
  };

  return (
    <>
      <IGRPDialogPrimitive open={open} onOpenChange={onOpenChange}>
        <IGRPDialogContentPrimitive className="sm:min-w-2xl ! max-h-[85vh] overflow-hidden flex flex-col">
          <IGRPDialogHeaderPrimitive>
            <IGRPDialogTitlePrimitive className="flex items-center gap-2">
              <IGRPIcon
                iconName="AppWindow"
                className="w-5 h-5"
                strokeWidth={2}
              />
              Gerenciar Aplicações
            </IGRPDialogTitlePrimitive>
            <IGRPDialogDescriptionPrimitive>
              Adicione ou remova aplicações do departamento com um clique.
            </IGRPDialogDescriptionPrimitive>
          </IGRPDialogHeaderPrimitive>

          <div className="pb-4">
            <div className="relative">
              <IGRPIcon
                iconName="Search"
                className="absolute left-2.5 top-2.5 size-4 text-muted-foreground"
              />
              <IGRPInputPrimitive
                type="search"
                placeholder="Pesquisar por nome, código ou descrição..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="h-96 w-full ">
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <IGRPSkeletonPrimitive key={i} className="h-20 rounded-lg" />
                ))}
              </div>
            ) : filteredApps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <IGRPIcon
                  iconName="AppWindow"
                  className="w-16 h-16 mb-4 opacity-20"
                  strokeWidth={1.5}
                />
                <p className="font-semibold text-lg">
                  Nenhuma aplicação encontrada
                </p>
                <p className="text-sm mt-1">
                  {searchTerm
                    ? "Tente ajustar os termos de pesquisa"
                    : "Não há aplicações disponíveis"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredApps.map((app) => (
                  <div
                    key={app.code}
                    className={cn(
                      "group relative rounded-lg border",
                      app.isAssigned
                        ? "bg-primary/5 border-primary/20 hover:border-primary/40 hover:bg-primary/10"
                        : "bg-muted/30 border-muted hover:border-accent hover:bg-muted/50",
                    )}
                  >
                    <div className="flex items-center gap-4 p-4">
                      <div
                        className={cn(
                          "flex items-center justify-center w-12 h-12 rounded-lg shrink-0 transition-colors",
                          app.isAssigned
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        <IGRPIcon
                          iconName="AppWindow"
                          className="w-6 h-6"
                          strokeWidth={2}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm truncate">
                            {app.name}
                          </h4>
                          <IGRPBadgePrimitive
                            variant={app.isAssigned ? "default" : "secondary"}
                            className="text-[10px] px-1.5 py-0.5 shrink-0"
                          >
                            {app.type}
                          </IGRPBadgePrimitive>
                        </div>
                        {app.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {app.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex flex-col items-end gap-0.5">
                          <span
                            className={cn(
                              "text-[10px] font-medium uppercase tracking-wider transition-colors",
                              app.isAssigned
                                ? "text-primary"
                                : "text-muted-foreground",
                            )}
                          >
                            {app.isAssigned ? "Adicionado" : "Disponível"}
                          </span>
                          {app.isAssigned && (
                            <div className="flex items-center gap-1 text-[10px] text-primary/70">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                              Ativo
                            </div>
                          )}
                        </div>
                        <IGRPSwitchPrimitive
                          checked={app.isAssigned}
                          onCheckedChange={() =>
                            handleToggleApp(app.code, app.isAssigned)
                          }
                          disabled={processingApp !== null}
                          className={cn(
                            "data-[state=checked]:bg-emerald-500",
                            processingApp === app.code && "opacity-50",
                          )}
                        />
                      </div>
                    </div>

                    {processingApp === app.code && (
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
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-between items-center py-4 ">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">
                {filteredApps.filter((app) => app.isAssigned).length}
              </span>{" "}
              de <span className="font-medium">{filteredApps.length}</span>{" "}
              aplicações adicionadas
            </div>

            <IGRPButtonPrimitive
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={processingApp !== null}
              className="gap-2"
            >
              <IGRPIcon iconName="X" className="w-4 h-4" strokeWidth={2} />
              Fechar
            </IGRPButtonPrimitive>
          </div>
        </IGRPDialogContentPrimitive>
      </IGRPDialogPrimitive>

      <IGRPAlertDialogPrimitive
        open={!!appToRemove}
        onOpenChange={(open) => !open && setAppToRemove(null)}
      >
        <IGRPAlertDialogContentPrimitive>
          <IGRPAlertDialogHeaderPrimitive>
            <IGRPAlertDialogTitlePrimitive className="flex items-center gap-2">
              <IGRPIcon
                iconName="AlertTriangle"
                className="w-5 h-5 text-destructive"
                strokeWidth={2}
              />
              Remover Aplicação
            </IGRPAlertDialogTitlePrimitive>
            <IGRPAlertDialogDescriptionPrimitive>
              Tem certeza que deseja remover a aplicação{" "}
              <strong className="text-foreground">{appToRemove?.name}</strong>{" "}
              deste departamento? Esta ação não pode ser desfeita.
            </IGRPAlertDialogDescriptionPrimitive>
          </IGRPAlertDialogHeaderPrimitive>
          <IGRPAlertDialogFooterPrimitive>
            <IGRPButton
              disabled={processingApp !== null}
              variant="outline"
              onClick={() => {
                setAppToRemove(null);
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
              disabled={processingApp !== null}
              className="bg-destructive hover:bg-destructive/90 gap-2 text-white"
            >
              {processingApp ? (
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
