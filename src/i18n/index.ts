// Server-side i18n configuration. Imports the data layer (session), so it is
// NOT Edge-safe: middleware must import constants from
// `@igrp/framework-next/i18n` directly, never from this file.
import {
  igrpDefineI18n,
  igrpParseFormatLocales,
} from "@igrp/framework-next/i18n";

import { getLayoutConfig } from "@/lib/dal";

/**
 * Platform locales are fixed (pt, en, fr). The region used for formatting is
 * per deployment (`IGRP_FORMAT_LOCALES`, read here and nowhere else), as is the
 * time zone (`IGRP_TIME_ZONE`; unset keeps Atlantic/Cape_Verde, matching pt-CV,
 * so server and browser render dates alike). No
 * `persistLocale`: the choice lives in the `IGRP_LOCALE` cookie.
 */
export const i18n = igrpDefineI18n({
  defaultLocale: "pt",
  formatLocales: igrpParseFormatLocales(process.env.IGRP_FORMAT_LOCALES),
  timeZone: process.env.IGRP_TIME_ZONE || "Atlantic/Cape_Verde",
  getSessionLocale: async () => {
    // Cached per request alongside the root layout's own read. The preview
    // stub session carries no locale, so this is undefined under bypass.
    const { session } = await getLayoutConfig();
    const user = session?.user;
    return user && "locale" in user ? user.locale : undefined;
  },
});
