# App Center i18n Framework Adoption Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The App Center keeps only its catalogs and its feature-specific i18n code. Everything else comes from `@igrp/framework-next` i18n, the way `templates/demo-v1` does it. The App Center becomes **session-first**: the user's language is saved to their profile and follows them across devices. Every feature is translated.

**Architecture:**
1. Adopt the framework CLI (`igrp-i18n`) in place of the local Vitest guards, and fix the catalogs it exposes.
2. Delete the local duplicates (`config.ts`, `messages.ts`, `fallback.ts`, `format.ts`, the dead provider and error-copy hook) and point code and tests at framework exports.
3. After framework `0.2.0-beta.11`, switch to session-first: `persistLocale` → `PUT /api/users/me/locale`, middleware cookie sync, and a switcher that refreshes the session.
4. Translate the eight remaining features one at a time, each added to `lint:i18n` as it lands.

**Tech Stack:** Next 15.5, React 19, next-intl 4, next-auth (via `@igrp/framework-next-auth`), Vitest, Biome.

**Spec:**
- `docs/superpowers/specs/2026-10-21-i18n-framework-adoption-spec.md` (this repo).
- `igrp-framework-nextjs/docs/superpowers/specs/2026-10-12-framework-i18n-v2-design.md`, appendix "Application center deltas".
- Framework prerequisite plan: `igrp-framework-nextjs/docs/superpowers/plans/2026-10-21-i18n-app-center-readiness.md`.
- Recipe for migrating a feature: `git show 441bee4:docs/I18N.md`, section "Migrating the next feature".

## Global Constraints

- Locales `pt`, `en`, `fr`; `pt` is the default and the complete catalog that types every key (`src/i18n/global.d.ts`).
- Env: `IGRP_FORMAT_LOCALES` and `IGRP_TIME_ZONE` (default `Atlantic/Cape_Verde`) are the only formatting settings, read only in `src/i18n/index.ts`.
- Cookie `IGRP_LOCALE`, written only by framework functions.
- Catalog keys are camelCase segments, nested, ICU syntax; one top-level namespace per feature.
- API status codes stay API values (`ACTIVE`); only labels are translated (`common.status.*`).
- Work one surface at a time. A task that would reach beyond its feature says so instead of doing it.
- Every task ends green:

  ```bash
  pnpm typecheck && pnpm test && pnpm lint:i18n
  ```

  Run `pnpm exec biome check --write <changed files>`, never Biome over the whole repo.

## Review Focus

1. **Anonymous visitor changes language on `/login` or an invite page.** The cookie changes, there is no API call and no redirect, and the result has `persisted: false` (Task 5 test).
2. **Access-management API fails during a change.** The switcher shows `i18n.localeSwitcher.changeError`, the cookie is unchanged, and the page stays in the old language (Task 5 test).
3. **User signs in on a second device whose cookie holds another language.** The profile locale wins, and middleware rewrites the cookie on the first authenticated request (Task 5 middleware test).
4. **Auth bypass / preview mode.** `persistLocale` resolves `false` without calling the API (Task 5 test).
5. **IdP `locale` claim `pt-CV` or an unsupported value such as `es`.** `pt-CV` resolves to `pt`; `es` is ignored, and resolution falls through to cookie, then Accept-Language, then `pt` (Task 5 middleware test; the framework already covers the resolver).

---

### Task 1: Framework CLI replaces the local guards

**Files:**
- Modify: `package.json`
  - deps: `@igrp/framework-next` and `@igrp/framework-next-ui` `0.2.0-beta.10`; `@igrp/igrp-framework-react-design-system` `0.2.0-beta.7`
  - devDeps: add `@igrp/framework-next-i18n` `0.2.0-beta.2`
  - scripts: `lint:i18n`, and `build`
- Delete: `src/__tests__/i18n/literal-strings.test.ts`, `src/__tests__/i18n/messages.consistency.test.ts`
- Modify: any file in the scanned folders that the stricter beta.10 `check-literals` flags

**Interfaces:**
- Produces the script below. Later tasks append paths to it.

  ```json
  "lint:i18n": "igrp-i18n check-catalogs src/i18n/messages --default pt && igrp-i18n check-literals src/features/users src/features/workspace/components/home-apps src/features/settings src/features/applications \"src/app/(igrp)/(home)/settings/applications\" src/features/menus \"src/app/(invite)\" src/features/branding \"src/app/(igrp)/(home)/settings/customization\" src/components"
  ```

  These are the old `MIGRATED_FOLDERS` minus the dead `src/i18n/components`, plus `src/components`, since its shared components are already translated.
- `build` becomes `pnpm lint && pnpm lint:i18n && next build --turbopack`.

- [ ] **Step 1: Bump and install the dependencies, then run `pnpm install`**

- [ ] **Step 2: Add the script and run it**

Run: `pnpm lint:i18n`
Expected: `check-catalogs` passes. With beta.2, missing fr keys only lower coverage, so expect a line like `fr: 99%`. `check-literals` prints findings or `no hardcoded strings`.

- [ ] **Step 3: Fix every `check-literals` finding**

Move each string to the catalog of the feature it belongs to, in all three locales. Mark a non-language literal with `// igrp-i18n-ignore`. Rerun until it prints `no hardcoded strings`.

If `src/components` turns up more than about 10 findings, drop it from the script and note it for its own task. Do not expand this task.

- [ ] **Step 4: Delete the two Vitest guards and run the suite**

Run: `pnpm typecheck && pnpm test`
Expected: PASS. The two guard files no longer exist.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml src
git commit -m "chore(i18n): framework 0.2.0-beta.10 and igrp-i18n CLI replace the local catalog and literal guards"
```

---

### Task 2: Catalog fixes

The 2026-10-21 review found these problems:
- `pt.json` has English values (for example `users.profile.form.title` = "Edit User Profile").
- `fr` lacks the 13 keys of `common.fileUpload.*` and `common.unsavedChanges.*`.
- Status labels exist twice (`common.status.*` and `users.status.*`).
- Some app keys repeat framework keys word for word.

**Files:**
- Modify: `src/i18n/messages/{pt,en,fr}.json`
- Modify: `src/features/users/lib/i18n.ts` (`userStatusLabel`, `useUserStatusOptions`), with call sites unchanged
- Test: `src/__tests__/users/…` (existing tests of status labels), plus a new `src/__tests__/i18n/catalogs.test.ts`

**Interfaces:**
- Consumes: `statusKey`, `useStatusLabel` and `useStatusOptions` from `src/i18n/status.ts` (unchanged).
- Produces: `users.status.*` keys removed. User ACTIVE/INACTIVE labels come from `common.status.*`. Invite statuses (`users.inviteStatus.*` or wherever `inviteStatusLabel` reads) stay.

- [ ] **Step 1: Write the failing test**

In `src/__tests__/i18n/catalogs.test.ts`, `it("pt holds no English copy")`. Flatten pt and en, and collect keys where the two values are equal and the value contains a lowercase ASCII word of four or more letters. Exclude a small allowlist of true cognates: `Email`, `URL`, `ID`, `Slug`, `OAuth`, plus any brand or product names found when the test first runs. Expect the list to be `[]`.

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm test -- src/__tests__/i18n/catalogs.test.ts`
Expected: FAIL. The list includes `users.profile.form.title`.

- [ ] **Step 3: Translate the flagged pt values into European/Cape Verdean Portuguese**

Use the wording of neighbouring pt keys. Then check each matching en key, since en values that equalled pt may have been English all along. Rerun until the test passes.

- [ ] **Step 4: Add the 13 missing fr keys**

Translate from en. Then run:

```bash
node -e "const f=l=>require('./src/i18n/messages/'+l+'.json');const flat=(o,p='')=>Object.entries(o).flatMap(([k,v])=>typeof v==='object'?flat(v,p+k+'.'):[p+k]);const pt=flat(f('pt'));for(const l of ['en','fr'])console.log(l,pt.filter(k=>!flat(f(l)).includes(k)))"
```

Expected: `en []` and `fr []`.

- [ ] **Step 5: Merge the status maps**

Point `userStatusLabel` and `useUserStatusOptions` at `common.status` through `statusKey`, and delete `users.status.*` from all three catalogs.

Run: `pnpm test -- src/__tests__/users`
Expected: PASS, with the same rendered labels as before. If the pt wording differed between the two maps, keep the `common.status` wording and update test expectations to it.

- [ ] **Step 6: Drop keys that repeat the framework**

List the app's `common.*`, `i18n.*` and `errors.*` keys whose value equals the framework's for the same key and locale. Compare against `IGRP_MESSAGES_PT/EN/FR` from `@igrp/framework-next/i18n/messages`, using a node one-off like Step 4.

Delete a key only where it is identical in all three locales; then the framework copy shows through unchanged. Keep `i18n.localeSwitcher.*` only if it differs.

- [ ] **Step 7: Verify, then commit**

Run: `pnpm typecheck && pnpm test && pnpm lint:i18n`
Expected: PASS; coverage `pt: 100%, en: 100%, fr: 100%`.

```bash
git add src/i18n/messages src/features/users/lib/i18n.ts src/__tests__
git commit -m "fix(i18n): Portuguese in pt, complete fr, one status map, drop keys the framework already ships"
```

---

### Task 3: Delete the local i18n runtime duplicates

**Files:**
- Delete: `src/i18n/config.ts`, `src/i18n/fallback.ts`, `src/i18n/format.ts`, `src/i18n/messages.ts`, `src/i18n/components/i18n-provider.tsx`, `src/components/errors/use-error-copy.ts` (no importers), `src/__tests__/i18n/format.test.ts`
- Modify:
  - `src/features/users/components/{user-audit-tab,user-list,user-sessions-tab}.tsx`: `useFormat` → `useIGRPFormat` from `@igrp/framework-next/i18n/client`, same method names
  - `src/features/users/components/user-invite-dialog.tsx:47`: `LOCALES` / `LOCALE_NATIVE_NAMES` → `IGRP_LOCALES` / `IGRP_LOCALE_NATIVE_NAMES` from `@igrp/framework-next/i18n`
  - `src/features/{applications/app-schemas,menus/menu-schemas,users/user-schemas}.ts`: `import type { Messages } from "next-intl"` (augmented by `global.d.ts`) in place of `@/i18n/messages`
  - `src/lib/auth-instance.ts:5`: `normalizeLocale` → `igrpNormalizeLocale`. Task 5 deletes this callback; this keeps the build green until then.
  - `src/components/errors/index.ts`, if it re-exports the deleted hook
  - `src/i18n/messages/{pt,en,fr}.json`: delete `errors.codes.*`. Only the deleted hook read it; the chrome catalog has the copy.
  - `src/i18n/index.ts`: remove the stale "see docs/I18N.md" cookie-first wording only. Task 5 rewrites it.

**Interfaces:**
- Consumes:
  - `useIGRPFormat(): { formatDate(value, options?); formatDateTime(value, options?); formatNumber(value, options?); compare(a, b) }`
  - `IGRP_LOCALES`, `IGRP_LOCALE_NATIVE_NAMES`, `igrpNormalizeLocale(tag): IGRPLocale | undefined`

**Behaviour change to expect:** `useIGRPFormat` formats in `IGRP_TIME_ZONE` and `IGRP_FORMAT_LOCALES`, not `NEXT_PUBLIC_AUDIT_TIME_ZONE` and the hardcoded regions. It also formats a date-only string (`2026-10-21`) in UTC, so the calendar day never shifts. With default env the output is identical. The audit feature keeps `PLATFORM_TIME_ZONE` until Task 7.

- [ ] **Step 1: Make the import swaps above**

- [ ] **Step 2: Run the users tests**

Run: `pnpm test -- src/__tests__/users`
Expected: PASS. If a date assertion changed, check the cause. A date-only input now keeps its calendar day, which is correct, so update the expectation. Any other difference: stop and report it.

- [ ] **Step 3: Delete the files listed above**

Run `grep -rn "@/i18n/\(config\|fallback\|format\|messages\)\|i18n-provider\|use-error-copy" src --include=*.ts --include=*.tsx`. It should list test files only; Task 4 handles those.

- [ ] **Step 4: Verify typecheck and lint**

Run: `pnpm typecheck && pnpm lint:i18n`
Expected: typecheck fails only in `src/__tests__` and `src/test-setup.ts`. If it fails anywhere else, fix that before going on.

- [ ] **Step 5: Do not commit yet**

Task 4 makes the tests compile. Commit Tasks 3 and 4 together so every commit is green.

---

### Task 4: Tests use the framework's test provider

**Files:**
- Modify: `src/__tests__/helpers/intl.tsx`. Keep its exports `IntlWrapper` and `renderWithIntl` so its 27 importers don't change; reimplement them on `IGRPIntlTestProvider`.
- Modify: `src/test-setup.ts:26-45`. The global wrapper becomes `IGRPIntlTestProvider` with `locale: "pt"`, `timeZone: "Atlantic/Cape_Verde"` and `messages: { pt, en, fr }`.
- Modify:
  - `src/__tests__/i18n/request.test.ts`: assert on `igrpCreateRequestConfig` output, using `igrpGetMessageFallback` and `igrpMergeMessages` from the framework, not the deleted locals
  - `src/__tests__/applications/app-schemas-messages.test.ts`, `src/__tests__/users/components/user-invite-dialog.test.tsx`: `getMessagesFor(l)` → `igrpMergeMessages({ defaultLocale: "pt" }, l, { pt, en, fr })`
  - `src/__tests__/errors/status-error-page.test.tsx`: `deepMerge` → `igrpDeepMergeMessages`
  - `Locale` type imports → `IGRPLocale`

**Interfaces:**
- Consumes:
  - `IGRPIntlTestProvider({ locale?, defaultLocale?, locales?, formatLocale?, timeZone?, messages?: Partial<Record<IGRPLocale, AbstractIntlMessages>>, children })` from `@igrp/framework-next/i18n/testing`
  - `igrpMergeMessages(i18n: { defaultLocale }, locale, appCatalogs)` and `igrpDeepMergeMessages(base, override)` from `@igrp/framework-next/i18n/messages`
- Produces: `renderWithIntl(ui, { locale?: IGRPLocale; messages?: AbstractIntlMessages })` with an unchanged meaning. Passed `messages` become `{ [locale]: messages }`; without them it uses `{ pt, en, fr }`.

- [ ] **Step 1: Rewrite the helpers and setup**

- [ ] **Step 2: Run the full suite**

Run: `pnpm typecheck && pnpm test`
Expected: PASS, with the test-file count down by the three deleted test files. Watch for vitest running out of memory: unstable mocked query data is the known trap, and the helper change must not create new message objects per render. Build the `{ pt, en, fr }` object once at module scope.

- [ ] **Step 3: Commit Tasks 3 and 4**

```bash
git add src
git commit -m "refactor(i18n): drop the local config, merge, fallback, format and provider; tests use IGRPIntlTestProvider"
```

---

### Task 5: Session-first

**Prerequisite:** framework `0.2.0-beta.11`, which has the shared Secure-cookie rule. Bump `@igrp/framework-next` and `-ui` to it and `@igrp/framework-next-i18n` to its matching version, then run `pnpm install`.

**Files:**
- Modify: `src/i18n/index.ts`: add `persistLocale`, and rewrite the header comment to "session-first"
- Create: `src/i18n/session-locale-switcher.tsx` (client)
- Modify: `src/app/(igrp)/layout.tsx:74-76`: use `<SessionLocaleSwitcher />`. Login and invite keep the plain `IGRPLocaleSwitcher`, since they have no session.
- Modify: `src/middleware.ts:257-262`: sync the cookie
- Modify: `src/lib/auth-instance.ts:136-169`: delete the `jwt` and `session` callbacks; `redirect` stays. The framework already maps the claim and `update({ locale })` to `token.locale` → `session.user.locale`.
- Delete: `getSessionLocale` in `src/lib/auth.ts:125-150`, and `src/__tests__/lib/auth-locale.test.ts`
- Test: `src/__tests__/i18n/actions.test.ts`, `src/__tests__/middleware/…` (existing middleware tests), new `src/__tests__/i18n/session-locale-switcher.test.tsx`

**Interfaces:**
- Consumes:
  - `updateCurrentUserLocale(locale: string): Promise<void>` (`src/actions/access-client.ts:56`)
  - `serverSession()` (`src/lib/auth`, redirect-free)
  - `isAuthBypass()` (`src/lib/utilities`)
  - `igrpSyncLocaleCookie(request, response, tokenLocale, { locales, resolution })` and `IGRP_LOCALES` from `@igrp/framework-next/i18n`
  - `useSession()` from `next-auth/react`; `SessionProvider` is already mounted through `getSessionArgs`
- Produces:
  - `persistLocale: (locale: IGRPLocale) => Promise<boolean>`. Resolves `false` without an API call under bypass or with no session; otherwise it calls `updateCurrentUserLocale` and resolves `true`. API errors propagate, so `igrpSetLocale` returns 500 and writes no cookie.
  - `SessionLocaleSwitcher(): JSX.Element`, which renders `<IGRPLocaleSwitcher action={setLocale} onChanged={async (locale, persisted) => { if (persisted) await update({ locale }); }} />`. `update` must be awaited: the framework refreshes the page only after `onChanged` settles, and an un-awaited update renders the old session locale.
  - Middleware constant: `const LOCALE_SYNC = { locales: IGRP_LOCALES, resolution: "session-first" } as const;`. The authenticated branch ends with `return igrpSyncLocaleCookie(request, nextWithPath(), token.locale, LOCALE_SYNC);`.

- [ ] **Step 1: Write the failing tests**

`actions.test.ts` mocks `@/actions/access-client`, `@/lib/auth` and `@/lib/utilities`:
- `"anonymous change writes the cookie only"`. `serverSession` resolves `null`. `setLocale("en")` returns `{ success: true, data: { locale: "en", persisted: false } }`, and `updateCurrentUserLocale` was not called.
- `"bypass mode never calls the API"`. `isAuthBypass` returns `true`; the result is the same as above.
- `"signed-in change saves to the profile"`. With a session, `updateCurrentUserLocale` is called with `"en"` and the result has `persisted: true`.
- `"API failure changes nothing"`. `updateCurrentUserLocale` rejects; the result is `{ success: false, status: 500 }` and no `IGRP_LOCALE` cookie was set.

Middleware test:
- `"rewrites a stale locale cookie from the token"`. Token `locale: "en"`, request cookie `IGRP_LOCALE=pt`, header `x-forwarded-proto: https`. The response sets `IGRP_LOCALE=en` with `secure: true`.
- `"normalizes a regional token locale"`. Token `pt-CV`, no cookie: the response sets `IGRP_LOCALE=pt`.
- `"ignores an unsupported token locale"`. Token `es`, cookie `fr`: there is no `set-cookie` for `IGRP_LOCALE`.

`session-locale-switcher.test.tsx` mocks `next-auth/react` `useSession` → `{ update }`, and `next/navigation` `useRouter` → `{ refresh }`.
- Choosing English with `setLocale` resolving `persisted: true` calls `update({ locale: "en" })`.
- `refresh` is called only after the `update` promise resolves: make `update` a deferred promise and assert `refresh` was not called before you resolve it.
- With `persisted: false`, `update` is not called.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test -- src/__tests__/i18n src/__tests__/middleware`
Expected: FAIL. There is no `persistLocale`, no cookie sync, and no `SessionLocaleSwitcher`.

- [ ] **Step 3: Implement the interfaces above**

Delete the local auth callbacks and `getSessionLocale`, with its test.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm typecheck && pnpm test`
Expected: PASS.

- [ ] **Step 5: Manual check in the dev app**

Do this with a real IdP login, following the run skill or `.claude/launch.json`:
1. Sign in and switch to English. `PUT /api/users/me/locale` returns 204, and the page re-renders in English.
2. Clear the `IGRP_LOCALE` cookie and reload. The page is still English (from the session), and the cookie is back.
3. Sign out. The login page is English, because the cookie was kept.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml src
git commit -m "feat(i18n): session-first — the language is saved to the user profile and synced to the cookie"
```

---

### Task 6: App shell strings

**Files:**
- Modify: `src/app/layout.tsx:23-24`. Replace the static `metadata` with `generateMetadata()` using `getTranslations("app")`, as `templates/demo-v1/src/app/layout.tsx` does. The keys are `app.title` and `app.description`.
- Modify: `src/i18n/messages/{pt,en,fr}.json` (`app.*`)
- Modify: `package.json` `lint:i18n`, appending `src/app/layout.tsx src/app/global-error.tsx src/app/not-found.tsx "src/app/(igrp)/layout.tsx" "src/app/(auth)"`

- [ ] **Step 1: Run the scan to see what it finds**

Append the paths and run `pnpm lint:i18n`. Expected: findings, including the layout metadata.

- [ ] **Step 2: Fix each finding**

Move each string into the catalogs or mark it with `igrp-i18n-ignore`. Rerun until it prints `no hardcoded strings`.

- [ ] **Step 3: Verify, then commit**

Run: `pnpm typecheck && pnpm test && pnpm lint:i18n`

```bash
git add src package.json
git commit -m "feat(i18n): translate the app shell (metadata, layouts, error screens)"
```

---

### Task 7–14: Translate one feature per task

Do one task per feature, in this order (smallest first, shared pieces early):
- Task 7: `permissions` (2 files)
- Task 8: `profile` (1)
- Task 9: `accounts` (2)
- Task 10: `roles` (6)
- Task 11: `oauth-clients` (11)
- Task 12: `audit` (14)
- Task 13: `departments` (18)
- Task 14: `service-accounts` (21)

Each feature's route folders under `src/app/(igrp)/(home)/settings/…` belong to its task.

**Files per task:**
- Modify: `src/features/<feature>/**`, the feature's route folder(s), and `src/i18n/messages/{pt,en,fr}.json` (new top-level namespace `<feature>` in camelCase, for example `oauthClients` and `serviceAccounts`)
- Create, when the feature maps API enum codes to labels: `src/features/<feature>/lib/i18n.ts`, following `src/features/users/lib/i18n.ts`
- Modify: `package.json` `lint:i18n`, appending the feature folder and its route folder(s)
- Test: the feature's existing tests under `src/__tests__/<feature>/`

**Rules, the same for every feature:**
- Client components use `useTranslations("<feature>")`; server components and actions use `getTranslations("<feature>")`.
- Zod schemas become factories that take a translator: `make<Feature>Schemas(t: <Feature>ValidationTranslator)`, typed from `keyof Messages["<feature>"]["validation"]` as in `src/features/applications/app-schemas.ts:20-32`. Call sites build them in `useMemo`.
- `STATUS_OPTIONS` → `useStatusOptions()`; `showStatus(x)` → `useStatusLabel()(x)` (`src/i18n/status.ts`).
- Dates and numbers come from `useIGRPFormat()`, never `toLocale*` or `new Intl.*`.
- **Audit (Task 12) only:**
  - Replace `PLATFORM_TIME_ZONE` with `useIGRPLocaleInfo().timeZone`.
  - Translate "Hora de Cabo Verde" (`platform-time.ts:27`) under `audit.*`.
  - Once no file imports `PLATFORM_TIME_ZONE`, delete it and remove `NEXT_PUBLIC_AUDIT_TIME_ZONE` from `.env.example`. The same applies to `src/features/workspace/lib/app-utils.ts:51`: if it is the last importer, switch it to the server `i18n.timeZone` or the client hook, and flag it in the report, since it is outside the feature.
- The pt copy reuses the existing pt string, so the user-facing Portuguese doesn't change. Write en and fr in full; `check-catalogs` fails on missing keys once beta.11's CLI is in.

**Steps per task:**

- [ ] **Step 1: Add the feature to the scan**

Append the feature's folders to `lint:i18n` and run `pnpm lint:i18n`. Expected: the list of literals to move.

- [ ] **Step 2: Add the namespace to `pt.json` with every listed string**

Then run `pnpm typecheck`. Expected: PASS, since no code reads the namespace yet.

- [ ] **Step 3: Replace the literals following the rules above**

Rerun `pnpm lint:i18n` until it prints `no hardcoded strings` for the feature.

- [ ] **Step 4: Add en and fr**

Run `pnpm lint:i18n`. Expected: coverage 100% for all three.

- [ ] **Step 5: Run the feature's tests**

Run: `pnpm test -- src/__tests__/<feature>`
Expected: PASS. Tests asserting pt text keep passing, because the global test wrapper is pt. Add one `renderWithIntl(<X />, { locale: "en" })` assertion on the feature's page title, so a missing en key would show.

- [ ] **Step 6: Commit**

```bash
git add src package.json
git commit -m "feat(i18n): translate <feature>"
```

After Task 14:
- `grep -rn "STATUS_OPTIONS\|showStatus" src` should find only `src/lib/constants.ts`. Delete those exports and their labels.
- `grep -rn "PLATFORM_TIME_ZONE" src` should find nothing.

Commit as `chore(i18n): drop the pt-only status helpers`.

---

### Task 15: Rewrite `docs/I18N.md`

**Files:**
- Modify: `docs/I18N.md`

- [ ] **Step 1: Rewrite the doc to describe the code as it now is**

1. **Files:** `src/i18n/{index,request,actions,global.d.ts,status,session-locale-switcher}` and `messages/`.
2. **Resolution:** session-first. The order is session, then cookie, then Accept-Language, then pt. Saving goes through `PUT /api/users/me/locale`, and middleware syncs the cookie.
3. **Env:** `IGRP_FORMAT_LOCALES` and `IGRP_TIME_ZONE`.
4. **Translating a feature:** the Task 7–14 rules, condensed.
5. **Tooling:** `pnpm lint:i18n` and `igrp-i18n-ignore`.
6. **Testing:** `renderWithIntl` and `IGRPIntlTestProvider`.

Link the framework's `templates/demo-v1/docs/I18N.md` for anything the framework owns, rather than repeating it.

- [ ] **Step 2: Commit**

```bash
git add docs/I18N.md
git commit -m "docs(i18n): describe the framework-based, session-first setup"
```
