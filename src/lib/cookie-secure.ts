/**
 * `; secure` for a cookie written from the browser, only on https. The browser
 * drops a `Secure` cookie set from an http: page, so NODE_ENV is the wrong
 * signal: a production build served over plain HTTP would lose it.
 * Browser-only (reads `window`); no imports, so edge-safe modules may import it.
 */
export function secureCookieAttr(): string {
  return window.location.protocol === "https:" ? "; secure" : "";
}
