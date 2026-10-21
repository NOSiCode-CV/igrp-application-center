# 04: Session-first

**What to build:** A signed-in user's language choice is saved to their profile and applies on every device they sign in from. The page switches straight away, with no reload or new sign-in. If saving fails, the user sees the switcher's error and the language stays as it was. Anonymous visitors on login and invite pages, and preview/bypass mode, keep the cookie-only behaviour without calling the API. After sign-in, the profile language wins over a stale cookie.

**Blocked by:** 03; framework ticket `i18n-app-center-readiness/05` (release beta.11)

**Status:** ready-for-agent

**Spec:** `docs/superpowers/specs/2026-10-21-i18n-framework-adoption-spec.md` (stories 8–16, 20 · Plan: Task 5)

- [ ] The framework is bumped to beta.11 and the matching next-i18n version.
- [ ] Through `setLocale`:
  - with no session, the result is `persisted: false`, the cookie is written, and no API call is made;
  - in bypass mode, there is no API call;
  - signed in, the change is saved via `PUT /api/users/me/locale` and the result is `persisted: true`;
  - when the API fails, the result is a 500 and no cookie is written.
- [ ] Through middleware:
  - a stale cookie is rewritten from the token locale as `Secure` behind `x-forwarded-proto: https`;
  - `pt-CV` becomes `pt`;
  - an unsupported `es` changes nothing.
- [ ] The authenticated layout uses a switcher wrapper that awaits the session update when the choice was persisted. A test proves the refresh happens only after the update resolves. The login and invite pages keep the plain switcher.
- [ ] The app's own jwt and session locale callbacks and the dead session-locale helper are removed, along with its test.
- [ ] Manual check with a real sign-in:
  1. Switching saves the language (204) and re-renders.
  2. Clearing the cookie and reloading keeps the language and restores the cookie.
  3. Signing out leaves the login page in that language.
