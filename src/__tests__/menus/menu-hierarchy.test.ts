// Menu tree rules for /settings/applications/[code]: which type may live under
// which parent, and how a drag-and-drop drop translates into position /
// parent changes.

import { describe, expect, it } from "vitest";

import {
  canBeChildOf,
  type MenuNode,
  resolveMenuDrop,
} from "@/features/menus/menu-hierarchy";
import { makeMenuSchemas } from "@/features/menus/menu-schemas";

// - GROUP_A
//   - FOLDER_A
//     - PAGE_1
//     - PAGE_2
//   - PAGE_G
// - FOLDER_B
//   - PAGE_3
//   - PAGE_4
// - PAGE_5
// - PAGE_6
// - GROUP_B
const TREE: MenuNode[] = [
  { code: "GROUP_A", type: "GROUP", parentCode: null, position: 0 },
  { code: "FOLDER_A", type: "FOLDER", parentCode: "GROUP_A", position: 0 },
  { code: "PAGE_1", type: "MENU_PAGE", parentCode: "FOLDER_A", position: 0 },
  { code: "PAGE_2", type: "MENU_PAGE", parentCode: "FOLDER_A", position: 1 },
  { code: "PAGE_G", type: "MENU_PAGE", parentCode: "GROUP_A", position: 1 },
  { code: "FOLDER_B", type: "FOLDER", parentCode: null, position: 1 },
  { code: "PAGE_3", type: "MENU_PAGE", parentCode: "FOLDER_B", position: 0 },
  {
    code: "PAGE_4",
    type: "EXTERNAL_PAGE",
    parentCode: "FOLDER_B",
    position: 1,
  },
  { code: "PAGE_5", type: "MENU_PAGE", parentCode: null, position: 2 },
  { code: "PAGE_6", type: "MENU_PAGE", parentCode: null, position: 3 },
  { code: "GROUP_B", type: "GROUP", parentCode: null, position: 4 },
];

describe("canBeChildOf", () => {
  it("keeps groups at the top level", () => {
    expect(canBeChildOf("GROUP", null)).toBe(true);
    expect(canBeChildOf("GROUP", "GROUP")).toBe(false);
    expect(canBeChildOf("GROUP", "FOLDER")).toBe(false);
  });

  it("places folders at the top level or inside a group", () => {
    expect(canBeChildOf("FOLDER", null)).toBe(true);
    expect(canBeChildOf("FOLDER", "GROUP")).toBe(true);
    expect(canBeChildOf("FOLDER", "FOLDER")).toBe(false);
  });

  it("places pages at the top level, in a group or in a folder", () => {
    for (const page of ["MENU_PAGE", "EXTERNAL_PAGE"]) {
      expect(canBeChildOf(page, null)).toBe(true);
      expect(canBeChildOf(page, "GROUP")).toBe(true);
      expect(canBeChildOf(page, "FOLDER")).toBe(true);
      expect(canBeChildOf(page, "MENU_PAGE")).toBe(false);
    }
  });
});

describe("resolveMenuDrop", () => {
  it("reorders siblings under the same parent", () => {
    expect(resolveMenuDrop(TREE, "PAGE_2", "PAGE_1")).toEqual({
      ok: true,
      changes: [
        { code: "PAGE_2", parentCode: "FOLDER_A", position: 0 },
        { code: "PAGE_1", parentCode: "FOLDER_A", position: 1 },
      ],
    });
  });

  it("moves a page into a folder when dropped on it", () => {
    expect(resolveMenuDrop(TREE, "PAGE_5", "FOLDER_B")).toEqual({
      ok: true,
      changes: [
        { code: "PAGE_6", parentCode: null, position: 2 },
        { code: "GROUP_B", parentCode: null, position: 3 },
        { code: "PAGE_5", parentCode: "FOLDER_B", position: 2 },
      ],
    });
  });

  it("moves a page into a group when dropped on it", () => {
    const result = resolveMenuDrop(TREE, "PAGE_3", "GROUP_A");
    expect(result).toMatchObject({ ok: true });
    expect(result.ok && result.changes).toContainEqual({
      code: "PAGE_3",
      parentCode: "GROUP_A",
      position: 2,
    });
  });

  it("moves a folder into a group when dropped on it", () => {
    const result = resolveMenuDrop(TREE, "FOLDER_B", "GROUP_B");
    expect(result.ok && result.changes).toContainEqual({
      code: "FOLDER_B",
      parentCode: "GROUP_B",
      position: 0,
    });
  });

  it("moves a page next to a page under another parent", () => {
    const result = resolveMenuDrop(TREE, "PAGE_1", "PAGE_3");
    expect(result.ok && result.changes).toEqual([
      { code: "PAGE_2", parentCode: "FOLDER_A", position: 0 },
      { code: "PAGE_1", parentCode: "FOLDER_B", position: 0 },
      { code: "PAGE_3", parentCode: "FOLDER_B", position: 1 },
      { code: "PAGE_4", parentCode: "FOLDER_B", position: 2 },
    ]);
  });

  it("moves a nested page back to the top level", () => {
    const result = resolveMenuDrop(TREE, "PAGE_G", "PAGE_6");
    expect(result.ok && result.changes).toContainEqual({
      code: "PAGE_G",
      parentCode: null,
      position: 3,
    });
  });

  it("reorders folders inside a group instead of nesting them", () => {
    const tree: MenuNode[] = [
      ...TREE,
      { code: "FOLDER_C", type: "FOLDER", parentCode: "GROUP_A", position: 2 },
    ];
    const result = resolveMenuDrop(tree, "FOLDER_C", "FOLDER_A");
    expect(result.ok && result.changes).toContainEqual({
      code: "FOLDER_C",
      parentCode: "GROUP_A",
      position: 0,
    });
  });

  it("refuses a group anywhere but the top level", () => {
    expect(resolveMenuDrop(TREE, "GROUP_B", "FOLDER_A")).toEqual({
      ok: false,
      reason: "invalidParent",
    });
    expect(resolveMenuDrop(TREE, "GROUP_B", "PAGE_1")).toEqual({
      ok: false,
      reason: "invalidParent",
    });
  });

  it("refuses a folder inside a folder", () => {
    expect(resolveMenuDrop(TREE, "FOLDER_B", "PAGE_1")).toEqual({
      ok: false,
      reason: "invalidParent",
    });
  });

  it("reorders top-level groups", () => {
    const result = resolveMenuDrop(TREE, "GROUP_B", "GROUP_A");
    expect(result.ok && result.changes).toContainEqual({
      code: "GROUP_B",
      parentCode: null,
      position: 0,
    });
  });

  it("is a no-op when dropped on itself or an unknown menu", () => {
    expect(resolveMenuDrop(TREE, "PAGE_1", "PAGE_1")).toEqual({
      ok: false,
      reason: "noop",
    });
    expect(resolveMenuDrop(TREE, "PAGE_1", "MISSING")).toEqual({
      ok: false,
      reason: "noop",
    });
  });
});

describe("createMenuSchema", () => {
  const { createMenuSchema } = makeMenuSchemas((key) => key);
  const group = {
    name: "Group",
    code: "GROUP",
    type: "GROUP",
    position: 0,
    icon: "AppWindow",
    status: "ACTIVE",
    applicationCode: "APP",
  };

  it("accepts a top-level group without a parentCode key", () => {
    expect(createMenuSchema.safeParse(group).success).toBe(true);
  });

  it("rejects a group with a parent", () => {
    expect(
      createMenuSchema.safeParse({ ...group, parentCode: "OTHER" }).success,
    ).toBe(false);
  });
});
