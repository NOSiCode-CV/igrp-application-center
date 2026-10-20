"use client";

// Segment-level error boundary for the `(auth)` route group — covers
// /login, /logout, and anything else rendered under the auth layout.
//
// Auth failures are the most common concrete reason a user sees this screen,
// so an error without a platform code gets the auth-scoped copy from the
// framework's `errors.auth` messages (translated) instead of the generic one.

import { useEffect } from "react";

import {
  type IGRPErrorCopyResolver,
  IGRPSegmentError,
} from "@igrp/framework-next-ui";
import { useTranslations } from "next-intl";

import { resolvePublicErrorCopy } from "@/lib/error-copy";
import { reportError } from "@/lib/report-error";

export default function AuthSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors.auth");

  useEffect(() => {
    reportError(error, { segment: "(auth)" });
  }, [error]);

  const resolveAuthCopy: IGRPErrorCopyResolver = (err) => {
    if ("code" in err) return resolvePublicErrorCopy(err);
    return { title: t("title"), description: t("description") };
  };

  return (
    <IGRPSegmentError
      error={error}
      reset={reset}
      resolveCopy={resolveAuthCopy}
    />
  );
}
