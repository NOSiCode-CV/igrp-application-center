import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetAccessReport = vi.fn();
const mockGetSettingsReport = vi.fn();

vi.mock("@/actions/audit-reports", () => ({
  getAccessReport: (f: unknown) => mockGetAccessReport(f),
  getSettingsReport: (f: unknown) => mockGetSettingsReport(f),
}));

import type { ReportQuery } from "@/features/audit/lib/report-query";
import {
  accessReportOptions,
  settingsReportOptions,
} from "@/features/audit/query-options";

const q: ReportQuery = {
  tab: "access",
  range: { preset: "24h" },
  page: 0,
  size: 20,
  filters: { status: "SUCCESS" },
};
const page = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  size: 20,
  number: 0,
};

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
    mockGetSettingsReport.mockResolvedValue({
      success: false,
      error: "x",
      status: 403,
    });
    await expect(
      // biome-ignore lint/style/noNonNullAssertion: queryOptions always sets queryFn here
      settingsReportOptions({ ...q, tab: "settings", filters: {} }).queryFn!(
        {} as never,
      ),
    ).rejects.toThrow();
  });
});
