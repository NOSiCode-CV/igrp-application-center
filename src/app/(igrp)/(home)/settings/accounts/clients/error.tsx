"use client";

import { useEffect } from "react";

import { useTranslations } from "next-intl";

import { StatusAwareError } from "@/components/errors/status-aware-error";
import { InlineError } from "@/components/inline-error";

export default function OAuthClientsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("oauthClients.error");
  useEffect(() => {
    console.error("[oauth-clients] segment error", error);
  }, [error]);

  return (
    <StatusAwareError
      error={error}
      fallback={
        <InlineError
          title={t("listTitle")}
          message={t("listMessage")}
          onRetry={reset}
        />
      }
    />
  );
}
