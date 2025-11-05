"use client";

import {
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
import { useState, useEffect } from "react";
import { useAddApplicationsToDepartment, useDepartmentAvailableApps, useRemoveApplicationsFromDepartment } from "../../use-departments";
import { useApplications } from "@/features/applications/use-applications";

interface ManageAppsModalProps {
  departmentCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageAppsModal({ 
  departmentCode,
  open,
  onOpenChange
}: ManageAppsModalProps) {
  const { igrpToast } = useIGRPToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [appsToAdd, setAppsToAdd] = useState<Set<string>>(new Set());
  const [appsToRemove, setAppsToRemove] = useState<Set<string>>(new Set());

  const { data: availableApps, isLoading: loadingAvailable } = useDepartmentAvailableApps(departmentCode || "");
  const { data: assignedApps, isLoading: loadingAssigned } = useApplications({ departmentCode: departmentCode || "" });
  const addApplicationsMutation = useAddApplicationsToDepartment();
  const removeApplicationsMutation = useRemoveApplicationsFromDepartment();
  const saving = addApplicationsMutation.isPending || removeApplicationsMutation.isPending;
  const loading = loadingAvailable || loadingAssigned;

  useEffect(() => {
    if (open) {
      setAppsToAdd(new Set());
      setAppsToRemove(new Set());
      setSearchTerm("");
    }
  }, [open]);

  const assignedCodes = new Set(assignedApps?.map(app => app.code) || []);
  const appsNotAssigned = (availableApps || []).filter(app => !assignedCodes.has(app.code));

  const toggleAppToAdd = (appCode: string) => {
    setAppsToAdd(prev => {
      const newSet = new Set(prev);
      if (newSet.has(appCode)) {
        newSet.delete(appCode);
      } else {
        newSet.add(appCode);
      }
      return newSet;
    });
  };

  const toggleAppToRemove = (appCode: string) => {
    setAppsToRemove(prev => {
      const newSet = new Set(prev);
      if (newSet.has(appCode)) {
        newSet.delete(appCode);
      } else {
        newSet.add(appCode);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    try {
      const promises = [];

      if (appsToAdd.size > 0) {
        promises.push(
          addApplicationsMutation.mutateAsync({
            code: departmentCode,
            appCodes: Array.from(appsToAdd),
          })
        );
      }

      if (appsToRemove.size > 0) {
        promises.push(
          removeApplicationsMutation.mutateAsync({
            code: departmentCode,
            appCodes: Array.from(appsToRemove),
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
        title: "Aplicações atualizadas",
        description: "As aplicações foram atualizadas com sucesso.",
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

  const filteredNotAssigned = appsNotAssigned.filter((app) => {
    if (!searchTerm) return true;
    return (
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const filteredAssigned = (assignedApps || []).filter((app) => {
    if (!searchTerm) return true;
    return (
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const hasChanges = appsToAdd.size > 0 || appsToRemove.size > 0;

  return (
    <IGRPDialogPrimitive open={open} onOpenChange={onOpenChange}>
      <IGRPDialogContentPrimitive className="max-w-3xl! max-h-[90vh] overflow-hidden flex flex-col">
        <IGRPDialogHeaderPrimitive>
          <IGRPDialogTitlePrimitive className="flex items-center gap-2">
            <IGRPIcon iconName="AppWindow" className="w-5 h-5" strokeWidth={2} />
            Gerenciar Aplicações
          </IGRPDialogTitlePrimitive>
          <IGRPDialogDescriptionPrimitive>
            Adicione ou remova aplicações do departamento.
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
              placeholder="Pesquisar aplicação..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <IGRPTabsPrimitive defaultValue="add" className="flex-1 flex flex-col overflow-hidden">
          <IGRPTabsListPrimitive className="grid w-full grid-cols-2">
            <IGRPTabsTriggerPrimitive value="add" className="gap-2">
              <IGRPIcon iconName="Plus" className="w-4 h-4" strokeWidth={2} />
              Adicionar ({appsToAdd.size})
            </IGRPTabsTriggerPrimitive>
            <IGRPTabsTriggerPrimitive value="remove" className="gap-2">
              <IGRPIcon iconName="Minus" className="w-4 h-4" strokeWidth={2} />
              Remover ({appsToRemove.size})
            </IGRPTabsTriggerPrimitive>
          </IGRPTabsListPrimitive>

          <IGRPTabsContentPrimitive value="add" className="flex-1 overflow-y-auto mt-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <IGRPSkeletonPrimitive key={i} className="h-14 rounded-lg" />
                ))}
              </div>
            ) : filteredNotAssigned.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <IGRPIcon iconName="AppWindow" className="w-12 h-12 mb-3 opacity-30" strokeWidth={1.5} />
                <p className="font-medium">Nenhuma aplicação disponível</p>
                <p className="text-sm">
                  {searchTerm ? "Tente ajustar os termos de pesquisa" : "Todas as aplicações já estão adicionadas"}
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <IGRPTablePrimitive>
                  <IGRPTableHeaderPrimitive>
                    <IGRPTableRowPrimitive>
                      <IGRPTableHeadPrimitive className="w-12 text-center" />
                      <IGRPTableHeadPrimitive>Aplicação</IGRPTableHeadPrimitive>
                      <IGRPTableHeadPrimitive className="w-32">Tipo</IGRPTableHeadPrimitive>
                    </IGRPTableRowPrimitive>
                  </IGRPTableHeaderPrimitive>
                  
                  <IGRPTableBodyPrimitive>
                    {filteredNotAssigned.map((app) => (
                      <IGRPTableRowPrimitive key={app.code}>
                        <IGRPTableCellPrimitive className="text-center">
                          <div className="flex items-center justify-center">
                            <IGRPCheckboxPrimitive
                              checked={appsToAdd.has(app.code)}
                              onCheckedChange={() => toggleAppToAdd(app.code)}
                            />
                          </div>
                        </IGRPTableCellPrimitive>
                        
                        <IGRPTableCellPrimitive>
                          <div className="flex items-start gap-3">
                            <IGRPIcon 
                              iconName="AppWindow"
                              className="w-5 h-5 text-primary shrink-0 mt-0.5" 
                              strokeWidth={2}
                            />
                            <div className="min-w-0">
                              <div className="font-medium truncate">{app.name}</div>
                              {app.description && (
                                <div className="text-xs whitespace-pre-line! text-muted-foreground mt-1 line-clamp-2">
                                  {app.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </IGRPTableCellPrimitive>
                        
                        <IGRPTableCellPrimitive>
                          <IGRPBadgePrimitive variant="secondary" className="text-xs">
                            {app.type}
                          </IGRPBadgePrimitive>
                        </IGRPTableCellPrimitive>
                      </IGRPTableRowPrimitive>
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
            ) : filteredAssigned.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <IGRPIcon iconName="AppWindow" className="w-12 h-12 mb-3 opacity-30" strokeWidth={1.5} />
                <p className="font-medium">Nenhuma aplicação adicionada</p>
                <p className="text-sm">
                  {searchTerm ? "Tente ajustar os termos de pesquisa" : "Não há aplicações para remover"}
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <IGRPTablePrimitive>
                  <IGRPTableHeaderPrimitive>
                    <IGRPTableRowPrimitive>
                      <IGRPTableHeadPrimitive className="w-12 text-center" />
                      <IGRPTableHeadPrimitive>Aplicação</IGRPTableHeadPrimitive>
                      <IGRPTableHeadPrimitive className="w-32">Tipo</IGRPTableHeadPrimitive>
                    </IGRPTableRowPrimitive>
                  </IGRPTableHeaderPrimitive>
                  
                  <IGRPTableBodyPrimitive>
                    {filteredAssigned.map((app) => (
                      <IGRPTableRowPrimitive key={app.code}>
                        <IGRPTableCellPrimitive className="text-center">
                          <div className="flex items-center justify-center">
                            <IGRPCheckboxPrimitive
                              checked={appsToRemove.has(app.code)}
                              onCheckedChange={() => toggleAppToRemove(app.code)}
                            />
                          </div>
                        </IGRPTableCellPrimitive>
                        
                        <IGRPTableCellPrimitive>
                          <div className="flex items-start gap-3">
                            <IGRPIcon 
                              iconName="AppWindow"
                              className="w-5 h-5 text-primary shrink-0 mt-0.5" 
                              strokeWidth={2}
                            />
                            <div className="min-w-0">
                              <div className="font-medium truncate">{app.name}</div>
                              {app.description && (
                                <div className="text-xs whitespace-pre-line! text-muted-foreground mt-1 line-clamp-2">
                                  {app.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </IGRPTableCellPrimitive>
                        
                        <IGRPTableCellPrimitive>
                          <IGRPBadgePrimitive variant="secondary" className="text-xs">
                            {app.type}
                          </IGRPBadgePrimitive>
                        </IGRPTableCellPrimitive>
                      </IGRPTableRowPrimitive>
                    ))}
                  </IGRPTableBodyPrimitive>
                </IGRPTablePrimitive>
              </div>
            )}
          </IGRPTabsContentPrimitive>
        </IGRPTabsPrimitive>

        <div className="flex justify-between items-center px-6 py-4 border-t bg-muted/20">
          <div className="text-sm text-muted-foreground">
            {appsToAdd.size > 0 && `${appsToAdd.size} para adicionar`}
            {appsToAdd.size > 0 && appsToRemove.size > 0 && " • "}
            {appsToRemove.size > 0 && `${appsToRemove.size} para remover`}
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