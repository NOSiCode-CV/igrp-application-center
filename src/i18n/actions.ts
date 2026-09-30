"use server";

import { cookies } from "next/headers";

import { updateCurrentUserLocale } from "@/actions/access-client";
import type { ActionResult } from "@/actions/types";
import { serverSession } from "@/lib/auth";
import { isAuthBypass, toActionError } from "@/lib/utilities";

import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_OPTIONS,
  type Locale,
  normalizeLocale,
} from "./config";

export type SetLocaleResult = ActionResult<{
  locale: Locale;
  /**
   * `true` when the preference was persisted for a signed-in user. The caller
   * must then run next-auth `update({ locale })` so the session token follows,
   * and finally `router.refresh()` (FR-25).
   */
  authenticated: boolean;
}>;

/**
 * Changes the UI language.
 *
 * 1. Validates the value against the platform languages (FR-11).
 * 2. Signed in: persists `metadata.locale` via `PUT /api/users/me/locale`.
 *    On failure nothing else changes (the cookie would otherwise be reset to
 *    the session locale by the middleware anyway).
 * 3. Writes the `IGRP_LOCALE` cookie (FR-25, FR-26).
 */
export async function setLocale(value: string): Promise<SetLocaleResult> {
  const locale = normalizeLocale(value);
  if (!locale) {
    return {
      success: false,
      error: `Unsupported locale: ${value}`,
      status: 400,
    };
  }

  const authenticated = !isAuthBypass() && (await serverSession()) !== null;

  if (authenticated) {
    try {
      await updateCurrentUserLocale(locale);
    } catch (error) {
      console.error("[i18n] Failed to persist the user locale:", error);
      return { success: false, ...toActionError(error) };
    }
  }

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, LOCALE_COOKIE_OPTIONS);

  return { success: true, data: { locale, authenticated } };
}
