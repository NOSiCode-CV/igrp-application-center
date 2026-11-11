# Upgrading your app with `@igrp/template-migrator`

When a new IGRP Framework version ships, this CLI applies all the required source changes to your app automatically — new files, updated middleware, dependency bumps, and new `.env.example` keys.

Your own `.env` is never touched — see [Environment variables](#environment-variables) for the one manual step that involves.

No permanent install is needed. Run it on demand with `pnpm dlx` or `npx`.

---

## Install / run

```bash
# Check what needs upgrading
pnpm dlx @igrp/template-migrator@latest status

# Preview changes (no files are written)
pnpm dlx @igrp/template-migrator@latest plan

# Apply all pending migrations
pnpm dlx @igrp/template-migrator@latest apply
```

---

## Commands

### `status` — see where you stand

```bash
pnpm dlx @igrp/template-migrator@latest status
```

```
Template: demo-v1  CLI: 0.1.0-beta.134

  ✓ applied  01-preview-mode-not-found
  ✓ applied  02-access-sync-config-refactor
  ...
  ✓ applied  27-csp-hsts-headers
  • pending  28-resync-beta165-query-provider-split
  • pending  29-permissions-catalog-sync

27 applied, 2 pending
```

- **✓ applied** — already done, will be skipped.
- **• pending** — will be processed on the next `apply`.

An app **scaffolded from the current template zip** starts with every migration already applied — the zip ships a `.igrp-migrations-lock.json` recording them, because the template tree already contains their result. A first `status` on a fresh app should therefore report `0 pending`.

---

### `plan` — preview without writing

```bash
pnpm dlx @igrp/template-migrator@latest plan
```

Prints every file operation each pending migration will perform. Nothing is written to disk — safe to run at any time.

```
Pending migrations (1):

── 07-data-access-layer ───────────────────────────────────────
  file.create src/lib/dal.ts
  file.write  src/lib/auth.ts  (replace)
  deps.bump   package.json

No files were written.
```

---

### `apply` — run the migrations

```bash
pnpm dlx @igrp/template-migrator@latest apply
```

The CLI walks through each pending migration in order. For each step it shows what it is about to do and asks for confirmation before writing. After each completed migration it records an entry in `.igrp-migrations-lock.json` — so if the run is interrupted you can re-run `apply` and it will resume from where it stopped.

When done, if any `package.json` dependency was bumped the CLI prints:

```
Next steps:
  pnpm install
```

Run `pnpm install` whenever that message appears.

#### Skip prompts — CI / scripted runs

```bash
pnpm dlx @igrp/template-migrator@latest apply --yes
```

#### Apply only up to a specific migration

```bash
pnpm dlx @igrp/template-migrator@latest apply --to 04-multi-auth-provider
```

---

### `list` — show all migrations bundled in this CLI version

```bash
pnpm dlx @igrp/template-migrator@latest list
```

---

### `rollback` — undo the last applied migration

```bash
pnpm dlx @igrp/template-migrator@latest rollback 04-multi-auth-provider
```

Restores the files that migration wrote and removes its entry from the lock file. Undo steps run in reverse order, so a migration that deleted and recreated the same path unwinds correctly.

Rollback **refuses rather than half-restoring**. When a migration overwrote or deleted a file and the lock entry has no stored copy of the prior content — which is the case for entries written by older CLI versions — it lists those paths and stops:

```
Cannot fully roll back 04-multi-auth-provider — no stored undo content for:
  - file.write  src/middleware.ts
```

Restore those files yourself (from git, usually), or re-run with `--force` to roll back every other step and leave the listed files untouched:

```bash
pnpm dlx @igrp/template-migrator@latest rollback 04-multi-auth-provider --force
```

Rollback is not atomic: if it is interrupted, re-running it is safe — the restores are idempotent and the stored payloads stay in the lock until the final write.

**Migrations that came with your app can't be rolled back.** If your app was scaffolded from the template zip, it arrived with every migration already recorded — the template already contained their result, so the CLI never ran them here and captured nothing to reverse. Rollback refuses those rather than quietly removing the record:

```
Cannot roll back 29-permissions-catalog-sync — nothing to reverse.
```

Revert the files yourself (from git) if you need to undo one. `--force` drops the lock entry without touching files, which makes the next `apply` re-run the migration.

---

### `convert` — upgrade a legacy lock file

Early versions kept migration state at `.igrpmigrations/lock.json`. If you have one, every other command stops and points you here:

```bash
pnpm dlx @igrp/template-migrator@latest convert
```

This moves the state to `.igrp-migrations-lock.json` at your project root and removes the old directory. Commit the result, then re-run whatever you were doing. Running it twice is harmless — it recovers cleanly from an interrupted conversion.

---

### `check` — CI gate

```bash
pnpm dlx @igrp/template-migrator@latest check
```

Exits with code `1` if any migration is pending, `0` if everything is up to date. Add it to your pipeline:

```yaml
- name: Check for pending IGRP migrations
  run: pnpm dlx @igrp/template-migrator@latest check
```

---

## Environment variables

Migrations write **only `.env.example`**. Your real `.env` is never read or modified — it holds secrets, it is gitignored, and it never ships in the template zip.

That means a migration introducing a new setting leaves your running app without it. After an `apply` that reports new keys, diff the two files and copy across what you need:

```bash
git diff .env.example
```

Keys with a sensible default (`IGRP_SYNC_ACCESS=false`, `AUTH_PROVIDER=keycloak`) can usually be left alone until you want them. Keys with **no default are the ones that bite** — `AUTENTIKA_CLIENT_ID`, `AUTENTIKA_CLIENT_SECRET`, `AUTENTIKA_HOST` and similar credentials must be filled in before the app will boot against that provider.

`apply` prints a reminder naming the file whenever a migration adds keys.

---

## The lock file

After each successful migration `apply` writes `.igrp-migrations-lock.json` to your project root. **Commit this file.** It is the source of truth for which migrations your app has applied — re-running `apply` always skips completed entries.

---

## Migration history

| # | ID | What changed | Target framework |
|---|---|---|---|
| 01 | `01-preview-mode-not-found` | Preview mode bypass, custom 404 | — |
| 02 | `02-access-sync-config-refactor` | Access Management sync, config helpers | beta.84 |
| 03 | `03-tailwind-v4-tokens` | Tailwind v4 `@source` / token-only imports | — |
| 04 | `04-multi-auth-provider` | Multi-provider auth (`AUTH_PROVIDER`), central `auth.ts` | beta.113 |
| 05 | `05-edge-safe-auth-bypass` | Edge-safe auth refactor, `isAuthBypass()` unification | beta.114 |
| 06 | `06-error-handling-overhaul` | Typed error hierarchy, full App Router error boundaries | beta.115 |
| 07 | `07-data-access-layer` | Data Access Layer (`verifySession`, `getAuthenticatedUser`), complete `isAuthBypass` in `getSession` | beta.120 |
| 08 | `08-m2m-oauth2-client-credentials` | M2M OAuth2 `client_credentials` | beta.137 |
| 09 | `09-sync-on-code-menus` | Re-introduce `IGRP_SYNC_ON_CODE_MENUS` | beta.139 |
| 10 | `10-session-refetch-and-menu-role-sync` | Configurable session refetch + menu-role sync control | beta.142 |
| 11 | `11-callbackurl-hardening-and-error-copy` | `callbackUrl` hardening + `AppError` error copy | beta.142 |
| 12 | `12-template-resync` | Template resync | beta.144 |
| 13 | `13-resync-beta145` | Resync to framework beta.145 | beta.145 |
| 14 | `14-deferred-logout-and-cleanup` | Deferred logout & cleanup | beta.148 |
| 15 | `15-resync-beta149` | Resync to beta.149 | beta.149 |
| 16 | `16-resync-beta150` | Resync to beta.150 | beta.150 |
| 17 | `17-sidebar-menu-search-config` | Sidebar menu search config | beta.151 |
| 18 | `18-email-scope-enable` | Email scope enabled | beta.153 |
| 19 | `19-adaptive-session-refresh` | Adaptive session refresh | beta.153 |
| 20 | `20-sidebar-trigger-in-header` | Sidebar toggle moved into the header | beta.158 |
| 21 | `21-template-resync-catchup` | Template resync catch-up | — |
| 22 | `22-session-args-auth-bypass` | Session refetch honours `AUTH_PROVIDER=none` | — |
| 23 | `23-per-request-layout-and-routes-cache` | Per-request layout config + routes cache | — |
| 24 | `24-resync-beta159` | Resync to beta.159 | beta.159 |
| 25 | `25-resync-beta160` | Resync to beta.160 | beta.160 |
| 26 | `26-catchup-untracked-and-drifted` | Catch-up for untracked + drifted files | beta.160 |
| 27 | `27-csp-hsts-headers` | CSP + HSTS security headers | — |
| 28 | `28-resync-beta165-query-provider-split` | Resync to beta.165 + query-provider split | beta.165 |
| 29 | `29-permissions-catalog-sync` | Permissions catalog sync to Access Management | — |

This table is a snapshot. For the authoritative list shipped by the CLI you are actually running:

```bash
pnpm dlx @igrp/template-migrator@latest list
```

Full prose guides with before/after code live in the framework repo under `packages/framework/template-migrator/migrations/demo-v1/`; each migration's guide file is named in the manifest as `guideHref`.

---

## Troubleshooting

**Partially applied migration** — re-run `apply`. If a run was interrupted (Ctrl-C, a CI timeout, a crash) partway through a migration, the CLI leaves a `.igrp-migration-journal.json` in your project root recording what had already run. The next `apply` reverts those steps first, then re-applies the migration from a clean baseline:

```
Recovering from an interrupted run of 29-permissions-catalog-sync...
  reverted 3 step(s) from the interrupted migration
  ✓ recovered
```

This matters for more than tidiness — without it the retry would treat the half-migrated files as the "original" state and record an undo that restores the wrong content. The journal is transient: it exists only while a migration is in flight, and you should not commit it. If recovery reports a path it could not restore, fix that path (from git) before re-running.

**Build fails after applying** — roll back, check that migration's prose guide for manual steps your app may need, then re-apply:

```bash
pnpm dlx @igrp/template-migrator@latest rollback <id>
# make any manual adjustments
pnpm dlx @igrp/template-migrator@latest apply --to <id>
```

**Lock file missing but migrations were already applied** — re-run `apply`. Overwrites are idempotent (same content), then the lock entries are written correctly.
