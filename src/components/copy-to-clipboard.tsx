"use client";

import {
  Button,
  IGRPIcon,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface CopyToClipboardProps {
  value: string;
  className?: string;
}

// TODO: Move to design-system package

export function CopyToClipboard({ value }: CopyToClipboardProps) {
  const [copied, setCopied] = useState(false);
  const { igrpToast } = useIGRPToast();

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      const displayValue =
        value.length > 50 ? `${value.substring(0, 47)}...` : value;

      setCopied(true);
      igrpToast({
        type: "success",
        title: "Copiado para a área de transferência",
        description: displayValue,
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      igrpToast({
        type: "error",
        title: "Não foi possível copiar para a área de transferência",
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro desconhecido.",
        duration: 2000,
      });
    }
  }

  return (
    <TooltipProvider delayDuration={350}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="disabled:opacity-100 size-7"
            onClick={handleCopy}
            aria-label={
              copied ? "Copiado" : "Copiar para a área de transferência"
            }
            disabled={copied}
          >
            <div
              className={cn(
                "transition-all",
                copied ? "scale-100 opacity-100" : "scale-0 opacity-0",
              )}
            >
              <IGRPIcon
                iconName="Check"
                className="stroke-primary"
                aria-hidden="true"
                strokeWidth={2}
              />
            </div>
            <div
              className={cn(
                "absolute transition-all",
                copied ? "scale-0 opacity-0" : "scale-100 opacity-100",
              )}
            >
              <IGRPIcon
                iconName="Copy"
                aria-hidden="true"
                strokeWidth={2}
                className="size-3"
              />
            </div>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="px-2 py-1 text-xs">
          Clique para copiar
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
