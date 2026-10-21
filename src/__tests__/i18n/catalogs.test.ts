import { describe, expect, it } from "vitest";

import en from "@/i18n/messages/en.json";
import pt from "@/i18n/messages/pt.json";

function flat(o: object, p = ""): Record<string, string> {
  return Object.entries(o).reduce<Record<string, string>>((acc, [k, v]) => {
    if (typeof v === "object" && v !== null)
      Object.assign(acc, flat(v, `${p}${k}.`));
    else acc[`${p}${k}`] = String(v);
    return acc;
  }, {});
}

// True cognates / brand names that are legitimately identical in pt and en.
const ALLOWED = new Set([
  "Email",
  "URL",
  "ID",
  "Slug",
  "OAuth",
  "Middleware", // product / layer names
  "Access Management",
  "johndoe", // example placeholders
  "page-slug",
  // OAuth protocol terms, kept in English in every language (oauth-clients)
  "Client ID",
  "Client ID *",
  "Client secret",
  "Grant types",
  "Redirect URIs",
  "Scopes",
  "Access token",
  "Refresh token",
  "Authorization code",
  "= {value}",
]);

describe("catalogs", () => {
  it("pt holds no English copy", () => {
    const ptFlat = flat(pt);
    const enFlat = flat(en);
    const suspects = Object.entries(ptFlat)
      .filter(
        ([k, v]) =>
          enFlat[k] === v && !ALLOWED.has(v) && /\b[a-z]{4,}\b/i.test(v),
      )
      .map(([k, v]) => `${k}: ${v}`);
    expect(suspects).toEqual([]);
  });
});
