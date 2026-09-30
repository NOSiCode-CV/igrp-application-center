import { describe, expect, it } from "vitest";

import {
  clearFilters,
  hasFilters,
  nextSort,
  parseReportQuery,
  type ReportQuery,
  serializeReportQuery,
  toAccessReportFilters,
  toSettingsReportFilters,
  withFilter,
  withPage,
  withRange,
  withSize,
  withSort,
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
    expect(parseReportQuery({ tab: ["settings"], range: "30d" })).toMatchObject(
      {
        tab: "settings",
        range: { preset: "30d" },
      },
    );
  });

  it("falls back to 7 days on an inverted or malformed custom range", () => {
    expect(
      parseReportQuery(
        new URLSearchParams("range=custom&from=2026-09-10&to=2026-09-01"),
      ).range,
    ).toEqual({ preset: "7d" });
    expect(
      parseReportQuery(new URLSearchParams("range=custom&from=2026-09-10"))
        .range,
    ).toEqual({ preset: "7d" });
  });

  it("ignores unknown tabs, negative pages and unsupported sizes", () => {
    const q = parseReportQuery(new URLSearchParams("tab=purge&page=-1&size=7"));
    expect(q.tab).toBe("access");
    expect(q.page).toBe(0);
    expect(q.size).toBe(20);
  });

  it("keeps only the active tab's filters", () => {
    const q = parseReportQuery(
      new URLSearchParams("tab=access&username=ana&area=USERS"),
    );
    expect(q.filters).toEqual({ username: "ana" });
  });

  it("drops enum filters with values the API does not know (typos look like 'no data')", () => {
    expect(
      parseReportQuery(new URLSearchParams("status=SUCESS")).filters,
    ).toEqual({});
    expect(
      parseReportQuery(new URLSearchParams("status=PENDING")).filters,
    ).toEqual({});
    expect(
      parseReportQuery(
        new URLSearchParams("tab=settings&operation=EDIT&entityType=role"),
      ).filters,
    ).toEqual({ operation: "EDIT" });
  });

  it("trims free-text filters and drops empty ones", () => {
    expect(
      parseReportQuery(new URLSearchParams("role=%20admin%20&username="))
        .filters,
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
  const filtered: ReportQuery = {
    ...base,
    page: 4,
    filters: { username: "ana" },
  };

  it("switching tab keeps the range, resets filters and page", () => {
    expect(
      withTab({ ...filtered, range: { preset: "30d" } }, "settings"),
    ).toEqual({
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

describe("column sort", () => {
  const base: ReportQuery = {
    tab: "access",
    range: { preset: "7d" },
    page: 3,
    size: 20,
    filters: {},
  };

  it("reads and writes `sort=field,direction` for a sortable column", () => {
    const q = parseReportQuery(new URLSearchParams("sort=ipAddress,desc"));
    expect(q.sort).toEqual({ field: "ipAddress", direction: "desc" });
    expect(serializeReportQuery(q).get("sort")).toBe("ipAddress,desc");
  });

  it("ignores unknown fields, bad directions and another tab's sort fields", () => {
    expect(
      parseReportQuery(new URLSearchParams("sort=module,asc")).sort,
    ).toBeUndefined();
    expect(
      parseReportQuery(new URLSearchParams("sort=username,up")).sort,
    ).toBeUndefined();
    expect(
      parseReportQuery(new URLSearchParams("tab=settings&sort=username,asc"))
        .sort,
    ).toBeUndefined();
  });

  it("sorts the settings report by its own columns, but not by IP", () => {
    for (const field of [
      "timestamp",
      "performedBy",
      "area",
      "operation",
      "entityType",
      "entityName",
      "status",
    ]) {
      expect(
        parseReportQuery(new URLSearchParams(`tab=settings&sort=${field},asc`))
          .sort,
      ).toEqual({ field, direction: "asc" });
    }
    expect(
      parseReportQuery(new URLSearchParams("tab=settings&sort=ipAddress,asc"))
        .sort,
    ).toBeUndefined();
  });

  it("cycles ascending → descending → default order", () => {
    const asc = withSort(base, nextSort(base, "username"));
    expect(asc.sort).toEqual({ field: "username", direction: "asc" });
    const desc = withSort(asc, nextSort(asc, "username"));
    expect(desc.sort).toEqual({ field: "username", direction: "desc" });
    expect(withSort(desc, nextSort(desc, "username")).sort).toBeUndefined();
    expect(nextSort(desc, "status")).toEqual({
      field: "status",
      direction: "asc",
    });
  });

  it("flips Data e hora between oldest first and the newest-first default", () => {
    const asc = withSort(base, nextSort(base, "timestamp"));
    expect(asc.sort).toEqual({ field: "timestamp", direction: "asc" });
    expect(withSort(asc, nextSort(asc, "timestamp")).sort).toBeUndefined();
  });

  it("returns to the first page on a new order and resets on tab switch", () => {
    const sorted = withSort(base, { field: "role", direction: "asc" });
    expect(sorted.page).toBe(0);
    expect(withTab(sorted, "settings").sort).toBeUndefined();
  });

  it("sends the chosen order to the API, newest first otherwise", () => {
    const now = new Date("2026-09-23T10:00:00.000Z");
    expect(toAccessReportFilters(base, now).sort).toBe("timestamp,desc");
    expect(
      toAccessReportFilters(
        { ...base, sort: { field: "status", direction: "asc" } },
        now,
      ).sort,
    ).toBe("status,asc");
  });
});
