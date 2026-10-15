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
const ENUM_FILTER_VALUES: Partial<Record<ReportFilterKey, readonly string[]>> =
  {
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
/** Newest first, when no column sort is chosen. */
export const REPORT_SORT = "timestamp,desc";
export const DEFAULT_SORT: ReportSort = {
  field: "timestamp",
  direction: "desc",
};

/* Columns the user can sort by, per tab, named as the API's `sort` expects
   (the row DTO field names). The server sorts the whole report, so a sort
   is never applied to just the visible page. */
export const SORTABLE_FIELDS = {
  access: ["timestamp", "username", "role", "action", "ipAddress", "status"],
  settings: [
    "timestamp",
    "performedBy",
    "area",
    "operation",
    "entityType",
    "entityName",
    "status",
  ],
} as const satisfies Record<AuditTab, readonly string[]>;

export type SortDirection = "asc" | "desc";
export interface ReportSort {
  field: string;
  direction: SortDirection;
}

export interface ReportQuery {
  tab: AuditTab;
  range: DateRangeSelection;
  page: number;
  size: number;
  filters: ReportFilters;
  /** A column sort; absent means `REPORT_SORT`. */
  sort?: ReportSort;
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

/* `sort=field,asc|desc`, kept only for a field the tab can sort by: an
   unknown field would be a 400 (or a silently ignored sort) server-side. */
function parseSort(
  tab: AuditTab,
  raw: string | undefined,
): ReportSort | undefined {
  const [field, direction] = raw?.split(",") ?? [];
  const fields: readonly string[] = SORTABLE_FIELDS[tab];
  if (!field || !fields.includes(field)) return undefined;
  if (direction !== "asc" && direction !== "desc") return undefined;
  return { field, direction };
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

  const sort = parseSort(tab, read(params, "sort"));

  return {
    tab,
    range: parseRange(
      read(params, "range"),
      read(params, "from"),
      read(params, "to"),
    ),
    page: toInt(read(params, "page"), 0, 0),
    size: (PAGE_SIZES as readonly number[]).includes(size)
      ? size
      : DEFAULT_PAGE_SIZE,
    filters,
    ...(sort ? { sort } : {}),
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
  if (q.sort) params.set("sort", `${q.sort.field},${q.sort.direction}`);
  return params;
}

/* Sort columns differ per tab, so the sort resets with the filters. */
export const withTab = (q: ReportQuery, tab: AuditTab): ReportQuery => {
  const { sort: _sort, ...rest } = q;
  return { ...rest, tab, page: 0, filters: {} };
};

/** A new order starts again from the first page. `undefined` → newest first. */
export function withSort(
  q: ReportQuery,
  sort: ReportSort | undefined,
): ReportQuery {
  const { sort: _sort, ...rest } = q;
  return sort ? { ...rest, page: 0, sort } : { ...rest, page: 0 };
}

/** Header click cycle for a column: ascending → descending → default order.
    The default column (Data e hora, newest first) just flips: its descending
    step *is* the default. */
export function nextSort(
  q: ReportQuery,
  field: string,
): ReportSort | undefined {
  const current = q.sort ?? DEFAULT_SORT;
  const isDefaultField = field === DEFAULT_SORT.field;
  if (current.field !== field) return { field, direction: "asc" };
  if (current.direction === "asc")
    return isDefaultField ? undefined : { field, direction: "desc" };
  return isDefaultField ? { field, direction: "asc" } : undefined;
}

export const withRange = (
  q: ReportQuery,
  range: DateRangeSelection,
): ReportQuery => ({
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

export const withPage = (q: ReportQuery, page: number): ReportQuery => ({
  ...q,
  page,
});
export const withSize = (q: ReportQuery, size: number): ReportQuery => ({
  ...q,
  size,
  page: 0,
});
export const clearFilters = (q: ReportQuery): ReportQuery => ({
  ...q,
  page: 0,
  filters: {},
});
export const hasFilters = (q: ReportQuery): boolean =>
  Object.keys(q.filters).length > 0;

export function rangeToInstants(
  range: DateRangeSelection,
  now: Date,
): InstantRange {
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
  return {
    ...rangeToInstants(q.range, now),
    page: q.page,
    size: q.size,
    sort: q.sort ? `${q.sort.field},${q.sort.direction}` : REPORT_SORT,
  };
}

/* The enum casts are safe: `parseReportQuery` only keeps values from the SDK
   enums (see ENUM_FILTER_VALUES). */
export function toAccessReportFilters(
  q: ReportQuery,
  now: Date,
): AccessReportFilters {
  const f = q.filters;
  return withoutUndefined({
    ...basePage(q, now),
    username: f.username,
    module: f.module,
    role: f.role,
    status: f.status as AuditStatus | undefined,
  });
}

export function toSettingsReportFilters(
  q: ReportQuery,
  now: Date,
): SettingsReportFilters {
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
