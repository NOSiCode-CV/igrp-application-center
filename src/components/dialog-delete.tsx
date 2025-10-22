import {
  IGRPDialogPrimitive,
  IGRPDialogContentPrimitive,
  IGRPDialogHeaderPrimitive,
  IGRPIcon,
  IGRPDialogTitlePrimitive,
  IGRPDialogDescriptionPrimitive,
  IGRPLabelPrimitive,
  IGRPInputPrimitive,
  IGRPDialogFooterPrimitive,
  IGRPButtonPrimitive,
} from "@igrp/igrp-framework-react-design-system";
import { useId, useState } from "react";

interface IGRPDialogDeleteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toDelete: { code?: string; name: string };
  confirmDelete(): Promise<void>;
  description?: string;
  label?: string;
}

function IGRPDialogDelete({
  open,
  onOpenChange,
  toDelete,
  confirmDelete,
  description,
  label = "Escreva",
}: IGRPDialogDeleteProps) {
  const id = useId();
  const [confirmation, setConfirmation] = useState("");

  const isConfirmed = confirmation === toDelete.name;

  const RenderDes = (
    <span>
      Esta ação é irreversível. Todos os dados serão eliminados permanentemente.
      Para confirmar, escreva{" "}
      <span className="text-destructive focus:bg-destructive/10 dark:focus:bg-destructive/20 focus:text-destructive">
        {toDelete.name}.
      </span>
    </span>
  );

  return (
    <IGRPDialogPrimitive open={open} onOpenChange={onOpenChange}>
      <IGRPDialogContentPrimitive>
        <div className="flex flex-col items-center gap-2">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-destructive/30"
            aria-hidden="true"
          >
            <IGRPIcon
              iconName="CircleAlert"
              className="opacity-80 size-4 text-destructive"
            />
          </div>
          <IGRPDialogHeaderPrimitive>
            <IGRPDialogTitlePrimitive className="sm:text-center">
              Confirmação Final.
            </IGRPDialogTitlePrimitive>
            <IGRPDialogDescriptionPrimitive className="sm:text-center">
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
              className="placeholder:truncate border-primary/30 focus-visible:ring-[2px] focus-visible:ring-primary/30 focus-visible:border-primary/30"
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

export { IGRPDialogDelete, type IGRPDialogDeleteProps };
