"use client";

import { IGRPButton, IGRPIcon } from "@igrp/igrp-framework-react-design-system";

interface InlineErrorProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function InlineError({
  title = "Não foi possível carregar os dados.",
  message,
  onRetry,
}: InlineErrorProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-6 text-center"
    >
      <IGRPIcon iconName="TriangleAlert" className="size-6 text-destructive" />
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <IGRPButton variant="outline" size="sm" showIcon iconName="RotateCw" onClick={onRetry}>
          Tentar novamente
        </IGRPButton>
      )}
    </div>
  );
}
