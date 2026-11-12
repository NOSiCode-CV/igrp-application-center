/** Remembers whether the Report's query panel is folded. A cookie, not
   localStorage, so the server renders the panel in its saved state and it
   does not jump open → closed while the page hydrates. */
export const PANEL_OPEN_COOKIE = "audit-query-panel-open";

/** Where the choice lived before the cookie. */
const LEGACY_STORAGE_KEY = "audit.query-panel.open";

/** Only an explicit "0" folds it: open is the default. */
export function panelOpenFromCookie(value: string | undefined): boolean {
  return value !== "0";
}

export function writePanelOpenCookie(open: boolean): void {
  // Scoped to this app, not every app on the host.
  const path = process.env.NEXT_PUBLIC_BASE_PATH || "/";
  // biome-ignore lint/suspicious/noDocumentCookie: one non-sensitive UI flag; the Cookie Store API is not in every supported browser.
  document.cookie = `${PANEL_OPEN_COOKIE}=${open ? "1" : "0"}; path=${path}; max-age=31536000; samesite=lax`;
}

/** Moves a choice saved by the old localStorage version into the cookie, once.
 * Returns it when it should replace the server's default, else undefined. */
export function migrateLegacyPanelOpen(): boolean | undefined {
  try {
    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy === null) return undefined;
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    if (document.cookie.includes(`${PANEL_OPEN_COOKIE}=`)) return undefined;
    const open = legacy !== "false";
    writePanelOpenCookie(open);
    return open;
  } catch {
    return undefined; // storage unavailable: keep the server's value
  }
}
