// Server-side i18n configuration. Imports the data layer (session), so it is
// NOT Edge-safe: middleware must import constants from
// `@igrp/framework-next/i18n` directly, never from this file.
import {
  igrpDefineI18n,
  igrpParseFormatLocales,
} from "@igrp/framework-next/i18n";

import { updateCurrentUserLocale } from "@/actions/access-client";
import { serverSession } from "@/lib/auth";
import { getLayoutConfig } from "@/lib/dal";
import { isAuthBypass } from "@/lib/utilities";

import { resolveTimeZone } from "./time-zone";

/**
 * Platform locales are fixed (pt, en, fr). The region used for formatting is
 * per deployment (`IGRP_FORMAT_LOCALES`, read here and nowhere else), as is the
 * time zone (`IGRP_TIME_ZONE`; unset keeps Atlantic/Cape_Verde, matching pt-CV,
 * so server and browser render dates alike).
 *
 * Session-first: a signed-in user's choice is saved to their profile
 * (`persistLocale`) and reaches the page through `session.user.locale`;
 * middleware syncs the `IGRP_LOCALE` cookie from the token so sessionless
 * pages (login after logout) follow it. Anonymous visitors change the cookie.
 */
export const i18n = igrpDefineI18n({
  defaultLocale: "pt",
  formatLocales: igrpParseFormatLocales(process.env.IGRP_FORMAT_LOCALES),
  timeZone: resolveTimeZone(process.env.IGRP_TIME_ZONE),
  getSessionLocale: async () => {
    // Cached per request alongside the root layout's own read. The preview
    // stub session carries no locale, so this is undefined under bypass.
    const { session } = await getLayoutConfig();
    const user = session?.user;
    return user && "locale" in user ? user.locale : undefined;
  },
  // `false` = no session to write to: only the cookie changes. API errors
  // propagate, so igrpSetLocale answers 500 and writes no cookie.
  persistLocale: async (locale) => {
    if (isAuthBypass() || !(await serverSession())) return false;
    await updateCurrentUserLocale(locale);
    return true;
  },
});
