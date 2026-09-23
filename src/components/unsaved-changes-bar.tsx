"use client";

import { Button } from "@igrp/igrp-framework-react-design-system";

interface UnsavedChangesBarProps {
  onDiscard: () => void;
  isSaving: boolean;
  /** Submit the form with this id (preferred), or call onSave. */
  formId?: string;
  onSave?: () => void;
}

export function UnsavedChangesBar({
  onDiscard,
  isSaving,
  formId,
  onSave,
}: UnsavedChangesBarProps) {
  return (
    <section
      aria-label="Alterações por guardar"
      className="sticky bottom-4 z-10 flex items-center gap-3 rounded-xl bg-foreground px-5 py-3 text-background shadow-lg"
    >
      <span className="flex-1">Tem alterações por guardar.</span>
      <Button
        type="button"
        variant="ghost"
        onClick={onDiscard}
        disabled={isSaving}
        className="text-background hover:bg-background/10 hover:text-background"
      >
        Descartar
      </Button>
      <Button
        type={formId ? "submit" : "button"}
        form={formId}
        onClick={formId ? undefined : onSave}
        disabled={isSaving}
        variant="secondary"
      >
        {isSaving ? "A guardar…" : "Guardar alterações"}
      </Button>
    </section>
  );
}
