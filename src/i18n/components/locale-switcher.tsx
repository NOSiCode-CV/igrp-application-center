"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";

import { setLocale } from "../actions";
import { LOCALE_NATIVE_NAMES, LOCALES } from "../config";

interface LocaleSwitcherProps {
  className?: string;
}

/**
 * Language selector (FR-24). An icon button — same footprint as the theme
 * toggle — opens a menu of the languages in their native names, the current
 * one marked.
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative size-6", className)}
          disabled={isPending}
          aria-label={failed ? t("changeError") : t("label")}
          title={failed ? t("changeError") : t("label")}
        >
          <IGRPIcon
            iconName="Languages"
            strokeWidth={2}
            className={cn("size-4", isPending && "animate-pulse")}
          />
          {failed && (
            <span
              aria-hidden="true"
              className="bg-destructive absolute top-0 right-0 size-1.5 rounded-full"
            />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
          {failed ? t("changeError") : t("label")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={locale} onValueChange={handleChange}>
          {LOCALES.map((code) => (
            <DropdownMenuRadioItem key={code} value={code} lang={code}>
              {LOCALE_NATIVE_NAMES[code]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
