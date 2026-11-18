"use client";

import { IGRPLocaleSwitcher } from "@igrp/framework-next/i18n/client";
import { useSession } from "next-auth/react";

import { setLocale } from "./actions";

/**
 * Language selector for signed-in pages. A choice saved to the profile also
 * updates the session token; awaited, because the framework refreshes the
 * page once `onChanged` settles and the refresh must see the new locale.
 *
 * `update()` resolves `null` instead of rejecting when the session can't be
 * written (e.g. the session store is down). Throwing then lets the switcher
 * show its error state; otherwise the page would silently revert on the next
 * request, when middleware re-syncs the cookie from the stale token.
 */
export function SessionLocaleSwitcher() {
  const { update } = useSession();
  return (
    <IGRPLocaleSwitcher
      action={setLocale}
      onChanged={async (locale, persisted) => {
        if (!persisted) return;
        const user = (await update({ locale }))?.user;
        if (!user || !("locale" in user) || user.locale !== locale) {
          throw new Error(`Session locale not updated to ${locale}`);
        }
      }}
    />
  );
}
