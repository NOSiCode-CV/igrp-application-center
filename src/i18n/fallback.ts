// Error + fallback handlers shared by the server request config and the
// client provider (functions cannot cross the server→client boundary, so each
// side wires them itself). Keep free of server-only / client-only APIs.

import { type IntlError, IntlErrorCode } from "next-intl";

/**
 * Missing keys (absent from both the requested language and the module
 * default) are warned about, never thrown (FR-12 step 3). Other errors (bad
 * ICU arguments, formatting) are logged as errors.
 */
export function onIntlError(error: IntlError): void {
  if (error.code === IntlErrorCode.MISSING_MESSAGE) {
    console.warn(`[i18n] ${error.message}`);
    return;
  }
  console.error("[i18n]", error);
}

/** Last step of the fallback chain: render the key itself. */
export function getMessageFallback({
  namespace,
  key,
}: {
  namespace?: string;
  key: string;
}): string {
  return namespace ? `${namespace}.${key}` : key;
}
