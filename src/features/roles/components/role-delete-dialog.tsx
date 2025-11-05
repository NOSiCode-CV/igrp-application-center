"use client";

import {
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
import { useDeleteRole } from "../use-roles";

interface RoleDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleToDelete: string;
}

export function RoleDeleteDialog({
  open,
  onOpenChange,
  roleToDelete,
}: RoleDeleteDialogProps) {
  const [confirmation, setConfirmation] = useState("");
  const { igrpToast } = useIGRPToast();

  const { mutateAsync: deleteRole } = useDeleteRole();

  const isConfirmed = confirmation === roleToDelete;

  async function confirmDelete() {
    try {
      await deleteRole(roleToDelete);
      igrpToast({
        type: "success",
        title: "Role Eliminado",
        description: `Role '${roleToDelete}' foi eliminado com sucesso.`,
        duration: 4000,
      });
    } catch (error) {
      console.log("Erro ao eliminar role:", error);
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
            <IGRPDialogDescriptionPrimitive className="flex flex-col items-center text-base text-balance text-foreground mx-auto">
              <div>
                <span>
                  Esta ação é irreversível. O menu e todos os seus dados serão
                  eliminados permanentemente. Para confirmar, escreva
                </span>{" "}
                <span className="font-semibold italic bg-emerald-50bg-destructive/20 dark:bg-destructive/50 dark:text-white p-0.5 rounded-sm ">
                  {roleToDelete}
                </span>{" "}
                abaixo:
              </div>
            </IGRPDialogDescriptionPrimitive>
          </IGRPDialogHeaderPrimitive>
        </div>

        <div className="flex flex-col gap-2">
          <IGRPLabelPrimitive
            htmlFor="confirmation"
            className='after:content-["*"] after:text-destructive gap-0.5 mb-1'
          >
            Nome Perfil
          </IGRPLabelPrimitive>
          <IGRPInputPrimitive
            id="confirmation"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder={`Digite '${roleToDelete}' para confirmação`}
            className="placeholder:truncate border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/30"
            required
          />
        </div>
        <IGRPDialogFooterPrimitive className="flex flex-col">
          <IGRPButtonPrimitive
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setConfirmation("");
            }}
            type="button"
          >
            Cancelar
          </IGRPButtonPrimitive>
          <IGRPButtonPrimitive
            variant="destructive"
            onClick={confirmDelete}
            disabled={!isConfirmed}
          >
            Eliminar
          </IGRPButtonPrimitive>
        </IGRPDialogFooterPrimitive>
      </IGRPDialogContentPrimitive>
    </IGRPDialogPrimitive>
  );
}
