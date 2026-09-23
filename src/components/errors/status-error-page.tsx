"use client";

import { useRouter } from "next/navigation";

import { IGRPButton } from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";

import { isDefaultApiErrorMessage } from "@/lib/utilities";

export interface StatusErrorPageProps {
  /** HTTP status from the failed access-manager call, when known. */
  status?: number;
  /** Message extracted from the API error (its ProblemDetail `detail`). */
  message?: string;
}

/** HTTP status → `errors.status.*` message key. */
const STATUS_KEYS = {
  401: "unauthorized",
  403: "forbidden",
  404: "notFound",
  500: "internal",
  503: "unavailable",
} as const;

type StatusKey = (typeof STATUS_KEYS)[keyof typeof STATUS_KEYS] | "fallback";

function statusKeyOf(status: number | undefined): StatusKey {
  return status !== undefined && status in STATUS_KEYS
    ? STATUS_KEYS[status as keyof typeof STATUS_KEYS]
    : "fallback";
}

/**
 * Full-page error for HTTP failures (401/403/404/500/503 + fallback).
 * The title follows the status; the description is the API `detail` as-is
 * when there is one (FR-21), otherwise the generic per-status text. Generic
 * client-side fallbacks (not real API messages) are ignored.
 */
export function StatusErrorPage({ status, message }: StatusErrorPageProps) {
  const router = useRouter();
  const t = useTranslations("errors.status");
  const tActions = useTranslations("common.actions");

  const key = statusKeyOf(status);
  const apiMessage =
    message && !isDefaultApiErrorMessage(message) ? message : undefined;

  return (
    <div
      role="alert"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center"
    >
      {status !== undefined && (
        <span className="text-8xl font-extrabold tracking-tight">{status}</span>
      )}
      <h2 className="text-lg font-semibold">{t(`${key}.title`)}</h2>
      <p className="text-muted-foreground max-w-md text-sm">
        {apiMessage ?? t(`${key}.description`)}
      </p>
      <div className="mt-2 flex gap-3">
        <IGRPButton variant="outline" onClick={() => router.back()}>
          {tActions("back")}
        </IGRPButton>
        <IGRPButton onClick={() => router.push("/")}>
          {tActions("home")}
        </IGRPButton>
      </div>
    </div>
  );
}
