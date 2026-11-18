"use client";

import { useCallback } from "react";

import { useIGRPToast } from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";

/** Copy a client ID with a toast either way — clipboard access can be denied. */
export function useCopyClientId() {
  const { igrpToast } = useIGRPToast();
  const t = useTranslations("oauthClients.copy");
  return useCallback(
    async (clientId: string) => {
      try {
        await navigator.clipboard.writeText(clientId);
        igrpToast({
          type: "success",
          title: t("successTitle"),
          description: t("successDescription", { clientId }),
        });
      } catch {
        igrpToast({
          type: "error",
          title: t("errorTitle"),
          description: t("errorDescription"),
        });
      }
    },
    [igrpToast, t],
  );
}
