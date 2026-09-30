import { type ReactNode, useId, useState } from "react";

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

interface IGRPDialogDeleteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toDelete: { code?: string; name: string };
  confirmDelete(): Promise<void>;
  isDeleting: boolean;
  /**
   * What this action actually does, in the caller's own words. Required: the
   * dialog must not assert a consequence it cannot know. A caller that merely
   * deactivates a record must not inherit "eliminado permanentemente".
   */
  description: ReactNode;
  /** Label for the confirmation input. Must name the value being matched. */
  label: string;
  labelBtnCancel?: string;
  labelBtnDelete?: string;
  textHeader?: string;
  /** Icon on the confirm button. Use one that matches the real effect. */
  confirmIconName?: string;
  /** Extra controls between the confirmation field and the buttons. */
  children?: ReactNode;
}

function IGRPDialogDelete({
  open,
  onOpenChange,
  toDelete,
  confirmDelete,
  isDeleting,
  description,
  label,
  labelBtnCancel = "Cancelar",
  labelBtnDelete = "Eliminar",
  textHeader = "Confirmação Final",
  confirmIconName = "Trash",
  children,
}: IGRPDialogDeleteProps) {
  const id = useId();
  const [confirmation, setConfirmation] = useState("");

  const isConfirmed = confirmation === toDelete.name;
  const hasMismatch = confirmation.length > 0 && !isConfirmed;

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
              aria-hidden="true"
            />
            <span>{textHeader}</span>
          </div>
          <DialogHeader>
            <DialogDescription className="text-foreground text-base">
              {description}{" "}
              <span>
                Para confirmar, escreva{" "}
                <span className="font-semibold">{toDelete.name}.</span>
              </span>
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
              aria-invalid={hasMismatch}
              aria-describedby={hasMismatch ? `mismatch-${id}` : undefined}
              required
            />
            {hasMismatch && (
              <p
                id={`mismatch-${id}`}
                className="text-sm text-destructive"
                role="alert"
              >
                O texto não coincide com «{toDelete.name}».
              </p>
            )}
          </div>
        </div>
        {children}
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
            <IGRPIcon
              iconName={confirmIconName}
              className="size-4"
              strokeWidth={2}
            />
            {isDeleting ? "Aguarde..." : labelBtnDelete}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { IGRPDialogDelete, type IGRPDialogDeleteProps };
