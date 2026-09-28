import type { SettingsReportRowDTO } from "@igrp/platform-access-management-client-ts";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SettingsChangeDetail } from "@/features/audit/components/settings-change-detail";
import { settingsRowCanExpand } from "@/features/audit/components/settings-report-columns";

const row = (over: Partial<SettingsReportRowDTO>) =>
  ({
    relatedEntity: null,
    previousValue: null,
    newValue: null,
    ...over,
  }) as SettingsReportRowDTO;

describe("SettingsChangeDetail", () => {
  it("lists each changed field from old to new", () => {
    render(
      <SettingsChangeDetail
        row={row({ previousValue: "name=A", newValue: "name=B" })}
      />,
    );
    expect(screen.getByText("name")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("falls back to the raw values when they can't be parsed", () => {
    render(
      <SettingsChangeDetail
        row={row({ previousValue: "free text", newValue: "other" })}
      />,
    );
    expect(screen.getByText("free text")).toBeInTheDocument();
    expect(screen.getByText("Anterior")).toBeInTheDocument();
  });

  it("shows the IP address, and a row with only an IP can expand", () => {
    render(<SettingsChangeDetail row={row({ ipAddress: "10.0.0.7" })} />);
    expect(screen.getByText("Endereço IP:")).toBeInTheDocument();
    expect(screen.getByText("10.0.0.7")).toBeInTheDocument();
    expect(
      settingsRowCanExpand({
        original: row({ ipAddress: "10.0.0.7" }),
      } as Parameters<typeof settingsRowCanExpand>[0]),
    ).toBe(true);
  });

  it("shows the related entity", () => {
    render(<SettingsChangeDetail row={row({ relatedEntity: "MyRole" })} />);
    expect(screen.getByText("MyRole")).toBeInTheDocument();
  });
});
