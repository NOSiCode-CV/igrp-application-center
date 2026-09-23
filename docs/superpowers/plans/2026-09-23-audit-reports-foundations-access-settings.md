# Audit Screen — Foundations + Access & Settings Reports Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/settings/audit` with a shared date range and two working, server-paged, URL-driven tabs — the Access Report ("Acessos") and the Settings Report ("Configurações") — gated on `igrp.audit.view`.

**Architecture:** A server page asserts the permission and renders one client screen. All screen state (tab, date range, filters, page, size) lives in the URL and is parsed by a pure `report-query` module; react-query keys are built from that parsed query (never from computed instants), and each `queryFn` resolves "now" at fetch time before calling a guarded server action over `client.auditReports`. Dates are interpreted and displayed in one fixed Platform Time Zone.

**Tech Stack:** Next.js 15.5 App Router (typedRoutes), React 19, TanStack Query 5, TanStack Table 8 via `IGRPDataTable`, `@igrp/igrp-framework-react-design-system`, `@igrp/framework-next` (`igrpAuthorize` / `igrpAssertAuthorize`), `@igrp/platform-access-management-client-ts@0.2.0-beta.16`, Vitest + Testing Library.

**Spec:** [`docs/todos/AUDIT_REPORTS_IMPLEMENTATION_PLAN.md`](../../todos/AUDIT_REPORTS_IMPLEMENTATION_PLAN.md) (decisions table, Phases 0–1) · API facts: [`docs/todos/AUDIT_REPORTS_INTEGRATION_GUIDE.md`](../../todos/AUDIT_REPORTS_INTEGRATION_GUIDE.md) · Glossary: [`CONTEXT.md`](../../../CONTEXT.md) (Audit section) · [ADR-0001](../../adr/0001-fixed-platform-time-zone-for-audit.md) · [ADR-0002](../../adr/0002-no-audit-log-purge-in-ui.md)

**Out of scope (later plans):** Access Period tab, Exports, Archives, Registo + Integrity Check. Do not stub them in the UI.

## Global Constraints

- All UI copy is **pt-PT**, one language per screen, including generated dates.
- Import UI only from `@igrp/igrp-framework-react-design-system`; Horizon (`IGRP*`) first, then primitives.
- `pnpm check:ui` must pass: no `space-x/y-*`, no raw color literals, no `animate-pulse`, no `dark:` color overrides, no `<hr>` / `border-t` dividers; prefer `size-N` over equal `w-N h-N`.
- Server data flow: `src/actions/*` → SDK; client → react-query hooks. Actions return `ActionResult<T>` from `@/actions/types`; query functions use `unwrap()`.
- Permission name is exactly `"igrp.audit.view"` (constant `AUDIT_VIEW_PERMISSION`). Every audit server action checks `igrpAuthorize` before calling the SDK. **No purge anywhere** (ADR-0002).
- Platform Time Zone default `Atlantic/Cape_Verde`, overridable by `NEXT_PUBLIC_AUDIT_TIME_ZONE`. Never use the browser's or server's zone for audit dates.
- Report filters are exact-match; enum filter values are validated against the SDK enums before being sent.
- Tests live in `src/__tests__/audit/`. DS mocks must include **every** symbol the component imports; mocked hook results must be module-level constants (stable references). Never `vi.stubGlobal("URL", …)`.
- Use `npx biome check <files>` to verify formatting; `pnpm lint` rewrites files — run it only right before staging, then re-check the diff.
- Commit messages: conventional style, **no `Co-Authored-By:` trailer**.
- Gates at the end: `pnpm typecheck`, `pnpm test`, `pnpm check:ui`, `npx biome check`.

## Decisions made while planning (confirm or veto before executing)

1. **Role filter is an exact-match text field**, not a combobox: the SDK can only list Roles per department (`getRoles(departmentCode)`). Asked the backend (request #7).
2. **User filter value = `user.username ?? user.email`; Module filter value = `application.code`.** The report examples (`superadmin@igrp.cv`, `auth`) suggest this; Task 11 verifies it against real rows.
3. **Sort is fixed to `timestamp,desc`** and not user-changeable: `IGRPDataTable` sorts client-side only, which would sort just the visible page. No `sort` URL param.
4. **Paging uses our own `ReportPager`** with `IGRPDataTable showPagination={false}`: the table keeps its page index in internal state starting at 0, so it can't be seeded from the URL.
5. **`page` in the URL is 0-based**, the same as the API.
6. **A `401` goes to `/logout`, with no return URL.** `/logout` is the app's existing session-expiry path (`src/lib/auth.ts:70`), and it has no callback parameter. Carrying the filtered URL through would mean changing the logout page, which is outside this page's scope. The URL-based state still means the user can re-apply filters from browser history.

---

## File Structure

```
src/lib/constants.ts                                   MODIFY  + AUDIT_VIEW_PERMISSION
src/actions/audit-reports.ts                           CREATE  guarded server actions (access, settings)
src/features/audit/
  lib/platform-time.ts                                 CREATE  zone offset, day bounds, presets, formatting
  lib/audit-labels.ts                                  CREATE  enum → pt-PT label (+ badge color), option lists
  lib/report-query.ts                                  CREATE  URL ⇄ ReportQuery, transitions, SDK filter mappers
  lib/settings-diff.ts                                 CREATE  "field=value;…" parser (never throws)
  query-keys.ts  query-options.ts  use-audit.ts        CREATE  react-query layer + URL-state hook
  components/
    filter-controls.tsx                                CREATE  FilterSelect, FilterCombobox, ExactMatchInput
    audit-status-badge.tsx                             CREATE
    report-pager.tsx                                   CREATE
    report-empty-state.tsx                             CREATE
    report-table-skeleton.tsx                          CREATE
    report-date-range.tsx                              CREATE
    access-report-columns.tsx  access-report-tab.tsx   CREATE
    settings-change-detail.tsx                         CREATE
    settings-report-columns.tsx settings-report-tab.tsx CREATE
    audit-screen.tsx                                   CREATE  header + date range + tabs
src/app/(igrp)/(home)/settings/audit/
  page.tsx  loading.tsx  error.tsx                     CREATE
src/app/(igrp)/(home)/settings/page.tsx                MODIFY  enable card, hide without permission
.env.example, docs/ENVIRONMENT.md                      MODIFY  NEXT_PUBLIC_AUDIT_TIME_ZONE
src/__tests__/audit/…                                  CREATE  one test file per unit
```

---

### Task 1: Platform time helpers

**Files:**
- Create: `src/features/audit/lib/platform-time.ts`
- Modify: `.env.example` (after the `NEXT_PUBLIC_ALLOWED_DOMAINS=` block), `docs/ENVIRONMENT.md` ("Next.js public" table)
- Test: `src/__tests__/audit/platform-time.test.ts`

**Interfaces:**
- Produces:
  - `PLATFORM_TIME_ZONE: string`, `PLATFORM_TIME_ZONE_LABEL: string`
  - `type RangePreset = "24h" | "7d" | "30d"`, `RANGE_PRESETS: readonly RangePreset[]`, `isRangePreset(v: unknown): v is RangePreset`
  - `interface InstantRange { startDate: string; endDate: string }` (ISO UTC)
  - `zoneOffsetMinutes(instant: Date, timeZone?: string): number`
  - `presetToInstants(preset: RangePreset, now: Date): InstantRange`
  - `dayRangeToInstants(fromYmd: string, toYmd: string, timeZone?: string): InstantRange`
  - `isValidYmd(v: unknown): v is string`, `todayYmd(now: Date, timeZone?: string): string`
  - `ymdToLocalDate(ymd: string): Date`, `localDateToYmd(d: Date): string`, `formatYmd(ymd: string): string`
  - `formatAuditDateTime(value?: string | null): string`

- [ ] **Step 1: Write the failing test**

```ts
// src/__tests__/audit/platform-time.test.ts
import { describe, expect, it } from "vitest";

import {
  dayRangeToInstants,
  formatAuditDateTime,
  formatYmd,
  isRangePreset,
  isValidYmd,
  localDateToYmd,
  PLATFORM_TIME_ZONE,
  presetToInstants,
  todayYmd,
  ymdToLocalDate,
  zoneOffsetMinutes,
} from "@/features/audit/lib/platform-time";

const CV = "Atlantic/Cape_Verde";

describe("platform time zone", () => {
  it("defaults to Cabo Verde", () => {
    expect(PLATFORM_TIME_ZONE).toBe(CV);
  });

  it("reads Cabo Verde as UTC-1 and UTC as 0", () => {
    const instant = new Date("2026-09-23T12:00:00Z");
    expect(zoneOffsetMinutes(instant, CV)).toBe(-60);
    expect(zoneOffsetMinutes(instant, "UTC")).toBe(0);
  });
});

describe("dayRangeToInstants", () => {
  it("covers a whole Cabo Verde day", () => {
    expect(dayRangeToInstants("2026-09-23", "2026-09-23", CV)).toEqual({
      startDate: "2026-09-23T01:00:00.000Z",
      endDate: "2026-09-24T00:59:59.999Z",
    });
  });

  it("includes an event at 23:30 Cabo Verde time on the last day", () => {
    const { startDate, endDate } = dayRangeToInstants(
      "2026-09-23",
      "2026-09-23",
      CV,
    );
    const event = "2026-09-24T00:30:00.000Z"; // 23:30 on the 23rd in CV
    expect(event >= startDate && event <= endDate).toBe(true);
  });

  it("spans month boundaries", () => {
    expect(dayRangeToInstants("2026-08-31", "2026-09-01", CV)).toEqual({
      startDate: "2026-08-31T01:00:00.000Z",
      endDate: "2026-09-02T00:59:59.999Z",
    });
  });
});

describe("presetToInstants", () => {
  const now = new Date("2026-09-23T10:00:00.000Z");

  it("ends exactly at the given now", () => {
    expect(presetToInstants("24h", now)).toEqual({
      startDate: "2026-09-22T10:00:00.000Z",
      endDate: "2026-09-23T10:00:00.000Z",
    });
  });

  it("goes back 7 and 30 days", () => {
    expect(presetToInstants("7d", now).startDate).toBe(
      "2026-09-16T10:00:00.000Z",
    );
    expect(presetToInstants("30d", now).startDate).toBe(
      "2026-08-24T10:00:00.000Z",
    );
  });
});

describe("calendar-day helpers", () => {
  it("validates YYYY-MM-DD strictly", () => {
    expect(isValidYmd("2026-09-23")).toBe(true);
    expect(isValidYmd("2026-02-30")).toBe(false);
    expect(isValidYmd("2026-9-23")).toBe(false);
    expect(isValidYmd(undefined)).toBe(false);
  });

  it("computes today in the platform zone, not UTC", () => {
    // 00:30 UTC on the 24th is still 23:30 on the 23rd in Cabo Verde.
    expect(todayYmd(new Date("2026-09-24T00:30:00Z"), CV)).toBe("2026-09-23");
  });

  it("round-trips a calendar Date", () => {
    expect(localDateToYmd(ymdToLocalDate("2026-09-03"))).toBe("2026-09-03");
  });

  it("formats a day for display in pt-PT order", () => {
    expect(formatYmd("2026-09-03")).toBe("03/09/2026");
  });

  it("recognises presets", () => {
    expect(isRangePreset("7d")).toBe(true);
    expect(isRangePreset("custom")).toBe(false);
  });
});

describe("formatAuditDateTime", () => {
  it("renders in Cabo Verde time", () => {
    const text = formatAuditDateTime("2026-07-16T11:35:10Z");
    expect(text).toContain("16/07/2026");
    expect(text).toContain("10:35:10");
  });

  it("renders a dash for missing or invalid values", () => {
    expect(formatAuditDateTime(null)).toBe("—");
    expect(formatAuditDateTime(undefined)).toBe("—");
    expect(formatAuditDateTime("not a date")).toBe("—");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/audit/platform-time.test.ts`
Expected: FAIL — cannot resolve `@/features/audit/lib/platform-time`.

- [ ] **Step 3: Write the implementation**

```ts
// src/features/audit/lib/platform-time.ts

/* ADR-0001: every audit date range is interpreted, and every audit time is
   displayed, in ONE zone — never the server's (UTC in the cluster) or the
   viewer's browser. That keeps the filter and the times on screen in
   agreement, and makes a shared Report link return the same rows for
   everyone. */
export const PLATFORM_TIME_ZONE =
  process.env.NEXT_PUBLIC_AUDIT_TIME_ZONE || "Atlantic/Cape_Verde";

/** Shown beside the date controls. Update together with the zone. */
export const PLATFORM_TIME_ZONE_LABEL = "Hora de Cabo Verde";

export const RANGE_PRESETS = ["24h", "7d", "30d"] as const;
export type RangePreset = (typeof RANGE_PRESETS)[number];

export function isRangePreset(value: unknown): value is RangePreset {
  return RANGE_PRESETS.includes(value as RangePreset);
}

export interface InstantRange {
  startDate: string;
  endDate: string;
}

const HOUR_MS = 60 * 60 * 1000;
const PRESET_MS: Record<RangePreset, number> = {
  "24h": 24 * HOUR_MS,
  "7d": 7 * 24 * HOUR_MS,
  "30d": 30 * 24 * HOUR_MS,
};

/** Offset of `timeZone` from UTC at `instant`, in minutes (Cabo Verde → -60). */
export function zoneOffsetMinutes(
  instant: Date,
  timeZone: string = PLATFORM_TIME_ZONE,
): number {
  const name =
    new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" })
      .formatToParts(instant)
      .find((part) => part.type === "timeZoneName")?.value ?? "GMT";
  // "GMT" for UTC itself, otherwise "GMT-01:00" / "GMT+05:30".
  const match = /GMT([+-])(\d{2}):(\d{2})/.exec(name);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3]));
}

/** "Last N": ends at `now`, which callers resolve at query time, not page load. */
export function presetToInstants(preset: RangePreset, now: Date): InstantRange {
  return {
    startDate: new Date(now.getTime() - PRESET_MS[preset]).toISOString(),
    endDate: now.toISOString(),
  };
}

function splitYmd(ymd: string): [number, number, number] {
  const [y, m, d] = ymd.split("-").map(Number);
  return [y, m, d];
}

function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = splitYmd(ymd);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function zonedMidnightUtc(ymd: string, timeZone: string): Date {
  const [y, m, d] = splitYmd(ymd);
  const utcMidnight = Date.UTC(y, m - 1, d);
  const offset = zoneOffsetMinutes(new Date(utcMidnight), timeZone);
  return new Date(utcMidnight - offset * 60_000);
}

/** Whole days, both inclusive: 00:00:00.000 on `from` to 23:59:59.999 on `to`. */
export function dayRangeToInstants(
  fromYmd: string,
  toYmd: string,
  timeZone: string = PLATFORM_TIME_ZONE,
): InstantRange {
  const start = zonedMidnightUtc(fromYmd, timeZone);
  const end = zonedMidnightUtc(addDaysYmd(toYmd, 1), timeZone).getTime() - 1;
  return { startDate: start.toISOString(), endDate: new Date(end).toISOString() };
}

export function isValidYmd(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [y, m, d] = splitYmd(value);
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

export function todayYmd(
  now: Date,
  timeZone: string = PLATFORM_TIME_ZONE,
): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/* The calendar works in the browser's local days; these two only move a
   picked day in and out of it. The zone conversion happens in
   `dayRangeToInstants`. */
export function ymdToLocalDate(ymd: string): Date {
  const [y, m, d] = splitYmd(ymd);
  return new Date(y, m - 1, d);
}

export function localDateToYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatYmd(ymd: string): string {
  const [y, m, d] = ymd.split("-");
  return `${d}/${m}/${y}`;
}

const dateTimeFormatter = new Intl.DateTimeFormat("pt-PT", {
  timeZone: PLATFORM_TIME_ZONE,
  dateStyle: "short",
  timeStyle: "medium",
});

export function formatAuditDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateTimeFormatter.format(date);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/audit/platform-time.test.ts`
Expected: PASS (all tests).

- [ ] **Step 5: Document the env var**

Append to `.env.example` directly after the `NEXT_PUBLIC_ALLOWED_DOMAINS=` line and its blank line:

```
# Next Public Audit Time Zone - IANA zone for audit date ranges and times (ADR-0001)
# Used by /settings/audit; defaults to Atlantic/Cape_Verde when empty
# Example: Atlantic/Cape_Verde
NEXT_PUBLIC_AUDIT_TIME_ZONE=
```

Add a row to the "Next.js public" table in `docs/ENVIRONMENT.md`, after `NEXT_PUBLIC_ALLOWED_DOMAINS`:

```
| `NEXT_PUBLIC_AUDIT_TIME_ZONE` | IANA time zone for audit date ranges and displayed times (see ADR-0001) | `Atlantic/Cape_Verde` |
```

- [ ] **Step 6: Commit**

```bash
git add src/features/audit/lib/platform-time.ts src/__tests__/audit/platform-time.test.ts .env.example docs/ENVIRONMENT.md
git commit -m "feat(audit): add platform time zone helpers for audit date ranges"
```

---

### Task 2: Audit labels

**Files:**
- Create: `src/features/audit/lib/audit-labels.ts`
- Test: `src/__tests__/audit/audit-labels.test.ts`

**Interfaces:**
- Produces:
  - `type BadgeColor = "success" | "destructive" | "warning" | "secondary"`
  - `AUDIT_STATUS: Record<AuditStatus, { label: string; color: BadgeColor }>`
  - `ACCESS_REPORT_STATUSES: readonly AuditStatus[]` (SUCCESS, UNUSUAL_IP, ACCESS_DENIED)
  - `SETTINGS_AREA_LABELS`, `SETTINGS_ENTITY_TYPE_LABELS`, `SETTINGS_OPERATION_LABELS` (Records keyed by the SDK enums)
  - `interface FilterOption { label: string; value: string }`
  - `ACCESS_STATUS_OPTIONS`, `SETTINGS_AREA_OPTIONS`, `SETTINGS_ENTITY_TYPE_OPTIONS`, `SETTINGS_OPERATION_OPTIONS: FilterOption[]`
  - `statusDisplay(value?: string | null): { label: string; color: BadgeColor } | null`
  - `labelFor(map: Record<string, string>, value?: string | null): string`

- [ ] **Step 1: Write the failing test**

```ts
// src/__tests__/audit/audit-labels.test.ts
import {
  AuditStatus,
  SettingsArea,
  SettingsEntityType,
  SettingsOperation,
} from "@igrp/platform-access-management-client-ts";
import { describe, expect, it } from "vitest";

import {
  ACCESS_STATUS_OPTIONS,
  AUDIT_STATUS,
  labelFor,
  SETTINGS_AREA_LABELS,
  SETTINGS_ENTITY_TYPE_LABELS,
  SETTINGS_OPERATION_LABELS,
  SETTINGS_OPERATION_OPTIONS,
  statusDisplay,
} from "@/features/audit/lib/audit-labels";

describe("audit labels", () => {
  it("labels every SDK enum value (catches SDK drift at runtime)", () => {
    for (const v of Object.values(AuditStatus)) expect(AUDIT_STATUS[v].label).toBeTruthy();
    for (const v of Object.values(SettingsArea)) expect(SETTINGS_AREA_LABELS[v]).toBeTruthy();
    for (const v of Object.values(SettingsEntityType)) expect(SETTINGS_ENTITY_TYPE_LABELS[v]).toBeTruthy();
    for (const v of Object.values(SettingsOperation)) expect(SETTINGS_OPERATION_LABELS[v]).toBeTruthy();
  });

  it("maps statuses to the agreed badge colors", () => {
    expect(AUDIT_STATUS.SUCCESS.color).toBe("success");
    expect(AUDIT_STATUS.ACCESS_DENIED.color).toBe("destructive");
    expect(AUDIT_STATUS.ERROR.color).toBe("destructive");
    expect(AUDIT_STATUS.UNUSUAL_IP.color).toBe("warning");
    expect(AUDIT_STATUS.PENDING.color).toBe("secondary");
  });

  it("offers only the Access Report statuses on that report", () => {
    expect(ACCESS_STATUS_OPTIONS.map((o) => o.value)).toEqual([
      "SUCCESS",
      "UNUSUAL_IP",
      "ACCESS_DENIED",
    ]);
  });

  it("builds one option per operation, in enum order", () => {
    expect(SETTINGS_OPERATION_OPTIONS).toHaveLength(12);
    expect(SETTINGS_OPERATION_OPTIONS[0]).toEqual({ value: "CREATE", label: "Criação" });
  });

  it("falls back to the raw value, and to a dash when empty", () => {
    expect(statusDisplay("SOMETHING_NEW")).toEqual({ label: "SOMETHING_NEW", color: "secondary" });
    expect(statusDisplay(null)).toBeNull();
    expect(labelFor(SETTINGS_AREA_LABELS, "USERS")).toBe("Utilizadores");
    expect(labelFor(SETTINGS_AREA_LABELS, "NEW_AREA")).toBe("NEW_AREA");
    expect(labelFor(SETTINGS_AREA_LABELS, undefined)).toBe("—");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/audit/audit-labels.test.ts`
Expected: FAIL — cannot resolve `@/features/audit/lib/audit-labels`.

- [ ] **Step 3: Write the implementation**

```ts
// src/features/audit/lib/audit-labels.ts
import {
  AuditStatus,
  SettingsArea,
  SettingsEntityType,
  SettingsOperation,
} from "@igrp/platform-access-management-client-ts";

/* One map for every enum on the audit screen: filters and table cells read the
   same labels, so a value is never named two ways. Filtering always sends the
   raw enum value. */

export type BadgeColor = "success" | "destructive" | "warning" | "secondary";

export interface FilterOption {
  label: string;
  value: string;
}

export const AUDIT_STATUS: Record<
  AuditStatus,
  { label: string; color: BadgeColor }
> = {
  [AuditStatus.SUCCESS]: { label: "Sucesso", color: "success" },
  [AuditStatus.ACCESS_DENIED]: { label: "Acesso negado", color: "destructive" },
  [AuditStatus.UNUSUAL_IP]: { label: "IP invulgar", color: "warning" },
  [AuditStatus.PENDING]: { label: "Pendente", color: "secondary" },
  [AuditStatus.ERROR]: { label: "Erro", color: "destructive" },
};

/** Statuses the Access Report can return (guide §3.4). */
export const ACCESS_REPORT_STATUSES = [
  AuditStatus.SUCCESS,
  AuditStatus.UNUSUAL_IP,
  AuditStatus.ACCESS_DENIED,
] as const;

export const SETTINGS_AREA_LABELS: Record<SettingsArea, string> = {
  [SettingsArea.APPLICATIONS]: "Aplicações",
  [SettingsArea.USERS]: "Utilizadores",
  [SettingsArea.ACCESS]: "Acessos",
};

export const SETTINGS_ENTITY_TYPE_LABELS: Record<SettingsEntityType, string> = {
  [SettingsEntityType.APPLICATION]: "Aplicação",
  [SettingsEntityType.USER]: "Utilizador",
  [SettingsEntityType.DEPARTMENT]: "Departamento",
  [SettingsEntityType.ROLE]: "Perfil",
  [SettingsEntityType.PERMISSION]: "Permissão",
  [SettingsEntityType.MENU]: "Menu",
};

export const SETTINGS_OPERATION_LABELS: Record<SettingsOperation, string> = {
  [SettingsOperation.CREATE]: "Criação",
  [SettingsOperation.DELETE]: "Eliminação",
  [SettingsOperation.EDIT]: "Edição",
  [SettingsOperation.ACTIVATE]: "Ativação",
  [SettingsOperation.DEACTIVATE]: "Desativação",
  [SettingsOperation.INVITE]: "Convite",
  [SettingsOperation.CANCEL_INVITE]: "Cancelamento de convite",
  [SettingsOperation.RESEND_INVITE]: "Reenvio de convite",
  [SettingsOperation.ASSOCIATE]: "Associação",
  [SettingsOperation.DISASSOCIATE]: "Desassociação",
  [SettingsOperation.ASSIGN]: "Atribuição",
  [SettingsOperation.UNASSIGN]: "Remoção de atribuição",
};

function toOptions<K extends string>(
  labels: Record<K, string>,
  values: readonly K[],
): FilterOption[] {
  return values.map((value) => ({ value, label: labels[value] }));
}

const STATUS_LABELS = Object.fromEntries(
  Object.entries(AUDIT_STATUS).map(([k, v]) => [k, v.label]),
) as Record<AuditStatus, string>;

export const ACCESS_STATUS_OPTIONS = toOptions(STATUS_LABELS, ACCESS_REPORT_STATUSES);
export const SETTINGS_AREA_OPTIONS = toOptions(SETTINGS_AREA_LABELS, Object.values(SettingsArea));
export const SETTINGS_ENTITY_TYPE_OPTIONS = toOptions(SETTINGS_ENTITY_TYPE_LABELS, Object.values(SettingsEntityType));
export const SETTINGS_OPERATION_OPTIONS = toOptions(SETTINGS_OPERATION_LABELS, Object.values(SettingsOperation));

export function statusDisplay(
  value?: string | null,
): { label: string; color: BadgeColor } | null {
  if (!value) return null;
  return AUDIT_STATUS[value as AuditStatus] ?? { label: value, color: "secondary" };
}

export function labelFor(
  map: Record<string, string>,
  value?: string | null,
): string {
  if (!value) return "—";
  return map[value] ?? value;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/audit/audit-labels.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/audit/lib/audit-labels.ts src/__tests__/audit/audit-labels.test.ts
git commit -m "feat(audit): add pt-PT labels and filter options for audit enums"
```

---

### Task 3: Report query (URL state)

**Files:**
- Create: `src/features/audit/lib/report-query.ts`
- Test: `src/__tests__/audit/report-query.test.ts`

**Interfaces:**
- Consumes: Task 1 (`RangePreset`, `isRangePreset`, `isValidYmd`, `presetToInstants`, `dayRangeToInstants`, `InstantRange`), Task 2 (`ACCESS_REPORT_STATUSES`).
- Produces:
  - `AUDIT_TABS = ["access", "settings"] as const`, `type AuditTab`, `DEFAULT_TAB`, `isAuditTab(v: unknown): v is AuditTab`
  - `REPORT_FILTER_KEYS: { access: readonly ["username","module","role","status"]; settings: readonly ["performedBy","area","entityType","operation","entityName"] }`
  - `type ReportFilterKey`, `type ReportFilters = Partial<Record<ReportFilterKey, string>>`
  - `type DateRangeSelection = { preset: RangePreset } | { preset: "custom"; from: string; to: string }`
  - `interface ReportQuery { tab: AuditTab; range: DateRangeSelection; page: number; size: number; filters: ReportFilters }`
  - `PAGE_SIZES = [20, 50, 100] as const`, `DEFAULT_PAGE_SIZE = 20`, `REPORT_SORT = "timestamp,desc"`
  - `type ParamsInput = URLSearchParams | Record<string, string | string[] | undefined>`
  - `parseReportQuery(params: ParamsInput): ReportQuery`
  - `serializeReportQuery(q: ReportQuery): URLSearchParams`
  - `withTab`, `withRange`, `withFilter(q, key, value?)`, `withPage`, `withSize`, `clearFilters`, `hasFilters(q): boolean`
  - `rangeToInstants(range: DateRangeSelection, now: Date): InstantRange`
  - `toAccessReportFilters(q, now): AccessReportFilters`, `toSettingsReportFilters(q, now): SettingsReportFilters`

- [ ] **Step 1: Write the failing test**

```ts
// src/__tests__/audit/report-query.test.ts
import { describe, expect, it } from "vitest";

import {
  clearFilters,
  hasFilters,
  parseReportQuery,
  type ReportQuery,
  serializeReportQuery,
  toAccessReportFilters,
  toSettingsReportFilters,
  withFilter,
  withPage,
  withRange,
  withSize,
  withTab,
} from "@/features/audit/lib/report-query";

const now = new Date("2026-09-23T10:00:00.000Z");

const base: ReportQuery = {
  tab: "access",
  range: { preset: "7d" },
  page: 0,
  size: 20,
  filters: {},
};

describe("parseReportQuery", () => {
  it("defaults to the Access tab, last 7 days, first page of 20", () => {
    expect(parseReportQuery(new URLSearchParams())).toEqual(base);
  });

  it("reads a full custom query from URLSearchParams", () => {
    const q = parseReportQuery(
      new URLSearchParams(
        "tab=settings&range=custom&from=2026-09-01&to=2026-09-10&page=2&size=50&area=USERS&entityName=MyRole",
      ),
    );
    expect(q).toEqual({
      tab: "settings",
      range: { preset: "custom", from: "2026-09-01", to: "2026-09-10" },
      page: 2,
      size: 50,
      filters: { area: "USERS", entityName: "MyRole" },
    });
  });

  it("reads a Next.js searchParams record", () => {
    expect(parseReportQuery({ tab: ["settings"], range: "30d" })).toMatchObject({
      tab: "settings",
      range: { preset: "30d" },
    });
  });

  it("falls back to 7 days on an inverted or malformed custom range", () => {
    expect(
      parseReportQuery(new URLSearchParams("range=custom&from=2026-09-10&to=2026-09-01")).range,
    ).toEqual({ preset: "7d" });
    expect(
      parseReportQuery(new URLSearchParams("range=custom&from=2026-09-10")).range,
    ).toEqual({ preset: "7d" });
  });

  it("ignores unknown tabs, negative pages and unsupported sizes", () => {
    const q = parseReportQuery(new URLSearchParams("tab=purge&page=-1&size=7"));
    expect(q.tab).toBe("access");
    expect(q.page).toBe(0);
    expect(q.size).toBe(20);
  });

  it("keeps only the active tab's filters", () => {
    const q = parseReportQuery(new URLSearchParams("tab=access&username=ana&area=USERS"));
    expect(q.filters).toEqual({ username: "ana" });
  });

  it("drops enum filters with values the API does not know (typos look like 'no data')", () => {
    expect(parseReportQuery(new URLSearchParams("status=SUCESS")).filters).toEqual({});
    expect(parseReportQuery(new URLSearchParams("status=PENDING")).filters).toEqual({});
    expect(
      parseReportQuery(new URLSearchParams("tab=settings&operation=EDIT&entityType=role")).filters,
    ).toEqual({ operation: "EDIT" });
  });

  it("trims free-text filters and drops empty ones", () => {
    expect(
      parseReportQuery(new URLSearchParams("role=%20admin%20&username=")).filters,
    ).toEqual({ role: "admin" });
  });
});

describe("serializeReportQuery", () => {
  it("omits defaults", () => {
    expect(serializeReportQuery(base).toString()).toBe("tab=access");
  });

  it("round-trips a non-default query", () => {
    const q: ReportQuery = {
      tab: "settings",
      range: { preset: "custom", from: "2026-09-01", to: "2026-09-10" },
      page: 3,
      size: 100,
      filters: { operation: "EDIT" },
    };
    expect(parseReportQuery(serializeReportQuery(q))).toEqual(q);
  });
});

describe("transitions", () => {
  const filtered: ReportQuery = { ...base, page: 4, filters: { username: "ana" } };

  it("switching tab keeps the range, resets filters and page", () => {
    expect(withTab({ ...filtered, range: { preset: "30d" } }, "settings")).toEqual({
      ...base,
      tab: "settings",
      range: { preset: "30d" },
    });
  });

  it("changing range, filter or size returns to the first page", () => {
    expect(withRange(filtered, { preset: "24h" }).page).toBe(0);
    expect(withFilter(filtered, "status", "SUCCESS")).toEqual({
      ...filtered,
      page: 0,
      filters: { username: "ana", status: "SUCCESS" },
    });
    expect(withSize(filtered, 50)).toMatchObject({ page: 0, size: 50 });
  });

  it("removes a filter when its value is cleared", () => {
    expect(withFilter(filtered, "username", undefined).filters).toEqual({});
  });

  it("paging keeps everything else", () => {
    expect(withPage(filtered, 5)).toEqual({ ...filtered, page: 5 });
  });

  it("clears all filters", () => {
    expect(hasFilters(filtered)).toBe(true);
    expect(hasFilters(clearFilters(filtered))).toBe(false);
  });
});

describe("SDK filter mappers", () => {
  it("builds Access Report filters with instants resolved from now", () => {
    const q: ReportQuery = {
      ...base,
      page: 1,
      filters: { username: "ana@nosi.cv", status: "ACCESS_DENIED" },
    };
    expect(toAccessReportFilters(q, now)).toEqual({
      startDate: "2026-09-16T10:00:00.000Z",
      endDate: "2026-09-23T10:00:00.000Z",
      page: 1,
      size: 20,
      sort: "timestamp,desc",
      username: "ana@nosi.cv",
      status: "ACCESS_DENIED",
    });
  });

  it("builds Settings Report filters from a custom day range, without undefined keys", () => {
    const q: ReportQuery = {
      tab: "settings",
      range: { preset: "custom", from: "2026-09-23", to: "2026-09-23" },
      page: 0,
      size: 20,
      filters: { area: "APPLICATIONS" },
    };
    const result = toSettingsReportFilters(q, now);
    expect(result).toEqual({
      startDate: "2026-09-23T01:00:00.000Z",
      endDate: "2026-09-24T00:59:59.999Z",
      page: 0,
      size: 20,
      sort: "timestamp,desc",
      area: "APPLICATIONS",
    });
    expect(Object.keys(result)).not.toContain("performedBy");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/audit/report-query.test.ts`
Expected: FAIL — cannot resolve `@/features/audit/lib/report-query`.

- [ ] **Step 3: Write the implementation**

```ts
// src/features/audit/lib/report-query.ts
import {
  type AccessReportFilters,
  type AuditStatus,
  SettingsArea,
  SettingsEntityType,
  SettingsOperation,
  type SettingsReportFilters,
} from "@igrp/platform-access-management-client-ts";

import { ACCESS_REPORT_STATUSES } from "./audit-labels";
import {
  dayRangeToInstants,
  type InstantRange,
  isRangePreset,
  isValidYmd,
  presetToInstants,
  type RangePreset,
} from "./platform-time";

/* The whole screen state lives in the URL so a filtered Report is a link an
   administrator can hand over as evidence. This module is the only place that
   reads or writes that state. */

export const AUDIT_TABS = ["access", "settings"] as const;
export type AuditTab = (typeof AUDIT_TABS)[number];
export const DEFAULT_TAB: AuditTab = "access";

export function isAuditTab(value: unknown): value is AuditTab {
  return AUDIT_TABS.includes(value as AuditTab);
}

export const REPORT_FILTER_KEYS = {
  access: ["username", "module", "role", "status"],
  settings: ["performedBy", "area", "entityType", "operation", "entityName"],
} as const satisfies Record<AuditTab, readonly string[]>;

export type ReportFilterKey = (typeof REPORT_FILTER_KEYS)[AuditTab][number];
export type ReportFilters = Partial<Record<ReportFilterKey, string>>;

/* Report filters are plain strings server-side: a misspelled enum returns 200
   with an empty page (guide §9.8). Validating here means a hand-edited URL can
   never produce a silent "no data". */
const ENUM_FILTER_VALUES: Partial<Record<ReportFilterKey, readonly string[]>> = {
  status: ACCESS_REPORT_STATUSES,
  area: Object.values(SettingsArea),
  entityType: Object.values(SettingsEntityType),
  operation: Object.values(SettingsOperation),
};

export type DateRangeSelection =
  | { preset: RangePreset }
  | { preset: "custom"; from: string; to: string };

export const DEFAULT_RANGE: DateRangeSelection = { preset: "7d" };
export const PAGE_SIZES = [20, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 20;
export const REPORT_SORT = "timestamp,desc";

export interface ReportQuery {
  tab: AuditTab;
  range: DateRangeSelection;
  page: number;
  size: number;
  filters: ReportFilters;
}

export type ParamsInput =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

function read(params: ParamsInput, key: string): string | undefined {
  if (params instanceof URLSearchParams) return params.get(key) ?? undefined;
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function toInt(value: string | undefined, fallback: number, min: number) {
  const n = Number(value);
  return value !== undefined && Number.isInteger(n) && n >= min ? n : fallback;
}

function parseRange(
  range: string | undefined,
  from: string | undefined,
  to: string | undefined,
): DateRangeSelection {
  if (range === "custom") {
    return isValidYmd(from) && isValidYmd(to) && from <= to
      ? { preset: "custom", from, to }
      : DEFAULT_RANGE;
  }
  return isRangePreset(range) ? { preset: range } : DEFAULT_RANGE;
}

export function parseReportQuery(params: ParamsInput): ReportQuery {
  const tabRaw = read(params, "tab");
  const tab = isAuditTab(tabRaw) ? tabRaw : DEFAULT_TAB;
  const size = toInt(read(params, "size"), DEFAULT_PAGE_SIZE, 1);

  const filters: ReportFilters = {};
  for (const key of REPORT_FILTER_KEYS[tab]) {
    const value = read(params, key)?.trim();
    if (!value) continue;
    const allowed = ENUM_FILTER_VALUES[key];
    if (allowed && !allowed.includes(value)) continue;
    filters[key] = value;
  }

  return {
    tab,
    range: parseRange(read(params, "range"), read(params, "from"), read(params, "to")),
    page: toInt(read(params, "page"), 0, 0),
    size: (PAGE_SIZES as readonly number[]).includes(size) ? size : DEFAULT_PAGE_SIZE,
    filters,
  };
}

export function serializeReportQuery(q: ReportQuery): URLSearchParams {
  const params = new URLSearchParams();
  params.set("tab", q.tab);
  if (q.range.preset === "custom") {
    params.set("range", "custom");
    params.set("from", q.range.from);
    params.set("to", q.range.to);
  } else if (q.range.preset !== DEFAULT_RANGE.preset) {
    params.set("range", q.range.preset);
  }
  if (q.page > 0) params.set("page", String(q.page));
  if (q.size !== DEFAULT_PAGE_SIZE) params.set("size", String(q.size));
  for (const [key, value] of Object.entries(q.filters)) {
    if (value) params.set(key, value);
  }
  return params;
}

export const withTab = (q: ReportQuery, tab: AuditTab): ReportQuery => ({
  ...q,
  tab,
  page: 0,
  filters: {},
});

export const withRange = (q: ReportQuery, range: DateRangeSelection): ReportQuery => ({
  ...q,
  range,
  page: 0,
});

export function withFilter(
  q: ReportQuery,
  key: ReportFilterKey,
  value: string | undefined,
): ReportQuery {
  const filters = { ...q.filters };
  if (value) filters[key] = value;
  else delete filters[key];
  return { ...q, page: 0, filters };
}

export const withPage = (q: ReportQuery, page: number): ReportQuery => ({ ...q, page });
export const withSize = (q: ReportQuery, size: number): ReportQuery => ({ ...q, size, page: 0 });
export const clearFilters = (q: ReportQuery): ReportQuery => ({ ...q, page: 0, filters: {} });
export const hasFilters = (q: ReportQuery): boolean => Object.keys(q.filters).length > 0;

export function rangeToInstants(range: DateRangeSelection, now: Date): InstantRange {
  return range.preset === "custom"
    ? dayRangeToInstants(range.from, range.to)
    : presetToInstants(range.preset, now);
}

function withoutUndefined<T extends object>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== undefined),
  ) as T;
}

function basePage(q: ReportQuery, now: Date) {
  return { ...rangeToInstants(q.range, now), page: q.page, size: q.size, sort: REPORT_SORT };
}

/* The enum casts are safe: `parseReportQuery` only keeps values from the SDK
   enums (see ENUM_FILTER_VALUES). */
export function toAccessReportFilters(q: ReportQuery, now: Date): AccessReportFilters {
  const f = q.filters;
  return withoutUndefined({
    ...basePage(q, now),
    username: f.username,
    module: f.module,
    role: f.role,
    status: f.status as AuditStatus | undefined,
  });
}

export function toSettingsReportFilters(q: ReportQuery, now: Date): SettingsReportFilters {
  const f = q.filters;
  return withoutUndefined({
    ...basePage(q, now),
    performedBy: f.performedBy,
    area: f.area as SettingsArea | undefined,
    entityType: f.entityType as SettingsEntityType | undefined,
    operation: f.operation as SettingsOperation | undefined,
    entityName: f.entityName,
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/audit/report-query.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck the new module**

Run: `pnpm typecheck`
Expected: 0 errors. If `AccessReportFilters`/`SettingsReportFilters` reject `sort`, check `ReportPageOptions` in `node_modules/@igrp/platform-access-management-client-ts/dist/types/index.d.ts` and match its field names; don't widen with `any`.

- [ ] **Step 6: Commit**

```bash
git add src/features/audit/lib/report-query.ts src/__tests__/audit/report-query.test.ts
git commit -m "feat(audit): add URL-backed report query with validated filters"
```

---

### Task 4: Permission constant and guarded server actions

**Files:**
- Modify: `src/lib/constants.ts` (append)
- Create: `src/actions/audit-reports.ts`
- Test: `src/__tests__/actions/audit-reports.test.ts`

**Interfaces:**
- Produces:
  - `AUDIT_VIEW_PERMISSION = "igrp.audit.view"` in `@/lib/constants`
  - `getAccessReport(filters: AccessReportFilters): Promise<ActionResult<PageResponse<AccessReportRowDTO>>>`
  - `getSettingsReport(filters: SettingsReportFilters): Promise<ActionResult<PageResponse<SettingsReportRowDTO>>>`

- [ ] **Step 1: Add the constant**

Append to `src/lib/constants.ts`:

```ts
/* Gates the whole audit surface (/settings/audit, its actions and routes).
   Contains dots, so the framework matches it verbatim against the token's
   permissions — it is never qualified with the active department. */
export const AUDIT_VIEW_PERMISSION = "igrp.audit.view";
```

- [ ] **Step 2: Write the failing test**

```ts
// src/__tests__/actions/audit-reports.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetAccessReport = vi.fn();
const mockGetSettingsReport = vi.fn();
const mockAuthorize = vi.fn();

vi.mock("@/actions/access-client", () => ({
  getClientAccess: vi.fn(async () => ({
    auditReports: {
      getAccessReport: mockGetAccessReport,
      getSettingsReport: mockGetSettingsReport,
    },
  })),
}));

vi.mock("@igrp/framework-next", () => ({
  igrpAuthorize: (name: string) => mockAuthorize(name),
}));

import { getAccessReport, getSettingsReport } from "@/actions/audit-reports";

const filters = {
  startDate: "2026-09-16T10:00:00.000Z",
  endDate: "2026-09-23T10:00:00.000Z",
};
const page = { content: [], totalElements: 0, totalPages: 0, size: 20, number: 0 };

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthorize.mockResolvedValue(true);
});

describe("getAccessReport", () => {
  it("checks igrp.audit.view and forwards filters to the SDK", async () => {
    mockGetAccessReport.mockResolvedValue({ data: page });

    const result = await getAccessReport(filters);

    expect(mockAuthorize).toHaveBeenCalledWith("igrp.audit.view");
    expect(mockGetAccessReport).toHaveBeenCalledWith(filters);
    expect(result).toEqual({ success: true, data: page });
  });

  it("returns 403 without calling the SDK when the permission is missing", async () => {
    mockAuthorize.mockResolvedValue(false);

    const result = await getAccessReport(filters);

    expect(mockGetAccessReport).not.toHaveBeenCalled();
    expect(result).toMatchObject({ success: false, status: 403 });
  });

  it("maps an SDK 400 to a failed result carrying the status", async () => {
    mockGetAccessReport.mockRejectedValue({ status: 400 });

    const result = await getAccessReport(filters);

    expect(result).toMatchObject({ success: false, status: 400 });
  });
});

describe("getSettingsReport", () => {
  it("checks the permission and forwards filters", async () => {
    mockGetSettingsReport.mockResolvedValue({ data: page });

    const result = await getSettingsReport({ ...filters, area: undefined });

    expect(mockAuthorize).toHaveBeenCalledWith("igrp.audit.view");
    expect(result).toEqual({ success: true, data: page });
  });

  it("returns 403 when the permission is missing", async () => {
    mockAuthorize.mockResolvedValue(false);
    expect(await getSettingsReport(filters)).toMatchObject({ success: false, status: 403 });
    expect(mockGetSettingsReport).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/__tests__/actions/audit-reports.test.ts`
Expected: FAIL — cannot resolve `@/actions/audit-reports`.

- [ ] **Step 4: Write the implementation**

```ts
// src/actions/audit-reports.ts
"use server";

import { igrpAuthorize } from "@igrp/framework-next";
import type {
  AccessReportFilters,
  AccessReportRowDTO,
  PageResponse,
  SettingsReportFilters,
  SettingsReportRowDTO,
} from "@igrp/platform-access-management-client-ts";

import { toActionError } from "@/lib/app-utilities";
import { AUDIT_VIEW_PERMISSION } from "@/lib/constants";

import { getClientAccess } from "./access-client";
import type { ActionResult } from "./types";

/* The page guard is navigation; these checks are the enforcement in front of
   the SDK call (docs/PERMISSIONS.md). The AM API enforces again. */
const FORBIDDEN = {
  success: false,
  error: "Não tem permissão para consultar a auditoria.",
  status: 403,
} as const;

export async function getAccessReport(
  filters: AccessReportFilters,
): Promise<ActionResult<PageResponse<AccessReportRowDTO>>> {
  if (!(await igrpAuthorize(AUDIT_VIEW_PERMISSION))) return FORBIDDEN;
  const client = await getClientAccess();

  try {
    const result = await client.auditReports.getAccessReport(filters);
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[audit-reports] Erro ao carregar o relatório de acessos:", error);
    return { success: false, ...toActionError(error) };
  }
}

export async function getSettingsReport(
  filters: SettingsReportFilters,
): Promise<ActionResult<PageResponse<SettingsReportRowDTO>>> {
  if (!(await igrpAuthorize(AUDIT_VIEW_PERMISSION))) return FORBIDDEN;
  const client = await getClientAccess();

  try {
    const result = await client.auditReports.getSettingsReport(filters);
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[audit-reports] Erro ao carregar o relatório de configurações:", error);
    return { success: false, ...toActionError(error) };
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/__tests__/actions/audit-reports.test.ts`
Expected: PASS. If the "maps an SDK 400" test fails on `status`, read `toActionError` in `src/lib/app-utilities.ts:217` — it passes `status` through when numeric.

- [ ] **Step 6: Commit**

```bash
git add src/lib/constants.ts src/actions/audit-reports.ts src/__tests__/actions/audit-reports.test.ts
git commit -m "feat(audit): add permission-guarded server actions for access and settings reports"
```

---

### Task 5: React Query layer and URL-state hook

**Files:**
- Create: `src/features/audit/query-keys.ts`, `src/features/audit/query-options.ts`, `src/features/audit/use-audit.ts`
- Test: `src/__tests__/audit/query-options.test.ts`

**Interfaces:**
- Consumes: Task 3 (`ReportQuery`, `AuditTab`, `parseReportQuery`, `serializeReportQuery`, `toAccessReportFilters`, `toSettingsReportFilters`), Task 4 actions.
- Produces:
  - `auditKeys.all`, `auditKeys.report(tab: AuditTab, q: ReportQuery)`
  - `accessReportOptions(q)`, `settingsReportOptions(q)` (TanStack `queryOptions`)
  - `useReportQuery(): readonly [ReportQuery, (next: ReportQuery) => void]`
  - `useAccessReport(q)`, `useSettingsReport(q)` (`useQuery` + `keepPreviousData`)
  - `useRedirectOnUnauthorized(error: unknown): void` (replaces the route with `/logout` on an `HttpStatusError` with status 401)

- [ ] **Step 1: Write the failing test**

```ts
// src/__tests__/audit/query-options.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetAccessReport = vi.fn();
const mockGetSettingsReport = vi.fn();

vi.mock("@/actions/audit-reports", () => ({
  getAccessReport: (f: unknown) => mockGetAccessReport(f),
  getSettingsReport: (f: unknown) => mockGetSettingsReport(f),
}));

import type { ReportQuery } from "@/features/audit/lib/report-query";
import { accessReportOptions, settingsReportOptions } from "@/features/audit/query-options";

const q: ReportQuery = {
  tab: "access",
  range: { preset: "24h" },
  page: 0,
  size: 20,
  filters: { status: "SUCCESS" },
};
const page = { content: [], totalElements: 0, totalPages: 0, size: 20, number: 0 };

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("report query options", () => {
  it("keys on the selection, not on computed instants", () => {
    vi.setSystemTime(new Date("2026-09-23T10:00:00Z"));
    const first = accessReportOptions(q).queryKey;
    vi.setSystemTime(new Date("2026-09-23T11:00:00Z"));
    expect(accessReportOptions(q).queryKey).toEqual(first);
  });

  it("separates the two reports in the cache", () => {
    expect(accessReportOptions(q).queryKey).not.toEqual(
      settingsReportOptions({ ...q, tab: "settings", filters: {} }).queryKey,
    );
  });

  it("resolves 'now' when the query runs", async () => {
    mockGetAccessReport.mockResolvedValue({ success: true, data: page });
    vi.setSystemTime(new Date("2026-09-23T12:00:00Z"));

    // biome-ignore lint/style/noNonNullAssertion: queryOptions always sets queryFn here
    const data = await accessReportOptions(q).queryFn!({} as never);

    expect(data).toBe(page);
    expect(mockGetAccessReport).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: "2026-09-22T12:00:00.000Z",
        endDate: "2026-09-23T12:00:00.000Z",
        status: "SUCCESS",
      }),
    );
  });

  it("throws the action's error so the tab can show it", async () => {
    mockGetSettingsReport.mockResolvedValue({ success: false, error: "x", status: 403 });
    await expect(
      // biome-ignore lint/style/noNonNullAssertion: queryOptions always sets queryFn here
      settingsReportOptions({ ...q, tab: "settings", filters: {} }).queryFn!({} as never),
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/audit/query-options.test.ts`
Expected: FAIL — cannot resolve `@/features/audit/query-options`.

- [ ] **Step 3: Write the implementation**

```ts
// src/features/audit/query-keys.ts
import type { AuditTab, ReportQuery } from "./lib/report-query";

/* Keys carry the SELECTION (preset / days, filters, page) — never the
   instants derived from it. "Last 7 days" keeps one cache entry while "now"
   moves; each fetch resolves its own now. */
export const auditKeys = {
  all: ["audit"] as const,
  report: (tab: AuditTab, q: ReportQuery) =>
    ["audit", "report", tab, { range: q.range, page: q.page, size: q.size, filters: q.filters }] as const,
};
```

```ts
// src/features/audit/query-options.ts
import { queryOptions } from "@tanstack/react-query";

import { getAccessReport, getSettingsReport } from "@/actions/audit-reports";
import { unwrap } from "@/actions/types";

import {
  type ReportQuery,
  toAccessReportFilters,
  toSettingsReportFilters,
} from "./lib/report-query";
import { auditKeys } from "./query-keys";

export const accessReportOptions = (q: ReportQuery) =>
  queryOptions({
    queryKey: auditKeys.report("access", q),
    queryFn: async () => unwrap(await getAccessReport(toAccessReportFilters(q, new Date()))),
  });

export const settingsReportOptions = (q: ReportQuery) =>
  queryOptions({
    queryKey: auditKeys.report("settings", q),
    queryFn: async () => unwrap(await getSettingsReport(toSettingsReportFilters(q, new Date()))),
  });
```

```ts
// src/features/audit/use-audit.ts
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";

import { HttpStatusError } from "@/lib/errors";

import { parseReportQuery, type ReportQuery, serializeReportQuery } from "./lib/report-query";
import { accessReportOptions, settingsReportOptions } from "./query-options";

/** The screen's state, read from and written to the URL. */
export function useReportQuery() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const query = useMemo(
    () => parseReportQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const setQuery = useCallback(
    (next: ReportQuery) => {
      router.replace(`?${serializeReportQuery(next).toString()}`, { scroll: false });
    },
    [router],
  );

  return [query, setQuery] as const;
}

export const useAccessReport = (q: ReportQuery) =>
  useQuery({ ...accessReportOptions(q), placeholderData: keepPreviousData });

export const useSettingsReport = (q: ReportQuery) =>
  useQuery({ ...settingsReportOptions(q), placeholderData: keepPreviousData });

/* The API ends sessions well before tokens expire (guide §9.1). A 401 from a
   report is a dead session, not a bad filter: follow the app's expiry path. */
export function useRedirectOnUnauthorized(error: unknown) {
  const router = useRouter();
  useEffect(() => {
    if (error instanceof HttpStatusError && error.status === 401) {
      router.replace("/logout");
    }
  }, [error, router]);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/audit/query-options.test.ts`
Expected: PASS.

- [ ] **Step 5: Test the 401 redirect**

```tsx
// src/__tests__/audit/use-redirect-on-unauthorized.test.tsx
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
const ROUTER = { replace };
vi.mock("next/navigation", () => ({
  useRouter: () => ROUTER,
  useSearchParams: () => new URLSearchParams(),
}));

import { useRedirectOnUnauthorized } from "@/features/audit/use-audit";
import { HttpStatusError } from "@/lib/errors";

beforeEach(() => vi.clearAllMocks());

describe("useRedirectOnUnauthorized", () => {
  it("sends a dead session to /logout", () => {
    renderHook(() => useRedirectOnUnauthorized(new HttpStatusError(401, "session_expired")));
    expect(replace).toHaveBeenCalledWith("/logout");
  });

  it("ignores other failures", () => {
    renderHook(() => useRedirectOnUnauthorized(new HttpStatusError(403)));
    renderHook(() => useRedirectOnUnauthorized(null));
    expect(replace).not.toHaveBeenCalled();
  });
});
```

Run: `npx vitest run src/__tests__/audit/use-redirect-on-unauthorized.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/audit/query-keys.ts src/features/audit/query-options.ts src/features/audit/use-audit.ts src/__tests__/audit/query-options.test.ts src/__tests__/audit/use-redirect-on-unauthorized.test.tsx
git commit -m "feat(audit): add report query layer keyed on selection, resolving now at fetch"
```

---

### Task 6: Shared report UI pieces

**Files:**
- Create: `src/features/audit/components/filter-controls.tsx`, `audit-status-badge.tsx`, `report-pager.tsx`, `report-empty-state.tsx`, `report-table-skeleton.tsx`
- Test: `src/__tests__/audit/components/report-pager.test.tsx`, `src/__tests__/audit/components/report-empty-state.test.tsx`

**Interfaces:**
- Consumes: Task 2 (`FilterOption`, `statusDisplay`), Task 3 (`PAGE_SIZES`).
- Produces:
  - `FilterSelect({ id, label, options: FilterOption[], value?: string, onChange: (v?: string) => void })`
  - `FilterCombobox({ id, label, options: FilterOption[], value?: string, onChange: (v?: string) => void, disabled?: boolean })`
  - `ExactMatchInput({ id, label, value?: string, onCommit: (v?: string) => void, placeholder?: string })`
  - `AuditStatusBadge({ status?: string | null })`
  - `ReportPager({ page, size, totalPages, totalElements, onPageChange, onSizeChange, disabled? })`
  - `ReportEmptyState({ filtered: boolean, onClearFilters: () => void })`
  - `ReportTableSkeleton()`

- [ ] **Step 1: Write the failing tests**

```tsx
// src/__tests__/audit/components/report-pager.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@igrp/igrp-framework-react-design-system", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    "aria-label": ariaLabel,
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    "aria-label"?: string;
  }) => (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={ariaLabel}>
      {children}
    </button>
  ),
  IGRPIcon: () => null,
  IGRPSelect: () => <div data-testid="page-size" />,
}));

import { ReportPager } from "@/features/audit/components/report-pager";

const props = {
  size: 20,
  totalPages: 3,
  totalElements: 42,
  onPageChange: vi.fn(),
  onSizeChange: vi.fn(),
};

describe("ReportPager", () => {
  it("shows the total and the current page", () => {
    render(<ReportPager {...props} page={0} />);
    expect(screen.getByText("42 eventos")).toBeInTheDocument();
    expect(screen.getByText("Página 1 de 3")).toBeInTheDocument();
  });

  it("disables 'previous' on the first page and moves forward", async () => {
    const onPageChange = vi.fn();
    render(<ReportPager {...props} page={0} onPageChange={onPageChange} />);
    expect(screen.getByRole("button", { name: "Página anterior" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Página seguinte" }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("disables 'next' on the last page", () => {
    render(<ReportPager {...props} page={2} />);
    expect(screen.getByRole("button", { name: "Página seguinte" })).toBeDisabled();
  });

  it("uses the singular for one event", () => {
    render(<ReportPager {...props} page={0} totalPages={1} totalElements={1} />);
    expect(screen.getByText("1 evento")).toBeInTheDocument();
  });
});
```

```tsx
// src/__tests__/audit/components/report-empty-state.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@igrp/igrp-framework-react-design-system", () => {
  const Pass = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return {
    Button: ({ children, onClick }: { children?: React.ReactNode; onClick?: () => void }) => (
      <button type="button" onClick={onClick}>
        {children}
      </button>
    ),
    Empty: Pass,
    EmptyContent: Pass,
    EmptyDescription: Pass,
    EmptyHeader: Pass,
    EmptyMedia: Pass,
    EmptyTitle: Pass,
    IGRPIcon: () => null,
  };
});

import { ReportEmptyState } from "@/features/audit/components/report-empty-state";

describe("ReportEmptyState", () => {
  it("offers to clear filters when filters are active", async () => {
    const onClear = vi.fn();
    render(<ReportEmptyState filtered onClearFilters={onClear} />);
    expect(screen.getByText("Nenhum evento corresponde aos filtros")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it("suggests widening the period when nothing is filtered", () => {
    render(<ReportEmptyState filtered={false} onClearFilters={vi.fn()} />);
    expect(screen.getByText("Sem eventos neste período")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/audit/components`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write the implementations**

```tsx
// src/features/audit/components/filter-controls.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

import {
  IGRPCombobox,
  IGRPSelect,
  Input,
  Label,
} from "@igrp/igrp-framework-react-design-system";

import type { FilterOption } from "../lib/audit-labels";

/* `IGRPSelect` keeps its selection in internal state and never re-reads
   `value`, so it is keyed on the value: "Limpar filtros" (or a back
   navigation) remounts it showing the URL's truth. Radix Select rejects an
   empty-string item, hence the sentinel for "Todos". */
const ALL = "__all__";

interface FilterFieldProps {
  id: string;
  label: string;
  options: FilterOption[];
  value?: string;
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
}

export function FilterSelect({ id, label, options, value, onChange, disabled }: FilterFieldProps) {
  const withAll = useMemo(() => [{ label: "Todos", value: ALL }, ...options], [options]);
  return (
    <IGRPSelect
      key={value ?? ALL}
      id={id}
      label={label}
      options={withAll}
      value={value ?? ALL}
      disabled={disabled}
      onValueChange={(next) => onChange(next === ALL ? undefined : next)}
    />
  );
}

export function FilterCombobox({ id, label, options, value, onChange, disabled }: FilterFieldProps) {
  return (
    <IGRPCombobox
      id={id}
      label={label}
      variant="single"
      showSearch
      options={options}
      value={value ?? ""}
      disabled={disabled}
      placeholder="Todos"
      searchText="Pesquisar…"
      selectLabel="Sem resultados"
      onChange={(next) => onChange(typeof next === "string" && next ? next : undefined)}
    />
  );
}

interface ExactMatchInputProps {
  id: string;
  label: string;
  value?: string;
  onCommit: (value: string | undefined) => void;
  placeholder?: string;
}

/* Report filters are exact-match (guide §9.8), so this commits on Enter or
   blur — not per keystroke — and says so under the field. */
export function ExactMatchInput({ id, label, value, onCommit, placeholder }: ExactMatchInputProps) {
  const [draft, setDraft] = useState(value ?? "");
  useEffect(() => setDraft(value ?? ""), [value]);

  const commit = () => {
    const next = draft.trim();
    if (next !== (value ?? "")) onCommit(next || undefined);
  };

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={draft}
        placeholder={placeholder}
        spellCheck={false}
        aria-describedby={`${id}-hint`}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
        }}
      />
      <p id={`${id}-hint`} className="text-xs text-muted-foreground">
        Correspondência exata
      </p>
    </div>
  );
}
```

```tsx
// src/features/audit/components/audit-status-badge.tsx
import { IGRPBadge } from "@igrp/igrp-framework-react-design-system";

import { statusDisplay } from "../lib/audit-labels";

export function AuditStatusBadge({ status }: { status?: string | null }) {
  const display = statusDisplay(status);
  if (!display) return <span className="text-muted-foreground">—</span>;
  return (
    <IGRPBadge variant="soft" color={display.color}>
      {display.label}
    </IGRPBadge>
  );
}
```

```tsx
// src/features/audit/components/report-pager.tsx
"use client";

import { Button, IGRPIcon, IGRPSelect } from "@igrp/igrp-framework-react-design-system";

import { PAGE_SIZES } from "../lib/report-query";

/* Our own pager, not IGRPDataTable's: the table keeps its page index in
   internal state from 0 and cannot be seeded from the URL. */
const SIZE_OPTIONS = PAGE_SIZES.map((s) => ({ label: `${s} por página`, value: String(s) }));
const count = new Intl.NumberFormat("pt-PT");

interface ReportPagerProps {
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
  disabled?: boolean;
}

export function ReportPager({
  page,
  size,
  totalPages,
  totalElements,
  onPageChange,
  onSizeChange,
  disabled = false,
}: ReportPagerProps) {
  const pages = Math.max(totalPages, 1);
  return (
    <nav
      aria-label="Paginação do relatório"
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
    >
      <p className="text-sm text-muted-foreground">
        {count.format(totalElements)} {totalElements === 1 ? "evento" : "eventos"}
      </p>
      <div className="flex items-center gap-2">
        <IGRPSelect
          key={size}
          id="report-page-size"
          options={SIZE_OPTIONS}
          value={String(size)}
          disabled={disabled}
          onValueChange={(v) => onSizeChange(Number(v))}
        />
        <Button
          variant="outline"
          size="icon"
          aria-label="Página anterior"
          disabled={disabled || page <= 0}
          onClick={() => onPageChange(page - 1)}
        >
          <IGRPIcon iconName="ChevronLeft" aria-hidden="true" />
        </Button>
        <span className="text-sm tabular-nums">
          Página {page + 1} de {pages}
        </span>
        <Button
          variant="outline"
          size="icon"
          aria-label="Página seguinte"
          disabled={disabled || page >= pages - 1}
          onClick={() => onPageChange(page + 1)}
        >
          <IGRPIcon iconName="ChevronRight" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
```

```tsx
// src/features/audit/components/report-empty-state.tsx
"use client";

import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";

/* A filtered empty page is usually a near-miss on an exact-match filter, not
   missing data (guide §9.8) — so the filtered variant says so and offers the
   way out. */
export function ReportEmptyState({
  filtered,
  onClearFilters,
}: {
  filtered: boolean;
  onClearFilters: () => void;
}) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IGRPIcon iconName="FileSearch" aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>
          {filtered ? "Nenhum evento corresponde aos filtros" : "Sem eventos neste período"}
        </EmptyTitle>
        <EmptyDescription>
          {filtered
            ? "Os filtros exigem o valor exato. Limpe-os para confirmar se existem eventos no período."
            : "Alargue o período para ver eventos anteriores."}
        </EmptyDescription>
      </EmptyHeader>
      {filtered && (
        <EmptyContent>
          <Button variant="outline" onClick={onClearFilters}>
            Limpar filtros
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}
```

```tsx
// src/features/audit/components/report-table-skeleton.tsx
import { Skeleton } from "@igrp/igrp-framework-react-design-system";

export function ReportTableSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-busy="true">
      {Array.from({ length: 8 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton loader
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/audit/components`
Expected: PASS. If `EmptyMedia` has no `variant` prop, check `node_modules/@igrp/igrp-framework-react-design-system/dist/components/primitives/empty.d.ts` and drop the prop.

- [ ] **Step 5: Check UI rules and types**

Run: `pnpm check:ui && pnpm typecheck`
Expected: 0 violations, 0 errors. If `IGRPBadge` rejects `color`, its type is `IGRPColorVariants`; our `BadgeColor` values are all members of it.

- [ ] **Step 6: Commit**

```bash
git add src/features/audit/components src/__tests__/audit/components
git commit -m "feat(audit): add report filter controls, pager, status badge and empty state"
```

---

### Task 7: Date range control

**Files:**
- Create: `src/features/audit/components/report-date-range.tsx`
- Test: `src/__tests__/audit/components/report-date-range.test.tsx`

**Interfaces:**
- Consumes: Task 1 (`todayYmd`, `ymdToLocalDate`, `localDateToYmd`, `formatYmd`, `isRangePreset`, `PLATFORM_TIME_ZONE_LABEL`), Task 3 (`DateRangeSelection`).
- Produces: `ReportDateRange({ range: DateRangeSelection, onChange: (r: DateRangeSelection) => void })`

- [ ] **Step 1: Write the failing test**

```tsx
// src/__tests__/audit/components/report-date-range.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@igrp/igrp-framework-react-design-system", () => {
  const Pass = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return {
    Button: ({ children }: { children?: React.ReactNode }) => (
      <button type="button">{children}</button>
    ),
    IGRPCalendarRange: () => <div data-testid="calendar" />,
    IGRPIcon: () => null,
    IGRPSelect: ({
      options,
      onValueChange,
      label,
    }: {
      options: { label: string; value: string }[];
      onValueChange?: (v: string) => void;
      label?: string;
    }) => (
      <div aria-label={label}>
        {options.map((o) => (
          <button key={o.value} type="button" onClick={() => onValueChange?.(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    ),
    Popover: Pass,
    PopoverContent: Pass,
    PopoverTrigger: Pass,
  };
});

import { ReportDateRange } from "@/features/audit/components/report-date-range";

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date("2026-09-24T00:30:00Z")); // 23:30 on the 23rd in CV
});
afterEach(() => vi.useRealTimers());

describe("ReportDateRange", () => {
  it("switches to a preset", async () => {
    const onChange = vi.fn();
    render(<ReportDateRange range={{ preset: "7d" }} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Últimas 24 horas" }));
    expect(onChange).toHaveBeenCalledWith({ preset: "24h" });
  });

  it("starts a custom range on today in Cabo Verde time", async () => {
    const onChange = vi.fn();
    render(<ReportDateRange range={{ preset: "7d" }} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Personalizado" }));
    expect(onChange).toHaveBeenCalledWith({
      preset: "custom",
      from: "2026-09-23",
      to: "2026-09-23",
    });
  });

  it("shows the chosen days and the time zone", () => {
    render(
      <ReportDateRange
        range={{ preset: "custom", from: "2026-09-01", to: "2026-09-10" }}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText("01/09/2026 – 10/09/2026")).toBeInTheDocument();
    expect(screen.getByText("Hora de Cabo Verde")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/audit/components/report-date-range.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```tsx
// src/features/audit/components/report-date-range.tsx
"use client";

import {
  Button,
  IGRPCalendarRange,
  IGRPIcon,
  IGRPSelect,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@igrp/igrp-framework-react-design-system";

import {
  formatYmd,
  isRangePreset,
  localDateToYmd,
  PLATFORM_TIME_ZONE_LABEL,
  todayYmd,
  ymdToLocalDate,
} from "../lib/platform-time";
import type { DateRangeSelection } from "../lib/report-query";

const PRESET_OPTIONS = [
  { label: "Últimas 24 horas", value: "24h" },
  { label: "Últimos 7 dias", value: "7d" },
  { label: "Últimos 30 dias", value: "30d" },
  { label: "Personalizado", value: "custom" },
];

/* Dates are required by every Report (guide §3), so there is no "all time".
   A range calendar cannot produce from > to, so the inverted-range 400
   (§9.3) is unreachable from here. */
export function ReportDateRange({
  range,
  onChange,
}: {
  range: DateRangeSelection;
  onChange: (range: DateRangeSelection) => void;
}) {
  const handlePreset = (value: string) => {
    if (value === "custom") {
      const today = todayYmd(new Date());
      onChange({ preset: "custom", from: today, to: today });
    } else if (isRangePreset(value)) {
      onChange({ preset: value });
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-end gap-3">
      <IGRPSelect
        key={range.preset}
        id="report-range"
        label="Período"
        options={PRESET_OPTIONS}
        value={range.preset}
        onValueChange={handlePreset}
      />
      {range.preset === "custom" && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <IGRPIcon iconName="CalendarDays" aria-hidden="true" />
              {`${formatYmd(range.from)} – ${formatYmd(range.to)}`}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <IGRPCalendarRange
              date={{ from: ymdToLocalDate(range.from), to: ymdToLocalDate(range.to) }}
              disableAfter={ymdToLocalDate(todayYmd(new Date()))}
              onDateChange={(next) => {
                if (next?.from && next.to) {
                  onChange({
                    preset: "custom",
                    from: localDateToYmd(next.from),
                    to: localDateToYmd(next.to),
                  });
                }
              }}
            />
          </PopoverContent>
        </Popover>
      )}
      <p className="text-xs text-muted-foreground sm:pb-2">{PLATFORM_TIME_ZONE_LABEL}</p>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/audit/components/report-date-range.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/audit/components/report-date-range.tsx src/__tests__/audit/components/report-date-range.test.tsx
git commit -m "feat(audit): add report date range control in the platform time zone"
```

---

### Task 8: Access Report tab

**Files:**
- Create: `src/features/audit/components/access-report-columns.tsx`, `src/features/audit/components/access-report-tab.tsx`
- Test: `src/__tests__/audit/components/access-report-tab.test.tsx`

**Interfaces:**
- Consumes: Task 1 `formatAuditDateTime`; Task 2 `ACCESS_STATUS_OPTIONS`; Task 3 `ReportQuery`, `withFilter`, `withPage`, `withSize`, `clearFilters`, `hasFilters`; Task 5 `useAccessReport`; Task 6 components; existing `useUsers` (`@/features/users/use-users`), `useApplications` (`@/features/applications/use-applications`), `InlineError` (`@/components/inline-error`).
- Produces: `AccessReportTab({ query: ReportQuery, onQueryChange: (q: ReportQuery) => void })`, `ACCESS_COLUMNS`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/__tests__/audit/components/access-report-tab.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseAccessReport = vi.fn();

vi.mock("@/features/audit/use-audit", () => ({
  useAccessReport: (q: unknown) => mockUseAccessReport(q),
  useRedirectOnUnauthorized: () => undefined,
}));
const USERS = { data: [] };
const APPS = { data: [] };
vi.mock("@/features/users/use-users", () => ({ useUsers: () => USERS }));
vi.mock("@/features/applications/use-applications", () => ({ useApplications: () => APPS }));

vi.mock("@igrp/igrp-framework-react-design-system", () => {
  const Pass = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return {
    Button: ({ children, onClick }: { children?: React.ReactNode; onClick?: () => void }) => (
      <button type="button" onClick={onClick}>
        {children}
      </button>
    ),
    Empty: Pass,
    EmptyContent: Pass,
    EmptyDescription: Pass,
    EmptyHeader: Pass,
    EmptyMedia: Pass,
    EmptyTitle: Pass,
    IGRPBadge: Pass,
    IGRPCombobox: () => null,
    IGRPDataTable: ({ data }: { data: { username?: string }[] }) => (
      <table>
        <tbody>
          {data.map((r) => (
            <tr key={r.username}>
              <td>{r.username}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    IGRPDataTableHeaderDefault: ({ title }: { title: string }) => <span>{title}</span>,
    IGRPIcon: () => null,
    IGRPSelect: () => null,
    Input: () => null,
    Label: Pass,
    Skeleton: () => <div data-testid="skeleton" />,
  };
});
vi.mock("@/components/inline-error", () => ({
  InlineError: ({ title, onRetry }: { title?: string; onRetry?: () => void }) => (
    <button type="button" onClick={onRetry}>
      {title}
    </button>
  ),
}));

import { AccessReportTab } from "@/features/audit/components/access-report-tab";
import type { ReportQuery } from "@/features/audit/lib/report-query";

const query: ReportQuery = {
  tab: "access",
  range: { preset: "7d" },
  page: 0,
  size: 20,
  filters: { status: "ACCESS_DENIED" },
};

const LOADED = {
  error: null,
  isPending: false,
  isError: false,
  isFetching: false,
  refetch: vi.fn(),
  data: {
    content: [{ username: "ana@nosi.cv", status: "ACCESS_DENIED" }],
    totalElements: 1,
    totalPages: 1,
  },
};
const EMPTY = { ...LOADED, data: { content: [], totalElements: 0, totalPages: 0 } };
const FAILED = { ...LOADED, isError: true, data: undefined, refetch: vi.fn() };

beforeEach(() => vi.clearAllMocks());

describe("AccessReportTab", () => {
  it("renders the page of rows", () => {
    mockUseAccessReport.mockReturnValue(LOADED);
    render(<AccessReportTab query={query} onQueryChange={vi.fn()} />);
    expect(screen.getByText("ana@nosi.cv")).toBeInTheDocument();
    expect(screen.getByText("1 evento")).toBeInTheDocument();
  });

  it("offers to clear filters on an empty filtered page", async () => {
    mockUseAccessReport.mockReturnValue(EMPTY);
    const onQueryChange = vi.fn();
    render(<AccessReportTab query={query} onQueryChange={onQueryChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(onQueryChange).toHaveBeenCalledWith({ ...query, filters: {} });
  });

  it("shows an inline error with retry", async () => {
    mockUseAccessReport.mockReturnValue(FAILED);
    render(<AccessReportTab query={query} onQueryChange={vi.fn()} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Não foi possível carregar o relatório de acessos." }),
    );
    expect(FAILED.refetch).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/audit/components/access-report-tab.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```tsx
// src/features/audit/components/access-report-columns.tsx
"use client";

import {
  type ColumnDef,
  IGRPDataTableHeaderDefault,
} from "@igrp/igrp-framework-react-design-system";
import type { AccessReportRowDTO } from "@igrp/platform-access-management-client-ts";

import { formatAuditDateTime } from "../lib/platform-time";
import { AuditStatusBadge } from "./audit-status-badge";

const text = (value?: string | null) => value || "—";

/* Module scope: IGRPDataTable needs a referentially stable column array. */
export const ACCESS_COLUMNS: ColumnDef<AccessReportRowDTO>[] = [
  {
    accessorKey: "timestamp",
    header: () => <IGRPDataTableHeaderDefault title="Data e hora" />,
    cell: ({ row }) => (
      <span className="whitespace-nowrap tabular-nums">
        {formatAuditDateTime(row.original.timestamp)}
      </span>
    ),
  },
  {
    accessorKey: "username",
    header: () => <IGRPDataTableHeaderDefault title="Utilizador" />,
    cell: ({ row }) => text(row.original.username),
  },
  {
    accessorKey: "role",
    header: () => <IGRPDataTableHeaderDefault title="Perfil" />,
    cell: ({ row }) => text(row.original.role),
  },
  {
    accessorKey: "module",
    header: () => <IGRPDataTableHeaderDefault title="Módulo" />,
    cell: ({ row }) => text(row.original.module),
  },
  {
    accessorKey: "action",
    header: () => <IGRPDataTableHeaderDefault title="Ação" />,
    cell: ({ row }) => text(row.original.action),
  },
  {
    accessorKey: "ipAddress",
    header: () => <IGRPDataTableHeaderDefault title="IP" />,
    cell: ({ row }) => <span className="tabular-nums">{text(row.original.ipAddress)}</span>,
  },
  {
    accessorKey: "status",
    header: () => <IGRPDataTableHeaderDefault title="Estado" />,
    cell: ({ row }) => <AuditStatusBadge status={row.original.status} />,
  },
];
```

```tsx
// src/features/audit/components/access-report-tab.tsx
"use client";

import { useEffect, useMemo } from "react";

import { IGRPDataTable } from "@igrp/igrp-framework-react-design-system";

import { InlineError } from "@/components/inline-error";
import { useApplications } from "@/features/applications/use-applications";
import { useUsers } from "@/features/users/use-users";

import { ACCESS_STATUS_OPTIONS } from "../lib/audit-labels";
import {
  clearFilters,
  hasFilters,
  type ReportFilterKey,
  type ReportQuery,
  withFilter,
  withPage,
  withSize,
} from "../lib/report-query";
import { useAccessReport, useRedirectOnUnauthorized } from "../use-audit";
import { ACCESS_COLUMNS } from "./access-report-columns";
import { ExactMatchInput, FilterCombobox, FilterSelect } from "./filter-controls";
import { ReportEmptyState } from "./report-empty-state";
import { ReportPager } from "./report-pager";
import { ReportTableSkeleton } from "./report-table-skeleton";

interface ReportTabProps {
  query: ReportQuery;
  onQueryChange: (next: ReportQuery) => void;
}

function AccessReportFilterBar({ query, onQueryChange }: ReportTabProps) {
  const { data: users } = useUsers();
  const { data: applications } = useApplications();

  /* Values must equal what the report stores, exactly (§9.8/§9.9): the login
     name for users, the application code for modules. */
  const userOptions = useMemo(
    () =>
      (users ?? []).map((u) => ({
        label: u.name ? `${u.name} (${u.email})` : u.email,
        value: u.username ?? u.email,
      })),
    [users],
  );
  const applicationOptions = useMemo(
    () => (applications ?? []).map((a) => ({ label: a.name, value: a.code })),
    [applications],
  );

  const set = (key: ReportFilterKey) => (value: string | undefined) =>
    onQueryChange(withFilter(query, key, value));

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <FilterCombobox
        id="access-username"
        label="Utilizador"
        options={userOptions}
        value={query.filters.username}
        onChange={set("username")}
      />
      <FilterCombobox
        id="access-module"
        label="Módulo"
        options={applicationOptions}
        value={query.filters.module}
        onChange={set("module")}
      />
      <ExactMatchInput
        id="access-role"
        label="Perfil"
        placeholder="Código do perfil"
        value={query.filters.role}
        onCommit={set("role")}
      />
      <FilterSelect
        id="access-status"
        label="Estado"
        options={ACCESS_STATUS_OPTIONS}
        value={query.filters.status}
        onChange={set("status")}
      />
    </div>
  );
}

export function AccessReportTab({ query, onQueryChange }: ReportTabProps) {
  const { data, error, isPending, isError, isFetching, refetch } = useAccessReport(query);
  const rows = useMemo(() => data?.content ?? [], [data]);
  useRedirectOnUnauthorized(error);

  /* A shared link can point past the last page once rows age out of the
     window; fall back to the first page instead of an empty table. */
  useEffect(() => {
    if (data && data.content.length === 0 && data.totalElements > 0 && query.page > 0) {
      onQueryChange(withPage(query, 0));
    }
  }, [data, query, onQueryChange]);

  return (
    <div className="flex flex-col gap-4">
      <AccessReportFilterBar query={query} onQueryChange={onQueryChange} />
      {isError ? (
        <InlineError
          title="Não foi possível carregar o relatório de acessos."
          message="Tente novamente. Se o problema persistir, contacte o suporte."
          onRetry={() => refetch()}
        />
      ) : isPending ? (
        <ReportTableSkeleton />
      ) : rows.length === 0 ? (
        <ReportEmptyState
          filtered={hasFilters(query)}
          onClearFilters={() => onQueryChange(clearFilters(query))}
        />
      ) : (
        <>
          <IGRPDataTable columns={ACCESS_COLUMNS} data={rows} showPagination={false} />
          <ReportPager
            page={query.page}
            size={query.size}
            totalPages={data?.totalPages ?? 0}
            totalElements={data?.totalElements ?? 0}
            disabled={isFetching}
            onPageChange={(page) => onQueryChange(withPage(query, page))}
            onSizeChange={(size) => onQueryChange(withSize(query, size))}
          />
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/audit/components/access-report-tab.test.tsx`
Expected: PASS. The `clearFilters` assertion expects `{ ...query, filters: {} }` — `clearFilters` also sets `page: 0`, which `query` already has.

- [ ] **Step 5: Typecheck and UI rules**

Run: `pnpm typecheck && pnpm check:ui`
Expected: 0 errors / 0 violations. If `ColumnDef` isn't re-exported by the DS for this generic, import it from `@tanstack/react-table` as `users-columns.tsx` does via the DS; check `src/features/users/components/users-columns.tsx:5`.

- [ ] **Step 6: Commit**

```bash
git add src/features/audit/components/access-report-columns.tsx src/features/audit/components/access-report-tab.tsx src/__tests__/audit/components/access-report-tab.test.tsx
git commit -m "feat(audit): add Access Report tab with exact-match filters and server paging"
```

---

### Task 9: Settings diff parser and Settings Report tab

**Files:**
- Create: `src/features/audit/lib/settings-diff.ts`, `src/features/audit/components/settings-change-detail.tsx`, `src/features/audit/components/settings-report-columns.tsx`, `src/features/audit/components/settings-report-tab.tsx`
- Test: `src/__tests__/audit/settings-diff.test.ts`, `src/__tests__/audit/components/settings-change-detail.test.tsx`

**Interfaces:**
- Consumes: Tasks 1, 2 (`SETTINGS_*_LABELS`, `SETTINGS_*_OPTIONS`, `labelFor`), 3, 5 (`useSettingsReport`), 6.
- Produces:
  - `interface FieldChange { field: string; previous: string | null; next: string | null }`
  - `parseSettingsDiff(previous?: string | null, next?: string | null): FieldChange[] | null`
  - `SettingsChangeDetail({ row: SettingsReportRowDTO })`, `SETTINGS_COLUMNS`, `SettingsReportTab({ query, onQueryChange })`

- [ ] **Step 1: Write the failing tests**

```ts
// src/__tests__/audit/settings-diff.test.ts
import { describe, expect, it } from "vitest";

import { parseSettingsDiff } from "@/features/audit/lib/settings-diff";

describe("parseSettingsDiff", () => {
  it("pairs a single field", () => {
    expect(parseSettingsDiff("description=audit test", "description=edited via test")).toEqual([
      { field: "description", previous: "audit test", next: "edited via test" },
    ]);
  });

  it("pairs several semicolon-separated fields, keeping order", () => {
    expect(parseSettingsDiff("name=A;status=ACTIVE", "name=B;status=INACTIVE")).toEqual([
      { field: "name", previous: "A", next: "B" },
      { field: "status", previous: "ACTIVE", next: "INACTIVE" },
    ]);
  });

  it("splits on the first '=' only", () => {
    expect(parseSettingsDiff("url=a=b", "url=c")).toEqual([
      { field: "url", previous: "a=b", next: "c" },
    ]);
  });

  it("handles a field present on one side only", () => {
    expect(parseSettingsDiff("", "picture=x.png")).toEqual([
      { field: "picture", previous: null, next: "x.png" },
    ]);
  });

  it("returns null when either side is not in field=value form", () => {
    expect(parseSettingsDiff("just text", "name=B")).toBeNull();
    expect(parseSettingsDiff("name=A", "=oops")).toBeNull();
  });

  it("returns null when there is nothing to show", () => {
    expect(parseSettingsDiff(null, null)).toBeNull();
    expect(parseSettingsDiff("", undefined)).toBeNull();
  });
});
```

```tsx
// src/__tests__/audit/components/settings-change-detail.test.tsx
import type { SettingsReportRowDTO } from "@igrp/platform-access-management-client-ts";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SettingsChangeDetail } from "@/features/audit/components/settings-change-detail";

const row = (over: Partial<SettingsReportRowDTO>) =>
  ({ relatedEntity: null, previousValue: null, newValue: null, ...over }) as SettingsReportRowDTO;

describe("SettingsChangeDetail", () => {
  it("lists each changed field from old to new", () => {
    render(<SettingsChangeDetail row={row({ previousValue: "name=A", newValue: "name=B" })} />);
    expect(screen.getByText("name")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("falls back to the raw values when they can't be parsed", () => {
    render(<SettingsChangeDetail row={row({ previousValue: "free text", newValue: "other" })} />);
    expect(screen.getByText("free text")).toBeInTheDocument();
    expect(screen.getByText("Anterior")).toBeInTheDocument();
  });

  it("shows the related entity", () => {
    render(<SettingsChangeDetail row={row({ relatedEntity: "MyRole" })} />);
    expect(screen.getByText("MyRole")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/audit/settings-diff.test.ts src/__tests__/audit/components/settings-change-detail.test.tsx`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write the parser**

```ts
// src/features/audit/lib/settings-diff.ts

/* The Settings Report encodes edits as `field=old` → `field=new`, several
   fields separated by `;` (guide §3.3). Values are free text and may contain
   either character, so this never throws: anything it can't read cleanly
   returns null and the caller shows the raw strings. */

export interface FieldChange {
  field: string;
  previous: string | null;
  next: string | null;
}

function parseSide(value: string | null | undefined): Map<string, string> | null {
  const pairs = new Map<string, string>();
  if (!value) return pairs;
  for (const part of value.split(";")) {
    if (part === "") continue;
    const eq = part.indexOf("=");
    if (eq <= 0) return null;
    pairs.set(part.slice(0, eq).trim(), part.slice(eq + 1));
  }
  return pairs;
}

export function parseSettingsDiff(
  previous?: string | null,
  next?: string | null,
): FieldChange[] | null {
  const before = parseSide(previous);
  const after = parseSide(next);
  if (!before || !after) return null;

  const fields = [...new Set([...before.keys(), ...after.keys()])];
  if (fields.length === 0) return null;

  return fields.map((field) => ({
    field,
    previous: before.get(field) ?? null,
    next: after.get(field) ?? null,
  }));
}
```

- [ ] **Step 4: Write the detail, columns and tab**

```tsx
// src/features/audit/components/settings-change-detail.tsx
import type { SettingsReportRowDTO } from "@igrp/platform-access-management-client-ts";
import { Fragment } from "react";

import { parseSettingsDiff } from "../lib/settings-diff";

/* For ASSOCIATE / DISASSOCIATE of a Permission, the row's entity is the
   Permission and `relatedEntity` is the Role (guide §9.6). */
export function SettingsChangeDetail({ row }: { row: SettingsReportRowDTO }) {
  const changes = parseSettingsDiff(row.previousValue, row.newValue);
  const hasRaw = Boolean(row.previousValue || row.newValue);

  return (
    <div className="flex flex-col gap-3 px-4 py-3 text-sm">
      {row.relatedEntity && (
        <p>
          <span className="text-muted-foreground">Entidade relacionada: </span>
          {row.relatedEntity}
        </p>
      )}
      {changes ? (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          {changes.map((c) => (
            <Fragment key={c.field}>
              <dt className="font-medium">{c.field}</dt>
              <dd className="break-all">
                <span className="sr-only">Antes: </span>
                <span className="text-muted-foreground line-through">{c.previous ?? "—"}</span>
                <span aria-hidden="true"> → </span>
                <span className="sr-only">Depois: </span>
                <span>{c.next ?? "—"}</span>
              </dd>
            </Fragment>
          ))}
        </dl>
      ) : hasRaw ? (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt className="font-medium">Anterior</dt>
          <dd className="break-all">{row.previousValue ?? "—"}</dd>
          <dt className="font-medium">Novo</dt>
          <dd className="break-all">{row.newValue ?? "—"}</dd>
        </dl>
      ) : null}
    </div>
  );
}
```

```tsx
// src/features/audit/components/settings-report-columns.tsx
"use client";

import {
  Button,
  type ColumnDef,
  IGRPDataTableHeaderDefault,
  IGRPIcon,
  type Row,
} from "@igrp/igrp-framework-react-design-system";
import type { SettingsReportRowDTO } from "@igrp/platform-access-management-client-ts";

import {
  labelFor,
  SETTINGS_AREA_LABELS,
  SETTINGS_ENTITY_TYPE_LABELS,
  SETTINGS_OPERATION_LABELS,
} from "../lib/audit-labels";
import { formatAuditDateTime } from "../lib/platform-time";
import { AuditStatusBadge } from "./audit-status-badge";
import { SettingsChangeDetail } from "./settings-change-detail";

const text = (value?: string | null) => value || "—";

export const settingsRowCanExpand = (row: Row<SettingsReportRowDTO>) =>
  Boolean(row.original.previousValue || row.original.newValue || row.original.relatedEntity);

export const renderSettingsDetail = (row: Row<SettingsReportRowDTO>) => (
  <SettingsChangeDetail row={row.original} />
);

export const SETTINGS_COLUMNS: ColumnDef<SettingsReportRowDTO>[] = [
  {
    id: "expand",
    header: () => <span className="sr-only">Detalhes</span>,
    cell: ({ row }) =>
      row.getCanExpand() ? (
        <Button
          variant="ghost"
          size="icon"
          aria-expanded={row.getIsExpanded()}
          aria-label={row.getIsExpanded() ? "Ocultar detalhes" : "Ver detalhes"}
          onClick={row.getToggleExpandedHandler()}
        >
          <IGRPIcon iconName={row.getIsExpanded() ? "ChevronDown" : "ChevronRight"} aria-hidden="true" />
        </Button>
      ) : null,
  },
  {
    accessorKey: "timestamp",
    header: () => <IGRPDataTableHeaderDefault title="Data e hora" />,
    cell: ({ row }) => (
      <span className="whitespace-nowrap tabular-nums">{formatAuditDateTime(row.original.timestamp)}</span>
    ),
  },
  {
    accessorKey: "performedBy",
    header: () => <IGRPDataTableHeaderDefault title="Realizado por" />,
    cell: ({ row }) => text(row.original.performedBy),
  },
  {
    accessorKey: "area",
    header: () => <IGRPDataTableHeaderDefault title="Área" />,
    cell: ({ row }) => labelFor(SETTINGS_AREA_LABELS, row.original.area),
  },
  {
    accessorKey: "operation",
    header: () => <IGRPDataTableHeaderDefault title="Operação" />,
    cell: ({ row }) => labelFor(SETTINGS_OPERATION_LABELS, row.original.operation),
  },
  {
    accessorKey: "entityType",
    header: () => <IGRPDataTableHeaderDefault title="Tipo" />,
    cell: ({ row }) => labelFor(SETTINGS_ENTITY_TYPE_LABELS, row.original.entityType),
  },
  {
    accessorKey: "entityName",
    header: () => <IGRPDataTableHeaderDefault title="Entidade" />,
    cell: ({ row }) => text(row.original.entityName),
  },
  {
    accessorKey: "ipAddress",
    header: () => <IGRPDataTableHeaderDefault title="IP" />,
    cell: ({ row }) => <span className="tabular-nums">{text(row.original.ipAddress)}</span>,
  },
  {
    accessorKey: "status",
    header: () => <IGRPDataTableHeaderDefault title="Estado" />,
    cell: ({ row }) => <AuditStatusBadge status={row.original.status} />,
  },
];
```

```tsx
// src/features/audit/components/settings-report-tab.tsx
"use client";

import { useEffect, useMemo } from "react";

import { IGRPDataTable } from "@igrp/igrp-framework-react-design-system";

import { InlineError } from "@/components/inline-error";
import { useUsers } from "@/features/users/use-users";

import {
  SETTINGS_AREA_OPTIONS,
  SETTINGS_ENTITY_TYPE_OPTIONS,
  SETTINGS_OPERATION_OPTIONS,
} from "../lib/audit-labels";
import {
  clearFilters,
  hasFilters,
  type ReportFilterKey,
  type ReportQuery,
  withFilter,
  withPage,
  withSize,
} from "../lib/report-query";
import { useRedirectOnUnauthorized, useSettingsReport } from "../use-audit";
import { ExactMatchInput, FilterCombobox, FilterSelect } from "./filter-controls";
import { ReportEmptyState } from "./report-empty-state";
import { ReportPager } from "./report-pager";
import { ReportTableSkeleton } from "./report-table-skeleton";
import {
  renderSettingsDetail,
  SETTINGS_COLUMNS,
  settingsRowCanExpand,
} from "./settings-report-columns";

interface ReportTabProps {
  query: ReportQuery;
  onQueryChange: (next: ReportQuery) => void;
}

function SettingsReportFilterBar({ query, onQueryChange }: ReportTabProps) {
  const { data: users } = useUsers();
  const userOptions = useMemo(
    () =>
      (users ?? []).map((u) => ({
        label: u.name ? `${u.name} (${u.email})` : u.email,
        value: u.username ?? u.email,
      })),
    [users],
  );

  const set = (key: ReportFilterKey) => (value: string | undefined) =>
    onQueryChange(withFilter(query, key, value));

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <FilterCombobox
        id="settings-performed-by"
        label="Realizado por"
        options={userOptions}
        value={query.filters.performedBy}
        onChange={set("performedBy")}
      />
      <FilterSelect
        id="settings-area"
        label="Área"
        options={SETTINGS_AREA_OPTIONS}
        value={query.filters.area}
        onChange={set("area")}
      />
      <FilterSelect
        id="settings-entity-type"
        label="Tipo"
        options={SETTINGS_ENTITY_TYPE_OPTIONS}
        value={query.filters.entityType}
        onChange={set("entityType")}
      />
      <FilterSelect
        id="settings-operation"
        label="Operação"
        options={SETTINGS_OPERATION_OPTIONS}
        value={query.filters.operation}
        onChange={set("operation")}
      />
      <ExactMatchInput
        id="settings-entity-name"
        label="Entidade"
        placeholder="Nome exato"
        value={query.filters.entityName}
        onCommit={set("entityName")}
      />
    </div>
  );
}

export function SettingsReportTab({ query, onQueryChange }: ReportTabProps) {
  const { data, error, isPending, isError, isFetching, refetch } = useSettingsReport(query);
  const rows = useMemo(() => data?.content ?? [], [data]);
  useRedirectOnUnauthorized(error);

  useEffect(() => {
    if (data && data.content.length === 0 && data.totalElements > 0 && query.page > 0) {
      onQueryChange(withPage(query, 0));
    }
  }, [data, query, onQueryChange]);

  return (
    <div className="flex flex-col gap-4">
      <SettingsReportFilterBar query={query} onQueryChange={onQueryChange} />
      {isError ? (
        <InlineError
          title="Não foi possível carregar o relatório de configurações."
          message="Tente novamente. Se o problema persistir, contacte o suporte."
          onRetry={() => refetch()}
        />
      ) : isPending ? (
        <ReportTableSkeleton />
      ) : rows.length === 0 ? (
        <ReportEmptyState
          filtered={hasFilters(query)}
          onClearFilters={() => onQueryChange(clearFilters(query))}
        />
      ) : (
        <>
          <IGRPDataTable
            columns={SETTINGS_COLUMNS}
            data={rows}
            showPagination={false}
            getRowCanExpand={settingsRowCanExpand}
            renderSubComponent={renderSettingsDetail}
          />
          <ReportPager
            page={query.page}
            size={query.size}
            totalPages={data?.totalPages ?? 0}
            totalElements={data?.totalElements ?? 0}
            disabled={isFetching}
            onPageChange={(page) => onQueryChange(withPage(query, page))}
            onSizeChange={(size) => onQueryChange(withSize(query, size))}
          />
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/audit/settings-diff.test.ts src/__tests__/audit/components/settings-change-detail.test.tsx`
Expected: PASS.

- [ ] **Step 6: Typecheck and UI rules**

Run: `pnpm typecheck && pnpm check:ui`
Expected: 0 errors / 0 violations. If `Row` isn't exported by the DS, import `type Row` from `@tanstack/react-table`.

- [ ] **Step 7: Commit**

```bash
git add src/features/audit/lib/settings-diff.ts src/features/audit/components/settings-change-detail.tsx src/features/audit/components/settings-report-columns.tsx src/features/audit/components/settings-report-tab.tsx src/__tests__/audit/settings-diff.test.ts src/__tests__/audit/components/settings-change-detail.test.tsx
git commit -m "feat(audit): add Settings Report tab with parsed field-by-field changes"
```

---

### Task 10: Route, screen and settings card

**Files:**
- Create: `src/features/audit/components/audit-screen.tsx`, `src/app/(igrp)/(home)/settings/audit/page.tsx`, `loading.tsx`, `error.tsx`
- Modify: `src/app/(igrp)/(home)/settings/page.tsx`
- Test: `src/__tests__/audit/components/audit-screen.test.tsx`

**Interfaces:**
- Consumes: Task 3 (`isAuditTab`, `withRange`, `withTab`), Task 5 (`useReportQuery`), Tasks 7–9 components, Task 4 `AUDIT_VIEW_PERMISSION`; existing `PageHeader` (`@/components/page-header`), `StatusAwareError`, `InlineError`.
- Produces: the `/settings/audit` route.

- [ ] **Step 1: Write the failing test**

```tsx
// src/__tests__/audit/components/audit-screen.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ReportQuery } from "@/features/audit/lib/report-query";

const setQuery = vi.fn();
const QUERY: ReportQuery = {
  tab: "access",
  range: { preset: "30d" },
  page: 3,
  size: 20,
  filters: { status: "SUCCESS" },
};
const STATE = [QUERY, setQuery] as const;

vi.mock("@/features/audit/use-audit", () => ({ useReportQuery: () => STATE }));
vi.mock("@/features/audit/components/access-report-tab", () => ({
  AccessReportTab: () => <p>access tab</p>,
}));
vi.mock("@/features/audit/components/settings-report-tab", () => ({
  SettingsReportTab: () => <p>settings tab</p>,
}));
vi.mock("@/features/audit/components/report-date-range", () => ({
  ReportDateRange: () => null,
}));
vi.mock("@/components/page-header", () => ({
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));
vi.mock("@igrp/igrp-framework-react-design-system", () => {
  const Pass = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return {
    Tabs: ({
      children,
      onValueChange,
    }: {
      children?: React.ReactNode;
      onValueChange?: (v: string) => void;
    }) => (
      <div>
        <button type="button" onClick={() => onValueChange?.("settings")}>
          switch
        </button>
        {children}
      </div>
    ),
    TabsContent: Pass,
    TabsList: Pass,
    TabsTrigger: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  };
});

import { AuditScreen } from "@/features/audit/components/audit-screen";

beforeEach(() => vi.clearAllMocks());

describe("AuditScreen", () => {
  it("renders only the active tab", () => {
    render(<AuditScreen />);
    expect(screen.getByRole("heading", { name: "Auditoria e Relatórios" })).toBeInTheDocument();
    expect(screen.getByText("access tab")).toBeInTheDocument();
    expect(screen.queryByText("settings tab")).not.toBeInTheDocument();
  });

  it("switching tab keeps the range and clears filters and page", async () => {
    render(<AuditScreen />);
    await userEvent.click(screen.getByRole("button", { name: "switch" }));
    expect(setQuery).toHaveBeenCalledWith({
      ...QUERY,
      tab: "settings",
      page: 0,
      filters: {},
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/audit/components/audit-screen.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the screen**

```tsx
// src/features/audit/components/audit-screen.tsx
"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@igrp/igrp-framework-react-design-system";

import { PageHeader } from "@/components/page-header";

import { isAuditTab, withRange, withTab } from "../lib/report-query";
import { useReportQuery } from "../use-audit";
import { AccessReportTab } from "./access-report-tab";
import { ReportDateRange } from "./report-date-range";
import { SettingsReportTab } from "./settings-report-tab";

export function AuditScreen() {
  const [query, setQuery] = useReportQuery();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Auditoria e Relatórios"
        description="Consulte os acessos e as alterações de configuração registados na plataforma."
        showBackButton
        linkBackButton="/settings"
      />

      {/* One range for every tab: it survives tab switches; filters don't. */}
      <ReportDateRange range={query.range} onChange={(range) => setQuery(withRange(query, range))} />

      <Tabs
        value={query.tab}
        onValueChange={(tab) => {
          if (isAuditTab(tab)) setQuery(withTab(query, tab));
        }}
      >
        <TabsList>
          <TabsTrigger value="access">Acessos</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>
        <TabsContent value="access">
          {query.tab === "access" && <AccessReportTab query={query} onQueryChange={setQuery} />}
        </TabsContent>
        <TabsContent value="settings">
          {query.tab === "settings" && <SettingsReportTab query={query} onQueryChange={setQuery} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/audit/components/audit-screen.test.tsx`
Expected: PASS.

- [ ] **Step 5: Write the route files**

```tsx
// src/app/(igrp)/(home)/settings/audit/page.tsx
import { igrpAssertAuthorize } from "@igrp/framework-next";
import type { Metadata } from "next";
import { Suspense } from "react";

import { AuditScreen } from "@/features/audit/components/audit-screen";
import { AUDIT_VIEW_PERMISSION } from "@/lib/constants";

import Loading from "./loading";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Auditoria e Relatórios",
  description: "Consultar os relatórios de acessos e de configurações da plataforma.",
};

/* The first page in the app to use a server guard (docs/PERMISSIONS.md):
   a missing permission renders the in-chrome 403 before anything streams.
   The server actions check again; the AM API is the real enforcement. */
export default async function AuditPage() {
  await igrpAssertAuthorize(AUDIT_VIEW_PERMISSION);

  // useSearchParams() inside needs a Suspense boundary.
  return (
    <Suspense fallback={<Loading />}>
      <AuditScreen />
    </Suspense>
  );
}
```

```tsx
// src/app/(igrp)/(home)/settings/audit/loading.tsx
import { Skeleton } from "@igrp/igrp-framework-react-design-system";

/** Shaped like the loaded page: header, range control, two tabs, filters, rows. */
export default function Loading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Skeleton className="h-10 w-56" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton loader
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton loader
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
```

```tsx
// src/app/(igrp)/(home)/settings/audit/error.tsx
"use client";

import { useEffect } from "react";

import { StatusAwareError } from "@/components/errors/status-aware-error";
import { InlineError } from "@/components/inline-error";

export default function AuditError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[audit-segment] error:", error);
  }, [error]);

  return (
    <StatusAwareError
      error={error}
      fallback={
        <InlineError
          title="Não foi possível carregar a auditoria."
          message="Tente novamente. Se o problema persistir, contacte o suporte."
          onRetry={reset}
        />
      }
    />
  );
}
```

- [ ] **Step 6: Enable the settings card and hide it without the permission**

In `src/app/(igrp)/(home)/settings/page.tsx`:

1. Remove the `auditoria-relatorios` entry from its current position (after the "Em breve" comment) and insert it as the **last active item**, right after `gestao-de-departamentos` and before the `/* \`status: "inativo"\` renders these …` comment, **without** `status`:

```ts
    {
      id: "auditoria-relatorios",
      title: "Auditoria e Relatórios",
      description:
        "Consulte os acessos e as alterações de configuração registados na plataforma.",
      icon: "FileChartColumn",
      href: "/settings/audit",
      accent: "info",
    },
```

2. Add imports at the top, keeping the existing order style:

```ts
import { igrpAuthorize } from "@igrp/framework-next";
import type { Metadata } from "next";

import {
  SettingsCard,
  type SettingsItem,
} from "@/features/settings/components/settings-card";
import { AUDIT_VIEW_PERMISSION } from "@/lib/constants";
```

3. Make the page async and filter the card:

```tsx
export default async function SettingsPage() {
  /* Navigation only: the audit page asserts the same permission itself. */
  const canViewAudit = await igrpAuthorize(AUDIT_VIEW_PERMISSION);
  const items = settingsConfig.general.filter(
    (item) => item.id !== "auditoria-relatorios" || canViewAudit,
  );

  return (
```

and render `items.map(...)` instead of `settingsConfig.general.map(...)`.

- [ ] **Step 7: Run the full gates**

Run: `pnpm typecheck && pnpm test && pnpm check:ui && npx biome check`
Expected: 0 type errors; all tests pass (the previous baseline plus the new audit files); 0 UI violations; biome clean. `typedRoutes` now accepts `"/settings/audit"` because the route exists. If `settings-card.test.tsx` breaks, it tests the card component rather than the page, so the cause will be something else; read the failure before changing the test.

- [ ] **Step 8: Commit**

```bash
git add src/features/audit/components/audit-screen.tsx "src/app/(igrp)/(home)/settings/audit" "src/app/(igrp)/(home)/settings/page.tsx" src/__tests__/audit/components/audit-screen.test.tsx
git commit -m "feat(audit): add /settings/audit with Access and Settings tabs behind igrp.audit.view"
```

---

### Task 11: Verify in the browser and against the real API

No new code unless a check fails. If one fails, fix it in the owning task's files, re-run that task's tests, and commit as `fix(audit): …`.

- [ ] **Step 1: Preview mode (UI shape, super-admin claims)**

Start the dev server with `preview_start` (create `.claude/launch.json` with `pnpm dev` on port 3000 if it's missing). With `IGRP_PREVIEW_MODE=true`:
- `/settings` shows the "Auditoria e Relatórios" card as clickable.
- `/settings/audit` renders the header, the range control ("Últimos 7 dias", "Hora de Cabo Verde") and the two tabs. With no backend the table shows the inline error, which is expected.
- Switching tabs updates `?tab=`, and the range stays as it was.
- At 375px width: no horizontal page scroll; the filter grid stacks.
- `read_console_messages`: no React key or hydration warnings.

- [ ] **Step 2: Real backend with a superadmin**

With preview off against a deployment:
- The Access tab loads rows. Pick one row and check that filtering by its **username** (via the combobox) and **module** returns it. This confirms planning decision 2. If it doesn't match, change the option `value` mapping in `access-report-tab.tsx`, and `settings-report-tab.tsx` for users.
- Status filter "Acesso negado" → only `ACCESS_DENIED` rows, and the URL gains `status=ACCESS_DENIED`.
- Custom range covering today → rows from today appear; times are shown in Cabo Verde time.
- The Settings tab: edit an application's description in another tab, then reload. A row with operation "Edição" appears (use the 24h preset), and expanding it shows `description: old → new`.
- Paging: with more than 20 rows, "Página seguinte" advances, `page=1` appears in the URL, and reloading keeps page 2.

- [ ] **Step 3: Real backend with a non-superadmin holding `igrp.audit.view`**

The page must load, not 403. If it 403s, the token carries the permission under another name (backend request #6). **Stop and report it** rather than changing the constant by guesswork.

- [ ] **Step 4: Real backend with a user lacking the permission**

- `/settings` shows no audit card.
- Deep-linking to `/settings/audit` renders the 403 page.

- [ ] **Step 5: Final gates and report**

Run: `pnpm typecheck && pnpm test && pnpm check:ui && npx biome check`
Expected: all green. Report the results of Steps 1–4, with a screenshot of the loaded Access tab. Name any step that couldn't be run (for example, no non-superadmin account) rather than implying it passed.
