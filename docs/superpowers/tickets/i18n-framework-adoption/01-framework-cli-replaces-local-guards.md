# 01: Framework CLI replaces the local checks

**What to build:** CI and `pnpm build` check the App Center's catalogs and its translated folders with the framework's `igrp-i18n` CLI, the same tool the template uses. The local test-based guards are gone. The framework is on 0.2.0-beta.10.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**Spec:** `docs/superpowers/specs/2026-10-21-i18n-framework-adoption-spec.md` (stories 21–24 · Plan: Task 1)

- [ ] Dependencies are `@igrp/framework-next` and `-ui` 0.2.0-beta.10, design system 0.2.0-beta.7, and devDependency `@igrp/framework-next-i18n` 0.2.0-beta.2.
- [ ] `lint:i18n` runs `check-catalogs` with default `pt`, then `check-literals` over the previously guarded folders (minus the dead i18n components folder) plus `src/components`.
- [ ] `build` runs `lint:i18n` before `next build`.
- [ ] Every `check-literals` finding is fixed or marked `igrp-i18n-ignore`. If `src/components` has more than about 10 findings, it is dropped and reported rather than expanding this ticket.
- [ ] The local literal-guard and catalog-consistency tests are deleted.
- [ ] `pnpm typecheck`, `pnpm test` and `pnpm lint:i18n` pass.
