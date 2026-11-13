import { basePathCookiePath } from "@igrp/framework-next-auth/cookies";

import { secureCookieAttr } from "@/lib/cookie-secure";

/** Remembers whether the Report's query panel is folded. A cookie, not
   localStorage, so the server renders the panel in its saved state and it
   does not jump open → closed while the page hydrates. */
export const PANEL_OPEN_COOKIE = "audit-query-panel-open";

/** Only an explicit "0" folds it: open is the default. */
export function panelOpenFromCookie(value: string | undefined): boolean {
  return value !== "0";
}

export function writePanelOpenCookie(open: boolean): void {
  const path = basePathCookiePath(process.env.NEXT_PUBLIC_BASE_PATH);
  // biome-ignore lint/suspicious/noDocumentCookie: one non-sensitive UI flag; the Cookie Store API is not in every supported browser.
  document.cookie = `${PANEL_OPEN_COOKIE}=${open ? "1" : "0"}; path=${path}; max-age=31536000; samesite=lax${secureCookieAttr()}`;
}
