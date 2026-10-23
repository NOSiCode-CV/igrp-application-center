# Internationalisation in the Application Center

[I18N.md](I18N.md) is the framework template's guide: next-intl without i18n routing, providers, format helpers, the `igrp-i18n` CLI. This page covers only where the Application Center differs from it or adds to it. When the two disagree, this page is right for this app.

## Model

| Concept | Value |
|---|---|
| Platform locales | `pt`, `en`, `fr`. All three enabled. |
| Default locale | `pt`. Its catalog (`messages/pt.json`) types every key. |
| Format locales | `pt-CV`, `en-GB`, `fr-FR` by default; per deployment via `IGRP_FORMAT_LOCALES` (always region-qualified, e.g. `pt-PT`). Drive dates, numbers and `<html lang>`. |
| Time zone | `IGRP_TIME_ZONE`, default `Atlantic/Cape_Verde`. Applies on server and browser. |
| Resolution | **Session-first**: `session.user.locale` → `IGRP_LOCALE` cookie → `Accept-Language` → `pt`. |
| Catalogs | **Complete** in all three locales. The template allows partial en/fr files; this app does not. |

`IGRP_FORMAT_LOCALES` and `IGRP_TIME_ZONE` are read only in `src/i18n/index.ts` (see `.env.example`).

## Why session-first

The template is cookie-first. The framework switches to session-first on its own when the app passes `persistLocale` to `igrpDefineI18n`, and this app does:

- The language is a property of the **user**, not the browser. It is saved to the profile (`PUT /api/users/me/locale`), so it follows the user to another browser or device and to every IGRP app that reads the same profile.
- The cookie is only a cache. The middleware rewrites it from the token on every authenticated request, so a stale cookie (another device, another app on the host) can't override the profile.
- Without a session (login, after logout, auth bypass) there is nothing to read, so the cookie decides. Because the middleware synced it while the user was signed in, `/login` after sign-out still shows the user's language.

## Where each piece lives

| File | Role |
|---|---|
| `src/i18n/index.ts` | `igrpDefineI18n(...)`: format locales, time zone, `getSessionLocale`, `persistLocale`. Server-only; middleware must not import it. |
| `src/i18n/request.ts` | next-intl request config, registered in `next.config.ts`. |
| `src/i18n/actions.ts` | `setLocale` server action, passed to the switchers. |
| `src/i18n/global.d.ts` | Types `useTranslations` keys from `pt.json` plus the framework namespaces. |
| `src/i18n/session-locale-switcher.tsx` | Switcher for pages with a session; updates the session before the page refreshes. |
| `src/i18n/status.ts` | `useStatusLabel`, `useStatusOptions`: translated labels for API status codes (`common.status.*`). |
| `src/i18n/server-error.ts` | Translated toast and in-page errors from server action results. |
| `src/i18n/time-zone.ts` | Validates `IGRP_TIME_ZONE`; an invalid value logs a warning and falls back to the default. |
| `src/i18n/messages/{pt,en,fr}.json` | Catalogs. One top-level camelCase namespace per feature, nested camelCase keys, ICU. |
| `src/middleware.ts` | `igrpSyncLocaleCookie(..., token.locale, { resolution: "session-first" })`. |

## Changing the language

- **Saving.** `persistLocale` calls `updateCurrentUserLocale` (`src/actions/access-client.ts`). With no session or with auth bypass on it returns `false`: only the cookie changes.
- **Switchers.** `src/app/(igrp)/layout.tsx` and `src/app/(invite)/layout.tsx` (invite visitors have a session) use `SessionLocaleSwitcher`. Only `/login` uses the plain `IGRPLocaleSwitcher`.
- **Session update.** After a persisted change, `SessionLocaleSwitcher` awaits next-auth `update({ locale })` so the refresh renders with the new `session.user.locale`. If the update returns `null` or another locale, it throws. The framework (0.2.0-beta.14+) then saves the previous locale back to the profile, skips the refresh and shows the switcher's error state.
- **Global error.** `src/app/global-error.tsx` renders outside every provider. `<html lang>` is the format locale the provider last rendered with (`igrpLastFormatLocale()`), else the cookie's default region.

## Translating a feature

1. Add a camelCase namespace (`oauthClients`, `serviceAccounts`) to `pt.json`, `en.json` and `fr.json`.
2. Translate every user-facing string: JSX text, `aria-label`, `title`, `placeholder`, toasts, confirm dialogs, empty states, column headers, Zod messages.
3. Keep the pt wording exactly as the literal it replaces. Don't swap in a shared key whose text differs (`common.unknownError` is not "Erro desconhecido"); add a feature key.
4. Client: `useTranslations("ns")`. Server: `await getTranslations("ns")` from `next-intl/server`.
5. Zod schemas take a translator (`(key) => string`) instead of literals (see `src/features/applications/app-schemas.ts`). API enum codes map to keys in a per-feature `lib/i18n.ts` (see `src/features/users/lib/i18n.ts`). Status codes stay API values; use `useStatusLabel` / `useStatusOptions`.
6. Dates, numbers, sorting: `useIGRPFormat()` (client) or `igrpFormatDate(value, await igrpResolveFormatLocale(i18n), undefined, i18n.timeZone)` (server). Never `useFormatter` and never a hardcoded region.
7. Add the feature's folders to the `lint:i18n` script in `package.json`.
8. Delete dead files instead of translating them (grep `src` for importers first).

Style: en uses Sentence case and American spelling. fr uses "rôle" for roles, "profil" for the user profile, the typographic apostrophe `’` and a narrow no-break space (U+202F) before `: ; ! ?`.

## Checks

- `pnpm lint:i18n` (also part of `build`): `check-catalogs` (orphan keys, invalid ICU, argument parity with `pt`, coverage) and `check-literals` over the folders listed in `package.json`, which include `src/components`. Mark a literal that is not language (a parsed token, a fixed formatter locale) with `// igrp-i18n-ignore: <why>`.
- `pnpm typecheck`: fails on any key the code uses that `pt.json` lacks. `lint:i18n` only compares the locales with each other, so it passes when all three lose the same keys. **Run `typecheck` after any IGRP migration that touches the catalogs**: a template migration once replaced all three with the template's 72 keys.
- `src/__tests__/i18n/catalogs.test.ts` fails when an en value equals its pt value, to catch English text left in pt. Genuine cognates and protocol terms go in its `ALLOWED` list.

## Testing

`src/test-setup.ts` wraps every render in `IGRPIntlTestProvider` with `pt`, so assertions use pt text. To render another locale:

```tsx
import { renderWithIntl } from "@/__tests__/helpers/intl";
renderWithIntl(<Page />, { locale: "en" });
```

Add one English-render test per feature's main page, plus one for any dialog or form with its own strings. Build mock data at module scope: unstable mocked query data makes Vitest run out of memory.

## Release notes

- `NEXT_PUBLIC_AUDIT_TIME_ZONE` was removed. `IGRP_TIME_ZONE` drives all date and time formatting.
- The language is session-first: the choice is saved to the user profile and read back from the session.
- `@igrp/framework-next` 0.2.0-beta.14: a failed session update after a language change rolls the profile back instead of refreshing.
