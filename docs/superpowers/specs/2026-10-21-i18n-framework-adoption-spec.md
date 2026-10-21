# App Center i18n Framework Adoption: Spec

**Status:** ready-for-agent · **Plan:** `docs/superpowers/plans/2026-10-21-i18n-framework-adoption.md` · **Depends on:** framework `0.2.0-beta.11` (`igrp-framework-nextjs/docs/superpowers/specs/2026-10-21-i18n-app-center-readiness-spec.md`)

## Problem Statement

Users of the Application Center get an inconsistent multilingual experience.
- **Missing and wrong translations:** French users hit untranslated file-upload and unsaved-changes prompts. Portuguese users see English on the user-profile and invite screens.
- **Untranslated features:** eight admin features (permissions, profile, accounts, roles, OAuth clients, audit, departments, service accounts) are Portuguese-only whatever language is chosen.
- **The language choice doesn't travel:** it lives only in a browser cookie, so it is lost on another device or browser even though the platform stores a language in each user's profile.
- **Dates in the users screens:** they ignore the deployment's region and time-zone settings, so they can differ from the rest of the UI.

For the team: the app keeps a second, parallel i18n layer of locale constants, message merging, missing-key fallbacks, formatting, a provider, and auth callbacks. All of it duplicates the framework. Part of it is dead, and the docs describe tooling the repo doesn't have. Every framework improvement has to be ported by hand, and the two copies have already drifted (two time-zone settings, two session-locale shapes).

## Solution

- **Framework as the only runtime:** the App Center uses the framework's i18n exactly as the `demo-v1` template does, keeping only its catalogs and feature-specific helpers (status labels, schema translators).
- **Same CI checks as the template:** the framework CLI checks catalogs and hardcoded strings in CI, replacing the local test-based guards.
- **Fixed catalogs:** Portuguese is Portuguese, French is complete, and there is one status vocabulary.
- **Session-first language:** a signed-in user's choice is saved to their profile and synced to the cookie by middleware, so it follows them. Anonymous visitors keep the cookie-only behaviour.
- **Every feature translated:** the eight remaining features are translated one at a time, each locked in by the literal scan as it lands.

## User Stories

1. As a Portuguese-speaking admin, I want every screen in Portuguese, so that I'm not switching between languages on the profile and invite screens.
2. As a French-speaking admin, I want the file-upload and unsaved-changes prompts in French, so that I understand what will happen to my data.
3. As an English-speaking admin, I want English labels everywhere, including the screens where pt and en were the same English text, so that the language is consistent.
4. As an admin, I want permissions, profile, accounts, roles, OAuth clients, audit, departments and service accounts screens in my language, so that the whole App Center is usable in pt, en or fr.
5. As an admin, I want status badges and filters (Active/Inactive) in my language everywhere, so that the same status reads the same on every screen.
6. As an admin, I want validation messages on every form in my language, so that I can correct input without guessing.
7. As an admin, I want the browser tab title and the error screens in my language, so that the shell matches the content.
8. As a signed-in user, I want my language choice saved to my profile, so that it applies on every device and browser I sign in from.
9. As a signed-in user, I want the page to switch language immediately after I choose one, so that I don't need to reload or sign in again.
10. As a signed-in user, I want a clear error if my choice couldn't be saved, with the page left in the old language, so that I'm not misled into thinking it changed.
11. As a user on a second device whose browser remembers another language, I want my profile language to win after I sign in, so that my preference is respected everywhere.
12. As an anonymous visitor on the login page, I want to change the language without signing in, so that I can read the login screen.
13. As an invited user accepting an invitation, I want to change the language on the invite pages without an account yet, so that I understand the onboarding.
14. As a user who signs out, I want the login page to stay in my last language, so that signing out doesn't reset it.
15. As a user whose identity provider sends a regional tag such as `pt-CV`, I want it treated as Portuguese, so that regional variants work.
16. As a user whose identity provider sends an unsupported language, I want the app to fall back to my cookie, browser language, or Portuguese, so that it never breaks.
17. As an admin in a deployment configured for another region or time zone, I want dates and numbers on the users screens to follow that configuration, so that they match every other screen.
18. As an admin, I want date-only values such as an expiry date to keep their calendar day, so that nothing appears a day early or late.
19. As an operator, I want only `IGRP_FORMAT_LOCALES` and `IGRP_TIME_ZONE` to control formatting, so that there is no second, audit-only time-zone variable to keep in sync.
20. As an operator in preview/bypass mode, I want the language switcher to work without calling the API, so that previews don't fail.
21. As a developer, I want CI to fail when a catalog is missing a key, has an orphan key, or has a broken ICU message, so that translation regressions are caught before merge.
22. As a developer, I want CI to fail when a translated folder gains a hardcoded user-facing string, so that translated features stay translated.
23. As a developer, I want a clear way to mark a non-language literal, so that the scan doesn't force fake translations.
24. As a developer, I want the same i18n setup as the template, so that framework upgrades and migrations apply here without porting.
25. As a developer, I want the local duplicates and dead i18n code gone, so that there's one place to read and fix.
26. As a developer writing tests, I want a render helper that mounts the same i18n context as production, framework catalogs included, so that tests match what users see.
27. As a developer writing tests, I want the existing `renderWithIntl` helper to keep working, so that existing tests don't need rewriting.
28. As a developer translating a feature, I want one written recipe (namespaces, schema translators, status helpers, formatting), so that every feature is translated the same way.
29. As a developer, I want `docs/I18N.md` to describe what the code actually does, so that I can trust it.
30. As a reviewer, I want each feature translated in its own change, so that each review is small and reversible.

## Implementation Decisions

- **Runtime:** the framework is the only i18n runtime. The local locale constants, message merge, fallback handlers, formatting module, client provider, and dead error-copy hook are removed. Feature code imports locale constants and formatting from the framework. Schema files use next-intl's augmented `Messages` type.
- **Catalogs:**
  - Three JSON catalogs with one top-level namespace per feature in camelCase; pt is complete and types every key.
  - `errors.codes.*` is removed: framework error copy comes from the chrome catalog.
  - User status labels use `common.status.*`; the `users.status.*` duplicate is removed.
  - App keys identical to framework keys in all three locales are removed so the framework copy shows through.
- **Tooling:**
  - `@igrp/framework-next-i18n` provides `lint:i18n` (catalog check plus literal scan over the translated folders), and `build` runs it.
  - The literal scan's folder list grows with each translated feature.
  - The local test-based guards are removed.
- **Session-first:**
  - `persistLocale` saves through the access-management `PUT /api/users/me/locale` endpoint.
  - It resolves false without any API call when auth bypass is on or there is no session.
  - API failures propagate, so the framework returns a 500 and writes no cookie.
- **Middleware:** at the end of the authenticated branch, middleware syncs the cookie from the token's locale, using an Edge-safe constant built from framework exports (never the app's server-only i18n module).
- **Switcher:**
  - The authenticated layout uses a client wrapper around the framework switcher. Its `onChanged` awaits the next-auth session `update({ locale })` when the choice was persisted; the framework refreshes only after that settles.
  - Login and invite pages keep the plain switcher.
- **Auth:**
  - The app's own jwt and session locale callbacks are removed, along with the dead `session.locale` helper. The framework already maps the IdP claim and session updates to `session.user.locale`.
  - Locale values are normalized when resolved, so regional tags work.
- **Formatting:**
  - Users screens use the framework format hook, which follows `IGRP_FORMAT_LOCALES` / `IGRP_TIME_ZONE` and keeps date-only values on their calendar day.
  - The audit feature's own time-zone constant and `NEXT_PUBLIC_AUDIT_TIME_ZONE` are removed when audit is translated.
- **Feature translation recipe:**
  - `useTranslations` in client code, `getTranslations` in server code.
  - Schema factories take a typed translator and are memoized at call sites.
  - Status codes go through the shared status helpers.
  - Dates and numbers go through the framework format hook.
  - pt copy reuses today's Portuguese strings, so pt users see no wording change.
- **Order:** CLI adoption, then catalog fixes, then duplicate removal (production code and tests land together), then session-first (after framework beta.11), then the app shell, then features smallest-first, then the docs rewrite.

## Testing Decisions

- **What a good test is:** it tests what a user or caller observes (rendered text in a given locale, the result of the set-locale action, cookies on a middleware response, CLI exit status), never module internals.
- **Seams** (agreed with Fidel 2026-10-21):
  1. the `setLocale` server action and the middleware handler, for session-first;
  2. `pnpm lint:i18n`, for catalogs and literals;
  3. rendered components via `renderWithIntl`, for features.

  No new seams.
- **Session-first tests:** anonymous change, bypass mode, signed-in persist, and API failure (no cookie written) through `setLocale`. Stale-cookie rewrite with a `Secure` cookie behind the proxy, regional-tag normalization, and unsupported-tag no-op through middleware. Switcher ordering (refresh only after the session update resolves) through the client wrapper.
- **Catalog test:** a test asserts pt holds no English copy, with a small cognate allowlist.
- **Feature tests:** each translated feature adds one assertion rendering its page title in English, so a missing en key is caught.
- **Prior art:** existing `src/__tests__/i18n/actions.test.ts`, `src/__tests__/middleware/middleware.test.ts`, users component tests using `renderWithIntl`, and `src/__tests__/applications/app-schemas-messages.test.ts`.
- **Known trap:** vitest runs out of memory when mocked data is unstable, so test catalogs are built once at module scope.

## Out of Scope

- **Translating API-originated messages.** The API already receives `Accept-Language`.
- **Zod's built-in default messages.** Only app-supplied messages are translated.
- **New locales beyond pt/en/fr.**
- **Changing the platform's user-metadata model or the locale endpoint.**
- **Saving the language chosen on the login page to the profile at sign-in.** Under session-first, the profile language wins when one is set; this is accepted behaviour.
- **Framework changes.** They are covered by the framework readiness spec.

## Further Notes

- **Language on login:** a user who picks a language on the login page and then signs in will see their profile language if one is saved. If none is saved, the cookie applies. This follows from session-first and is intentional.
- **Second device with an existing session:** that device updates when its session token next carries the new locale (next sign-in). Until then, middleware keeps the cookie in step with that device's token. This is also accepted.
