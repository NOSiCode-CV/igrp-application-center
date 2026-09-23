"use client";

import { useCallback } from "react";

import { useIGRPToast } from "@igrp/igrp-framework-react-design-system";

/** Copy a client ID with a toast either way — clipboard access can be denied. */
export function useCopyClientId() {
  const { igrpToast } = useIGRPToast();
  return useCallback(
    async (clientId: string) => {
      try {
        await navigator.clipboard.writeText(clientId);
        igrpToast({
          type: "success",
          title: "Copiado",
          description: `Client ID ${clientId} copiado.`,
        });
      } catch {
        igrpToast({
          type: "error",
          title: "Não foi possível copiar",
          description: "Selecione o client ID e copie-o manualmente.",
        });
      }
    },
    [igrpToast],
  );
}
