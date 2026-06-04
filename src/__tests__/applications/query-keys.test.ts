import { describe, expect, it } from "vitest";

import {
  applicationsKeys,
  menusKeys,
} from "@/features/applications/query-keys";

describe("applicationsKeys", () => {
  it("returns a stable list key", () => {
    expect(applicationsKeys.list()).toEqual(["applications", "list"]);
  });

  it("returns a list key scoped by filters", () => {
    expect(applicationsKeys.list({ type: "WEB" })).toEqual([
      "applications",
      "list",
      { type: "WEB" },
    ]);
  });

  it("collapses an empty filter object to the bare list key", () => {
    expect(applicationsKeys.list({})).toEqual(["applications", "list"]);
  });

  it("returns a detail key per app code", () => {
    expect(applicationsKeys.detail("MY_APP")).toEqual([
      "applications",
      "detail",
      "MY_APP",
    ]);
  });
});

describe("menusKeys", () => {
  it("returns a list key per application", () => {
    expect(menusKeys.byApplication("MY_APP")).toEqual([
      "menus",
      "application",
      "MY_APP",
    ]);
  });

  it("returns a roles key per menu", () => {
    expect(menusKeys.roles("MY_APP", "MENU_X")).toEqual([
      "menu-roles",
      "MY_APP",
      "MENU_X",
    ]);
  });
});
