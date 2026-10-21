# 03: Remove local duplicates and move tests to the framework provider

**What to build:** The App Center has one i18n runtime: the framework's. Dates and numbers on the users screens follow `IGRP_FORMAT_LOCALES` and `IGRP_TIME_ZONE`, and date-only values keep their calendar day. Tests render inside the same i18n context as production, framework catalogs included. The existing `renderWithIntl` helper keeps its signature.

**Blocked by:** 02

**Status:** ready-for-agent

**Spec:** `docs/superpowers/specs/2026-10-21-i18n-framework-adoption-spec.md` (stories 17–18, 25–27 · Plan: Tasks 3 and 4, landing in one commit)

- [ ] The local locale-config, message-merge, fallback and formatting modules, the unused provider, and the unused error-copy hook are deleted, together with the `errors.codes.*` keys.
- [ ] Users screens use the framework format hook. Locale constants and normalization come from the framework. Schema files use next-intl's augmented `Messages` type.
- [ ] The test helper and the global test setup are rebuilt on `IGRPIntlTestProvider`; test catalogs are built once at module scope.
- [ ] Tests that merged catalogs by hand use the framework merge helpers.
- [ ] Any changed date assertion is explained by the date-only rule. Any other formatting difference is reported, not papered over.
- [ ] A search for imports of the removed modules finds nothing.
- [ ] `pnpm typecheck`, `pnpm test` and `pnpm lint:i18n` pass.
