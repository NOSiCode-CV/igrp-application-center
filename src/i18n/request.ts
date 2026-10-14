import { getRequestConfig } from "next-intl/server";

import { PLATFORM_TIME_ZONE } from "@/features/audit/lib/platform-time";

import { getMessageFallback, onIntlError } from "./fallback";
import { getMessagesFor } from "./messages";
import { resolveLocale } from "./resolve-locale";

/**
 * next-intl request config, used WITHOUT i18n routing: the locale is resolved
 * per request (session → cookie → Accept-Language → platform default) and
 * never appears in the URL (FR-7). Wired via `createNextIntlPlugin` in
 * `next.config.ts`.
 */
export default getRequestConfig(async () => {
  const locale = await resolveLocale();
  return {
    locale,
    messages: getMessagesFor(locale),
    // One fixed zone (ADR-0001), so server and browser render the same times.
    timeZone: PLATFORM_TIME_ZONE,
    onError: onIntlError,
    getMessageFallback,
  };
});
