"use client";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  IGRPButton,
  IGRPIcon,
  Input,
  ScrollArea,
  Skeleton,
  Switch,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import type { ResourceDTO } from "@igrp/platform-access-management-client-ts";
import { useEffect, useMemo, useState } from "react";

type ResourceWithAssignment = ResourceDTO & { isAssigned: boolean };

import {
  useAddResourcesToDepartment,
  useAvailableResources,
  useDepartmentResources,
  useRemoveResourcesFromDepartment,
} from "@/features/departments/use-departments";
import { getStatusColor, showStatus } from "@/lib/utils";

interface ManageResourcesModalProps {
  departmentCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageResourcesModal({
  departmentCode,
  open,
  onOpenChange,
}: ManageResourcesModalProps) {
  const { igrpToast } = useIGRPToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [processingResource, setProcessingResource] = useState<string | null>(
    null,
  );
  const [resourceToRemove, setResourceToRemove] = useState<{
    code: string;
    name: string;
    description?: string;
  } | null>(null);

  const { data: availableResources, isLoading: loadingAvailable } =
    useAvailableResources(departmentCode);
  const { data: assignedResources, isLoading: loadingAssigned } =
    useDepartmentResources(departmentCode);

  const addResourcesMutation = useAddResourcesToDepartment();
  const removeResourcesMutation = useRemoveResourcesFromDepartment();

  const loading = loadingAvailable || loadingAssigned;

  useEffect(() => {
    if (open) {
      setSearchTerm("");
    }
  }, [open]);

  const allResources = useMemo(() => {
    const available = availableResources || [];
    const assigned = assignedResources || [];

    const resourceMap = new Map<string, ResourceWithAssignment>();

    available.forEach((resource: ResourceDTO) => {
      resourceMap.set(resource.name, { ...resource, isAssigned: false });
    });

    assigned.forEach((resource: ResourceDTO) => {
      resourceMap.set(resource.name, { ...resource, isAssigned: true });
    });

    return Array.from(resourceMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "pt"),
    );
  }, [availableResources, assignedResources]);

  const handleToggleResource = async (
    resource: ResourceWithAssignment,
    currentlyAssigned: boolean,
  ) => {
    if (currentlyAssigned) {
      setResourceToRemove({
        code: resource.name,
        name: resource.name,
        description: resource.description,
      });
    } else {
      await handleAddResource(resource.name);
    }
  };

  const handleAddResource = async (resourceCode: string) => {
    setProcessingResource(resourceCode);
    try {
      await addResourcesMutation.mutateAsync({
        departmentCode,
        resourceCodes: [resourceCode],
      });

      igrpToast({
        type: "success",
        title: "Recurso adicionado",
        description: "O recurso foi adicionado com sucesso.",
      });
    } catch (error) {
      igrpToast({
        type: "error",
        title: "Erro ao adicionar",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
      });
    } finally {
      setProcessingResource(null);
    }
  };

  const handleConfirmRemove = async () => {
    if (!resourceToRemove) return;

    setProcessingResource(resourceToRemove.code);
    try {
      await removeResourcesMutation.mutateAsync({
        departmentCode,
        resourceCodes: [resourceToRemove.code],
      });

      igrpToast({
        type: "success",
        title: "Recurso removido",
        description: "O recurso foi removido com sucesso.",
      });

      setResourceToRemove(null);
    } catch (error) {
      igrpToast({
        type: "error",
        title: "Erro ao remover",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
      });
    } finally {
      setProcessingResource(null);
    }
  };

  const filteredResources = useMemo(() => {
    if (!searchTerm) return allResources;

    const term = searchTerm.toLowerCase();
    return allResources.filter(
      (resource) =>
        resource.name.toLowerCase().includes(term) ||
        resource.description?.toLowerCase().includes(term) ||
        resource.type.toLowerCase().includes(term),
    );
  }, [allResources, searchTerm]);

  const ResourceItem = ({ resource }: { resource: ResourceWithAssignment }) => {
    const isAssigned = resource.isAssigned;

    return (
      <div
        className={cn(
          "group relative rounded-lg border transition-all duration-200",
          isAssigned
            ? "bg-primary/5 border-primary/20 hover:border-primary/40 hover:bg-primary/10"
            : "bg-muted/30 border-muted hover:border-accent hover:bg-muted/50",
        )}
      >
        <div className="flex items-center gap-3 p-3">
          <div
            className={cn(
              "flex items-center justify-center size-10 rounded-lg shrink-0 transition-colors",
              isAssigned
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground",
            )}
          >
            <IGRPIcon iconName="Shield" className="size-5" strokeWidth={2} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className="font-semibold text-sm truncate">
                {resource.name}
              </h4>
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0.5 shrink-0"
              >
                {resource.type}
              </Badge>
              {resource.status && (
                <Badge
                  className={cn(
                    getStatusColor(resource.status),
                    "text-[10px] px-1.5 py-0.5 shrink-0",
                  )}
                >
                  {showStatus(resource.status)}
                </Badge>
              )}
            </div>
            {resource.description && (
              <p className="text-xs text-muted-foreground truncate">
                {resource.description}
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
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  Ativo
                </div>
              )}
            </div>
            <Switch
              checked={isAssigned}
              onCheckedChange={() => handleToggleResource(resource, isAssigned)}
              disabled={processingResource !== null}
              className={cn(
                "data-[state=checked]:bg-green-200",
                processingResource === resource.name && "opacity-50",
              )}
            />
          </div>
        </div>

        {processingResource === resource.name && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] rounded-lg flex items-center justify-center">
            <div className="flex items-center gap-2 text-sm font-medium">
              <IGRPIcon
                iconName="LoaderCircle"
                className="size-4 animate-spin"
                strokeWidth={2}
              />
              Processando...
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:min-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IGRPIcon iconName="Shield" className="size-5" strokeWidth={2} />
              Gerenciar Recursos
            </DialogTitle>
            <DialogDescription>
              Adicione ou remova recursos do departamento com um clique.
            </DialogDescription>
          </DialogHeader>

          <div className="pb-4">
            <div className="relative">
              <IGRPIcon
                iconName="Search"
                className="absolute left-2.5 top-2.5 size-4 text-muted-foreground"
              />
              <Input
                type="search"
                placeholder="Pesquisar por nome, tipo ou descrição..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="h-[95vh] w-full">
            {loading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton loader
                  <Skeleton key={i} className="h-20 rounded-lg" />
                ))}
              </div>
            ) : filteredResources.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <IGRPIcon
                  iconName="Shield"
                  className="size-16 mb-4 opacity-20"
                  strokeWidth={1.5}
                />
                <p className="font-semibold text-lg">
                  Nenhum recurso encontrado
                </p>
                <p className="text-sm mt-1">
                  {searchTerm
                    ? "Tente ajustar os filtros de pesquisa"
                    : "Não há recursos disponíveis"}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredResources.map((resource) => (
                  <ResourceItem
                    key={resource.id || resource.name}
                    resource={resource}
                  />
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-between items-center py-4">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">
                {filteredResources.filter((r) => r.isAssigned).length}
              </span>{" "}
              de <span className="font-medium">{filteredResources.length}</span>{" "}
              recursos adicionados
            </div>

            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={processingResource !== null}
              className="gap-2"
            >
              <IGRPIcon iconName="X" className="size-4" strokeWidth={2} />
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!resourceToRemove}
        onOpenChange={(open) => !open && setResourceToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <IGRPIcon
                iconName="AlertTriangle"
                className="size-5 text-destructive"
                strokeWidth={2}
              />
              Remover Recurso
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o recurso{" "}
              <strong className="text-foreground">
                {resourceToRemove?.name}
              </strong>{" "}
              deste departamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <IGRPButton
              disabled={processingResource !== null}
              variant="outline"
              onClick={() => setResourceToRemove(null)}
              type="button"
              showIcon
              iconPlacement="start"
              iconName="X"
            >
              Cancelar
            </IGRPButton>
            <IGRPButton
              onClick={handleConfirmRemove}
              disabled={processingResource !== null}
              className="bg-destructive hover:bg-destructive/90 text-white gap-2"
            >
              {processingResource ? (
                <>
                  <IGRPIcon
                    iconName="LoaderCircle"
                    className="size-4 animate-spin"
                    strokeWidth={2}
                  />
                  Removendo...
                </>
              ) : (
                <>
                  <IGRPIcon
                    iconName="Trash"
                    className="size-4"
                    strokeWidth={2}
                  />
                  Remover
                </>
              )}
            </IGRPButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
