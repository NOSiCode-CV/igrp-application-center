# 14: Remove the Portuguese-only status helpers

**What to build:** Once no feature uses them, the Portuguese-only `STATUS_OPTIONS` labels and `showStatus` are deleted. Every status label in the App Center then comes from the catalogs.

**Blocked by:** 06, 07, 08, 09, 10, 11, 12, 13

**Status:** ready-for-agent

**Spec:** `docs/superpowers/specs/2026-10-21-i18n-framework-adoption-spec.md` (story 5 · Plan: the step after Task 14)

- [ ] A search for `STATUS_OPTIONS` or `showStatus` finds only their definitions, which are then deleted.
- [ ] A search for the audit time-zone constant finds nothing.
- [ ] `pnpm typecheck`, `pnpm test` and `pnpm lint:i18n` pass.
