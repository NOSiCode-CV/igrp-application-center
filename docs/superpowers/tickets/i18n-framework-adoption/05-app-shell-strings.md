# 05: App shell strings

**What to build:** The browser tab title, the root and authenticated layouts, the not-found page and the error screens appear in the user's language. They are covered by `lint:i18n`.

**Blocked by:** 01

**Status:** ready-for-agent

**Spec:** `docs/superpowers/specs/2026-10-21-i18n-framework-adoption-spec.md` (story 7 · Plan: Task 6)

- [ ] Static metadata becomes translated metadata under `app.*`, as in the template.
- [ ] The root layout, global error, not-found, the `(igrp)` layout and the `(auth)` folder are added to `lint:i18n`. Every finding is fixed or marked `igrp-i18n-ignore`.
- [ ] `pnpm typecheck`, `pnpm test` and `pnpm lint:i18n` pass.
