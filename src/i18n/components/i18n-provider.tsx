"use client";

import type { ReactNode } from "react";

import { IGRPI18nProvider } from "@igrp/igrp-framework-react-design-system";
import { type AbstractIntlMessages, NextIntlClientProvider } from "next-intl";

import type { Locale } from "../config";
import { getMessageFallback, onIntlError } from "../fallback";

interface I18nProviderProps {
  locale: Locale;
  /** Already merged with the module default on the server (`request.ts`). */
  messages: AbstractIntlMessages;
  children: ReactNode;
}

/**
 * Client-side i18n context: next-intl (module messages) + the design-system
 * string catalog. The error/fallback handlers are functions, which cannot be
 * passed from the server layout, so they are wired here.
 *
 * `IGRPI18nProvider` keeps its pt-PT defaults for now: no design-system
 * overrides exist yet for `en`/`fr` (FR-14 accepts the mix).
 */
export function I18nProvider({
  locale,
  messages,
  children,
}: I18nProviderProps) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      onError={onIntlError}
      getMessageFallback={getMessageFallback}
    >
      <IGRPI18nProvider>{children}</IGRPI18nProvider>
    </NextIntlClientProvider>
  );
}
