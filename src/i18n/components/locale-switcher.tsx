"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { IGRPSelect } from "@igrp/igrp-framework-react-design-system";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";

import { setLocale } from "../actions";
import { LOCALE_NATIVE_NAMES, LOCALES } from "../config";

const OPTIONS = LOCALES.map((locale) => ({
  value: locale,
  label: LOCALE_NATIVE_NAMES[locale],
}));

interface LocaleSwitcherProps {
  className?: string;
}

/**
 * Language selector (FR-24). Options use the native language names.
 *
 * Flow (FR-25/26): server action `setLocale` (persists `metadata.locale` when
 * signed in + writes the cookie) → next-auth `update({ locale })` when signed
 * in, so the session token follows without a new login → `router.refresh()`
 * to re-render the server tree in the new language.
 */
export function LocaleSwitcher({ className }: LocaleSwitcherProps) {
  const t = useTranslations("i18n.localeSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const { update } = useSession();
  const [isPending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  const handleChange = (next: string) => {
    if (next === locale) return;
    setFailed(false);
    startTransition(async () => {
      const result = await setLocale(next);
      if (!result.success) {
        setFailed(true);
        return;
      }
      if (result.data.authenticated) {
        await update({ locale: result.data.locale });
      }
      router.refresh();
    });
  };

  return (
    <IGRPSelect
      name="locale"
      label={t("label")}
      options={OPTIONS}
      value={locale}
      onValueChange={handleChange}
      disabled={isPending}
      error={failed ? t("changeError") : undefined}
      className={className}
    />
  );
}
