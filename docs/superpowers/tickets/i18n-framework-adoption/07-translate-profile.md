# 07: Translate Profile

**What to build:** The Profile screens (feature code and its settings routes) show in pt, en or fr: labels, status badges and filters, form validation messages, dates and numbers. pt users see the same Portuguese wording as today. `lint:i18n` keeps the feature translated from here on.

**Blocked by:** 01

**Status:** ready-for-agent

**Spec:** `docs/superpowers/specs/2026-10-21-i18n-framework-adoption-spec.md` (stories 4–6, 28, 30 · Plan: Tasks 7–14, shared recipe)

- [ ] The feature folder and its route folder(s) are added to `lint:i18n`, which reports `no hardcoded strings` for them.
- [ ] There is a new top-level camelCase namespace in pt, en and fr, and coverage stays at 100%.
- [ ] Client code uses `useTranslations` and server code uses `getTranslations`.
- [ ] Zod schemas are factories that take a typed translator and are memoized at call sites.
- [ ] Status labels and options use the shared status helpers, not `STATUS_OPTIONS` or `showStatus`.
- [ ] Dates and numbers use the framework format hook, never `toLocale*` or `new Intl.*`.
- [ ] The feature's existing tests pass, and one new test renders the page title in English.
