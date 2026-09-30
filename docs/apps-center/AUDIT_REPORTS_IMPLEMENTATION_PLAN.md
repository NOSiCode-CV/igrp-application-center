# Audit & Reports screen — implementation plan

**Route:** `/settings/audit` · **Permission:** `igrp.audit.view` · **Language:** pt-PT only
**Inputs:** [`AUDIT_REPORTS_INTEGRATION_GUIDE.md`](./AUDIT_REPORTS_INTEGRATION_GUIDE.md), [`AUDIT_BACKEND_REQUESTS.md`](./AUDIT_BACKEND_REQUESTS.md), glossary in [`CONTEXT.md`](../../CONTEXT.md) (Audit section), [ADR-0001](../adr/0001-fixed-platform-time-zone-for-audit.md), [ADR-0002](../adr/0002-no-audit-log-purge-in-ui.md)
**SDK:** `@igrp/platform-access-management-client-ts@0.2.0-beta.16` — `client.auditReports`, `client.files`, `client.authAudit`

Work one phase at a time; each phase ends green on `pnpm check:ui`, `pnpm typecheck` and `pnpm test` (remember `pnpm lint` rewrites files).

---

## Decisions (settled)

| # | Decision |
|---|---|
| Page | One page at `/settings/audit`, four tabs in `?tab=`: **Períodos de Acesso** (API `audit`) · **Acessos** (`access`) · **Configurações** (`settings`) · **Registo** (raw log). Enabled from the existing "Auditoria e Relatórios" settings card (currently `status: "inativo"`); card hidden without `igrp.audit.view`. |
| Naming | Code keeps API names (`audit`/`access`/`settings`); UI and docs say **Access Period Report**. "Audit" alone = feature or Audit Log. |
| Dates | Fixed **Platform Time Zone** `Atlantic/Cape_Verde` (env var) for boundaries and display (ADR-0001). Presets 24h / **7d (default)** / 30d / Personalizado. Custom = whole days in the platform zone. "Now" resolved at query time. Inverted range blocked in the picker. Registo may clear to "Todo o período". Label "Hora de Cabo Verde". |
| URL state | Tab, date range, filters, `page`, `size`, `sort` all in search params; react-query keyed by them. Date range survives tab switches; tab-specific filters reset. |
| Paging | Server-side. `IGRPDataTable` supports `isServerSide`, `rowCount`, `pagination`, `onQueryChange`, `serverFilterComponent` — use those; don't page client-side. Default sort `timestamp,desc`. |
| Filters | Enums → selects with pt-PT labels. `username` / `performedBy` → user combobox. `module` → application combobox. `role` / `accessRole` → **"Perfis detidos"** text field with a "contém" hint (the backend currently stores every Role held and matches by substring); switch to a "Perfil" Role combobox once the backend writes the Active Role and ships `GET /api/roles`. `entityName` → free text + "correspondência exata" hint. `authorizedBy`, `operationState`, `action` → **not** filters (columns only). Registo: `eventType` and `category` → **fixed selects** from the published enums (no free text: an unknown value is silently dropped server-side and returns the whole log), plus `userId`. Empty filtered result → "Limpar filtros". |
| Labels | One `audit-labels.ts` map for every enum label and badge variant: `SUCCESS` success · `ACCESS_DENIED`/`ERROR` destructive · `UNUSUAL_IP` warning · `PENDING` neutral. |
| Settings diff | Parse `previousValue`/`newValue` (`field=value;…`) into "campo: antigo → novo" in an expandable row; never throw — fall back to raw text. |
| Exports | Route Handler `app/api/audit/[report]/export` streams the SDK blob with `Content-Type` + `Content-Disposition`; triggered by `<a href download>` with current filters. Confirm dialog above `EXPORT_CONFIRM_THRESHOLD = 50_000` (uses `totalElements`). |
| Archives | Side sheet per Report tab, filtered to that `reportType`. "Arquivar…" next to export menu. Download resolves `client.files.getFileUrl` on click, never cached, opened without the Bearer token. Archive call timeout ~30s; storage error copy: "Armazenamento indisponível — a exportação direta continua a funcionar". |
| Integrity | "Verificar integridade" in the Registo tab header → banner: intact (N checked) / broken at sequence N / legacy count explained as "anterior à cadeia de hash — não é adulteração". |
| Purge | Not in the UI, anywhere (ADR-0002). |
| 403 | Segment `forbidden.tsx` for `/settings/audit`: when the user holds more than one Role, explain that permissions come from the Active Role only and point to `/profile` to activate the right one, then sign in again (the token keeps the old permissions until then). Otherwise the generic 403. |
| SDK | `@igrp/platform-access-management-client-ts@0.2.0-beta.17`. |
| Guards | `igrpAssertAuthorize('igrp.audit.view')` on the page; `igrpAuthorize` in every server action and the Route Handler. First page to use a guard — pattern for later pages, applied only here for now. |
| Sessions | `401 session_expired` / `session_revoked` → login with return URL (filters survive via the URL). Reuse the existing `getClientAccess` flow; verify it covers this before adding anything. |
| Dates display | Shared formatter in the platform zone; don't add more inline `toLocaleString("pt-CV")`. |

---

## File layout

```
src/app/(igrp)/(home)/settings/audit/
  page.tsx            # guard + parse search params + prefetch active tab; throws to error.tsx
  loading.tsx
  error.tsx
src/app/api/audit/[report]/export/route.ts     # streaming export proxy

src/actions/audit-reports.ts   # getAccessPeriodReport / getAccessReport / getSettingsReport,
                               # archiveReport, listReportArchives, getArchiveUrl
src/actions/audit-log.ts       # listAuditLog, validateAuditChain  (extend user-audit.ts pattern)

src/features/audit/
  query-keys.ts  query-options.ts  use-audit.ts
  lib/
    audit-labels.ts            # enum → pt-PT label + badge variant
    platform-time.ts           # zone-aware range presets, day boundaries, formatter
    report-search-params.ts    # parse/serialise tab, range, filters, paging (pure)
    settings-diff.ts           # parse "field=value;…" pairs (pure, never throws)
  components/
    audit-page-tabs.tsx
    report-date-range.tsx
    report-toolbar.tsx         # filters + export menu + archive action
    export-menu.tsx  export-confirm-dialog.tsx
    access-period-report.tsx   access-period-columns.tsx
    access-report.tsx          access-columns.tsx
    settings-report.tsx        settings-columns.tsx   settings-diff-cell.tsx
    audit-log-tab.tsx          audit-log-columns.tsx  integrity-banner.tsx
    archives-sheet.tsx
    report-empty-state.tsx
```

---

## Phase 0 — Foundations

1. Env var for the Platform Time Zone (typedEnv) with default `Atlantic/Cape_Verde`; document in `docs/ENVIRONMENT.md`.
2. `platform-time.ts`: presets → `{startDate, endDate}` ISO instants; custom day range → zone-local 00:00 to 23:59:59.999; `formatAuditDateTime`. Pick `date-fns-tz` or an `Intl` helper.
3. `report-search-params.ts`: parse/serialise with defaults (7d, page 0, size 20, `timestamp,desc`); rejects inverted ranges.
4. `audit-labels.ts` from the SDK enums (`AuditStatus`, `SettingsArea`, `SettingsEntityType`, `SettingsOperation`, `ReportFormat`).
5. Page shell: route, guard, tabs in `?tab=`, `report-date-range.tsx`; enable the settings card and hide it without the permission.

**Tests:** time-zone boundaries (incl. a 23:30 CV event), preset "now" at call time, search-param round-trip + inverted range, label map covers every enum value.

## Phase 1 — Access Report and Settings Report

1. Server actions for both Reports (guarded, `ActionResult`).
2. Query keys/options/hooks keyed by parsed search params.
3. Toolbars with the agreed filters; comboboxes for users, applications, Roles.
4. Server-side `IGRPDataTable`; status badges; "—" for nulls; empty state with "Limpar filtros".
5. `settings-diff.ts` + expandable diff cell. Note §9.6: for `ASSOCIATE`, `entityName` is the Permission and `relatedEntity` the Role.

**Tests:** diff parser (single, multiple, `=`/`;` inside values, garbage → raw), filter → SDK param mapping, empty-state reset.

## Phase 2 — Access Period Report

1. Server action + hook for `getAuditReport`.
2. Columns: Período (start–end), Utilizador, Módulo, Perfil, Autorizado por, Estado da operação, IP, Dispositivo, Estado. "—" for nulls.
3. Filters as Phase 1; `authorizedBy` / `operationState` columns only.
4. Dismissible notice stating what the tab shows today: "Os períodos de acesso ainda não são registados. Por agora, esta vista lista todos os eventos de auditoria do período, incluindo alterações de configuração." Date label "Eventos registados entre…" until the backend ships overlap matching.
5. `module` and the Role field are populated on every row (backend §1); only Período, Autorizado por and Estado da operação are "—". The Role column reads "Perfis detidos", as on the Access Report.

**Blocked on backend** for full value: an Access Period producer (product owner to be named), the overlap rule, and the `operationState` enum, which will ship together.

## Phase 3 — Exports

1. Route Handler: validate `report` ∈ {audit, access, settings} and `format` ∈ {pdf, xlsx, csv}; guard; parse filters with the same `report-search-params.ts`; call the matching `get*Pdf|Xlsx|Csv`; stream with upstream `Content-Type`/`Content-Disposition`. Map 400/401/403 to proper responses.
2. Export menu on each Report tab; confirm dialog above threshold; spinner until the download starts.

**Tests:** route rejects unknown report/format, forwards filters, passes headers through, 403 without permission.

## Phase 4 — Archives

1. Actions: `archiveReport(report, format, filters)` with a ~30s timeout client, `listReportArchives`, `getArchiveUrl(filePath)` (keep the `private/` prefix intact).
2. "Arquivar…" action + `archives-sheet.tsx` per tab (file name, format, rows, period, generated by/at, download).
3. Storage-unavailable error copy.

**Tests:** timeout path surfaces the storage message; download resolves a fresh URL each click.

## Phase 5 — Registo and Integrity Check

1. `audit-log.ts` actions over `client.authAudit.listAuditLogs` / `validate`.
2. Registo tab: filters `username`, `userId`, `eventType` (select, 33 values), `category` (select, 6 values), `ipAddress`, optional range with "Todo o período"; columns incl. sequence number and hashes (collapsed). Use the SDK's `AuditEventType` / `AuditCategory` enums if the SDK in use exports them; otherwise a local list copied from `AUDIT_BACKEND_RESPONSES.md` §5.
3. "Verificar integridade" → `integrity-banner.tsx` (reads snake_case `valid`, `rows_checked`, `broken_at`, `unverifiable_legacy_rows`).
4. No purge (ADR-0002).

**Tests:** banner states (intact, broken, legacy-only), optional-date param handling.

---

## Backend status

Asked in [`AUDIT_BACKEND_REQUESTS.md`](./AUDIT_BACKEND_REQUESTS.md) → answered in [`AUDIT_BACKEND_RESPONSES.md`](./AUDIT_BACKEND_RESPONSES.md) → our decisions in [`AUDIT_BACKEND_DECISIONS.md`](./AUDIT_BACKEND_DECISIONS.md).

Waiting on: `access_role` → Active Role plus a separate Roles Held field, with exact-match Role filtering; `GET /api/roles`; a 400 on unknown `eventType`/`category`, plus the SDK enums; the overlap rule; a product owner and date for Access Periods.
