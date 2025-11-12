import {
  IGRPButtonPrimitive,
  IGRPDialogContentPrimitive,
  IGRPDialogDescriptionPrimitive,
  IGRPDialogFooterPrimitive,
  IGRPDialogHeaderPrimitive,
  IGRPDialogPrimitive,
  IGRPIcon,
  IGRPInputPrimitive,
  IGRPLabelPrimitive,
} from "@igrp/igrp-framework-react-design-system";
import { useId, useState } from "react";

interface IGRPDialogDeleteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toDelete: { code?: string; name: string };
  confirmDelete(): Promise<void>;
  isDeleting: boolean;
  description?: string;
  label?: string;
  labelBtnCancel?: string;
  labelBtnDelete?: string;
  textHeader?: string;
}

function IGRPDialogDelete({
  open,
  onOpenChange,
  toDelete,
  confirmDelete,
  isDeleting,
  description,
  label = "Escreva",
  labelBtnCancel = "Cancelar",
  labelBtnDelete = "Eliminar",
  textHeader = "Confirmação Final",
}: IGRPDialogDeleteProps) {
  const id = useId();
  const [confirmation, setConfirmation] = useState("");

  const isConfirmed = confirmation === toDelete.name;

  const RenderDes = (
    <span>
      Esta ação é irreversível. Todos os dados serão eliminados permanentemente.
      Para confirmar, escreva{" "}
      <span className="font-semibold">{toDelete.name}.</span>
    </span>
  );

  return (
    <IGRPDialogPrimitive open={open} onOpenChange={onOpenChange}>
      <IGRPDialogContentPrimitive>
        <div className="flex flex-col gap-4 bg-destructive/10 p-4 rounded-lg mt-3">
          <div className="flex items-center">
            <IGRPIcon
              iconName="CircleAlert"
              className="text-destructive size-6 me-2"
            />
            <span>{textHeader}</span>
          </div>
          <IGRPDialogHeaderPrimitive>
            <IGRPDialogDescriptionPrimitive className="text-foreground text-base">
              {description ? description : RenderDes}
            </IGRPDialogDescriptionPrimitive>
          </IGRPDialogHeaderPrimitive>
        </div>

        <div className="flex flex-col gap-2">
          <div className="*:not-first:mt-2">
            <IGRPLabelPrimitive
              htmlFor={`confirmation-${id}`}
              className='after:content-["*"] after:text-destructive gap-0.5 mb-1'
            >
              {label}
            </IGRPLabelPrimitive>
            <IGRPInputPrimitive
              id={`confirmation-${id}`}
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder={`Digite '${toDelete.name}' para confirmação`}
              className="placeholder:truncate border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/30"
              required
            />
          </div>
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
            <IGRPIcon
                  iconName="X"
                  className=" size-4"
                  strokeWidth={2}
                />
            {labelBtnCancel}
          </IGRPButtonPrimitive>
          <IGRPButtonPrimitive
            variant="destructive"
            onClick={() => {
              confirmDelete(),
              setConfirmation("");
            }}
            disabled={!isConfirmed || isDeleting}
          >
            <IGRPIcon
                  iconName="Trash"
                  className="size-4"
                  strokeWidth={2}
                />
            {isDeleting ? "Aguarde..." : labelBtnDelete}
          </IGRPButtonPrimitive>
        </IGRPDialogFooterPrimitive>
      </IGRPDialogContentPrimitive>
    </IGRPDialogPrimitive>
  );
}

export { IGRPDialogDelete, type IGRPDialogDeleteProps };
