"use client";

import { useDeleteMenu } from "@/features/applications/use-applications";
import {
  IGRPButton,
  IGRPButtonPrimitive,
  IGRPDialogContentPrimitive,
  IGRPDialogDescriptionPrimitive,
  IGRPDialogFooterPrimitive,
  IGRPDialogHeaderPrimitive,
  IGRPDialogPrimitive,
  IGRPDialogTitlePrimitive,
  IGRPIcon,
  IGRPInputPrimitive,
  IGRPLabelPrimitive,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import { useState } from "react";

interface MenuDeleteDialogProps {
  appCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuToDelete: { code: string; name: string };
}

export function MenuDeleteDialog({
  appCode,
  open,
  onOpenChange,
  menuToDelete,
}: MenuDeleteDialogProps) {
  const [confirmation, setConfirmation] = useState("");
  const { igrpToast } = useIGRPToast();

  const { mutateAsync: deleteMenuAsync } = useDeleteMenu();

  const isConfirmed = confirmation === menuToDelete.name;

  async function confirmDelete() {
    try {
      const result = await deleteMenuAsync({
        appCode: appCode,
        menuCode: menuToDelete.code,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      igrpToast({
        type: "success",
        title: "Menu Eliminado",
        description: `O menu '${menuToDelete.name}' foi eliminado com sucesso.`,
      });
    } catch (error) {
      igrpToast({
        type: "error",
        title: "Erro ao eliminar.",
        description: (error as Error).message,
        duration: 4000,
      });
    } finally {
      setTimeout(() => {
        onOpenChange(false);
      }, 2000);
    }
  }

  return (
    <IGRPDialogPrimitive open={open} onOpenChange={onOpenChange}>
      <IGRPDialogContentPrimitive>
        <div>
          <IGRPDialogHeaderPrimitive className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-1">
              <div
                className="flex size-9 shrink-0 items-center justify-center"
                aria-hidden="true"
              >
                <IGRPIcon
                  iconName="CircleAlertIcon"
                  className="opacity-80 size-4"
                />
              </div>
              <IGRPDialogTitlePrimitive>Confirmação</IGRPDialogTitlePrimitive>
            </div>
            <IGRPDialogDescriptionPrimitive className="sm:text-center text-base text-balance ">
              <span>
                Esta ação é irreversível. O menu e todos os seus dados serão
                eliminados permanentemente. Para confirmar, escreva
              </span>{" "}
              <span className="font-semibold bg-emerald-50bg-destructive/20 dark:bg-destructive/50 dark:text-white p-0.5 rounded-sm ">
                &nbsp;{menuToDelete.name}&nbsp;
              </span>{" "}
              abaixo:
            </IGRPDialogDescriptionPrimitive>
          </IGRPDialogHeaderPrimitive>
        </div>

        <div className="flex flex-col gap-2">
          <IGRPLabelPrimitive
            htmlFor="confirmation"
            className='after:content-["*"] after:text-destructive gap-0.5 mb-1'
          >
            Nome do Menu
          </IGRPLabelPrimitive>
          <IGRPInputPrimitive
            id="confirmation"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder={`Digite '${menuToDelete.name}' para confirmação`}
            className="placeholder:truncate border-primary/30 focus-visible:ring-[2px] focus-visible:ring-primary/30 focus-visible:border-primary/30"
            required
          />
        </div>
        <IGRPDialogFooterPrimitive className="flex flex-col">
          <IGRPButton
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setConfirmation("");
            }}
            type="button"
            showIcon
            iconName="X"
          >
            Cancelar
          </IGRPButton>
          <IGRPButton
            variant="destructive"
            onClick={confirmDelete}
            disabled={!isConfirmed}
            showIcon
            iconName="Trash"
          >
            Eliminar
          </IGRPButton>
        </IGRPDialogFooterPrimitive>
      </IGRPDialogContentPrimitive>
    </IGRPDialogPrimitive>
  );
}
