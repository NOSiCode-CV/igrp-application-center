"use client";

import Link from "next/link";
import { useEffect } from "react";

import { useTranslations } from "next-intl";

import { StatusAwareError } from "@/components/errors/status-aware-error";
import { InlineError } from "@/components/inline-error";

export default function UserDetailsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("users.error");
  useEffect(() => {
    console.error("[users/:id] segment error", error);
  }, [error]);

  return (
    <StatusAwareError
      error={error}
      fallback={
        <div className="flex flex-col items-center gap-4">
          <InlineError
            title={t("detailTitle")}
            message={error.message}
            onRetry={reset}
          />
          <Link
            href="/settings/users"
            className="text-sm underline underline-offset-4 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            {t("backToList")}
          </Link>
        </div>
      }
    />
  );
}
