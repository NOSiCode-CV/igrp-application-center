import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  IGRPIcon,
  Input,
  Label,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="sr-only">{textHeader}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 bg-destructive/10 p-4 rounded-lg mt-3">
          <div className="flex items-center">
            <IGRPIcon
              iconName="CircleAlert"
              className="text-destructive size-6 me-2"
            />
            <span>{textHeader}</span>
          </div>
          <DialogHeader>
            <DialogDescription className="text-foreground text-base">
              {description ? description : RenderDes}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex flex-col gap-2">
          <div className="*:not-first:mt-2">
            <Label
              htmlFor={`confirmation-${id}`}
              className='after:content-["*"] after:text-destructive gap-0.5 mb-1'
            >
              {label}
            </Label>
            <Input
              id={`confirmation-${id}`}
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder={`Digite '${toDelete.name}' para confirmação`}
              className="placeholder:truncate border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/30"
              required
            />
          </div>
        </div>
        <DialogFooter className="flex flex-col">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setConfirmation("");
            }}
            type="button"
          >
            <IGRPIcon iconName="X" className=" size-4" strokeWidth={2} />
            {labelBtnCancel}
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              confirmDelete();
              setConfirmation("");
            }}
            disabled={!isConfirmed || isDeleting}
          >
            <IGRPIcon iconName="Trash" className="size-4" strokeWidth={2} />
            {isDeleting ? "Aguarde..." : labelBtnDelete}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { IGRPDialogDelete, type IGRPDialogDeleteProps };
