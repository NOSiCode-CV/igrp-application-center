"use client";

import { Button } from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("common.unsavedChanges");
  return (
    <section
      aria-label={t("region")}
      className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-xl bg-foreground px-5 py-3 text-background shadow-lg"
    >
      {/* Polite live region: the bar appears as the first edit lands. */}
      <span role="status" className="min-w-48 flex-1">
        {t("message")}
      </span>
      <Button
        type="button"
        variant="ghost"
        onClick={onDiscard}
        disabled={isSaving}
        className="text-background hover:bg-background/10 hover:text-background"
      >
        {t("discard")}
      </Button>
      <Button
        type={formId ? "submit" : "button"}
        form={formId}
        onClick={formId ? undefined : onSave}
        disabled={isSaving}
        variant="secondary"
      >
        {isSaving ? t("saving") : t("save")}
      </Button>
    </section>
  );
}
