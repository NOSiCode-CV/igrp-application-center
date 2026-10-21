# 02: Catalog fixes

**What to build:** Portuguese users see Portuguese on the user-profile and invite screens. French users see French file-upload and unsaved-changes prompts. User statuses read the same as every other status. App keys that only repeated the framework's text are gone.

**Blocked by:** 01

**Status:** ready-for-agent

**Spec:** `docs/superpowers/specs/2026-10-21-i18n-framework-adoption-spec.md` (stories 1–3, 5 · Plan: Task 2)

- [ ] A test asserts that pt holds no English copy (pt values equal to en, with a small cognate allowlist). It fails before the fix and passes after.
- [ ] The flagged pt values are translated. The matching en values are checked and corrected where they were never really English.
- [ ] en and fr have every pt key; a one-off key diff shows none missing.
- [ ] User ACTIVE/INACTIVE labels come from `common.status.*`. The `users.status.*` keys are removed, and the users tests pass with the `common.status` wording.
- [ ] App `common`, `i18n` and `errors` keys identical to the framework's in all three locales are removed.
- [ ] `lint:i18n` reports 100% coverage for pt, en and fr.
