"use client";

import { IGRPButton, IGRPIcon } from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";

interface InlineErrorProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  /** Defaults to `common.actions.retry`. */
  retryLabel?: string;
}

export function InlineError({
  title,
  message,
  onRetry,
  retryLabel,
}: InlineErrorProps) {
  const t = useTranslations("common");
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-6 text-center"
    >
      <IGRPIcon iconName="TriangleAlert" className="size-6 text-destructive" />
      <div>
        <p className="font-medium">{title ?? t("inlineError.title")}</p>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <IGRPButton
          variant="outline"
          size="sm"
          showIcon
          iconName="RotateCw"
          onClick={onRetry}
        >
          {retryLabel ?? t("actions.retry")}
        </IGRPButton>
      )}
    </div>
  );
}
