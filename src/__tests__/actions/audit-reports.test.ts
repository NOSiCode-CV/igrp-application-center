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
const page = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  size: 20,
  number: 0,
};

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
    expect(await getSettingsReport(filters)).toMatchObject({
      success: false,
      status: 403,
    });
    expect(mockGetSettingsReport).not.toHaveBeenCalled();
  });
});
