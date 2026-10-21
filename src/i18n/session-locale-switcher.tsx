"use client";

import { IGRPLocaleSwitcher } from "@igrp/framework-next/i18n/client";
import { useSession } from "next-auth/react";

import { setLocale } from "./actions";

/**
 * Language selector for signed-in pages. A choice saved to the profile also
 * updates the session token; awaited, because the framework refreshes the
 * page once `onChanged` settles and the refresh must see the new locale.
 */
export function SessionLocaleSwitcher() {
  const { update } = useSession();
  return (
    <IGRPLocaleSwitcher
      action={setLocale}
      onChanged={async (locale, persisted) => {
        if (persisted) await update({ locale });
      }}
    />
  );
}
