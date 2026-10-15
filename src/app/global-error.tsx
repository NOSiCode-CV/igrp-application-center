"use client";

// Root-segment error boundary.
//
// Next.js App Router requires a `global-error.tsx` at the root to catch
// errors thrown while rendering the root `layout.tsx` / `template.tsx` — the
// nearest `error.tsx` boundary cannot catch those because the layout they
// live under is itself the one that failed. `global-error.tsx` replaces the
// *entire* document, so we must ship our own `<html>` / `<body>`.
//
// This file renders `IGRPGlobalError` (the full-page error component) and
// hands logging off to `reportError`, which in prod is the single hook to
// wire a real observability backend into. The copy comes from the framework's
// chrome catalog through its cookie fallback: no provider is mounted here.

import { useEffect, useSyncExternalStore } from "react";

import {
  IGRP_DEFAULT_FORMAT_LOCALES,
  IGRP_LOCALE_COOKIE,
  igrpNormalizeLocale,
} from "@igrp/framework-next/i18n";
import { IGRPGlobalError } from "@igrp/framework-next-ui";

import { resolvePublicErrorCopy } from "@/lib/error-copy";
import { reportError } from "@/lib/report-error";

// No provider is mounted here (the failing root layout is what mounts it), so
// the document language comes from the IGRP_LOCALE cookie, read the same way
// `useIGRPChromeI18n` reads it: pt on the server, the cookie on the client.
const noopSubscribe = () => () => {};
function readCookieFormatLocale(): string {
  const entry = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${IGRP_LOCALE_COOKIE}=`));
  const locale =
    igrpNormalizeLocale(entry?.slice(IGRP_LOCALE_COOKIE.length + 1)) ?? "pt";
  return IGRP_DEFAULT_FORMAT_LOCALES[locale];
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const lang = useSyncExternalStore(
    noopSubscribe,
    readCookieFormatLocale,
    () => IGRP_DEFAULT_FORMAT_LOCALES.pt,
  );

  useEffect(() => {
    reportError(error, { segment: "global" });
  }, [error]);

  return (
    <html lang={lang}>
      <body>
        <IGRPGlobalError
          error={error}
          reset={reset}
          resolveCopy={resolvePublicErrorCopy}
        />
      </body>
    </html>
  );
}
