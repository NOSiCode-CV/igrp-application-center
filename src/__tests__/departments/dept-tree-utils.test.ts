import type { DepartmentDTO } from "@igrp/platform-access-management-client-ts";
import { describe, expect, it } from "vitest";
import { buildTree, filterTree } from "@/features/departments/dept-tree-utils";

const dept = (code: string, parentCode?: string, name = code): DepartmentDTO =>
  ({ code, parentCode, name, status: "ACTIVE" }) as DepartmentDTO;

describe("buildTree", () => {
  it("returns empty array for empty input", () => {
    expect(buildTree([])).toEqual([]);
  });

  it("returns empty array when given undefined", () => {
    expect(buildTree(undefined as unknown as DepartmentDTO[])).toEqual([]);
  });

  it("nests children under their parent by code", () => {
    const tree = buildTree([dept("A"), dept("A.1", "A"), dept("A.1.1", "A.1")]);
    expect(tree).toHaveLength(1);
    expect(tree[0].code).toBe("A");
    expect(tree[0].children?.[0].code).toBe("A.1");
    expect(tree[0].children?.[0].children?.[0].code).toBe("A.1.1");
  });

  it("treats nodes with missing parents as roots", () => {
    const tree = buildTree([dept("orphan", "ghost"), dept("root")]);
    expect(tree.map((n) => n.code).sort()).toEqual(["orphan", "root"]);
  });
});

describe("filterTree", () => {
  const tree = buildTree([
    dept("HR", undefined, "Human Resources"),
    dept("HR.PAY", "HR", "Payroll"),
    dept("IT", undefined, "Information Tech"),
  ]);

  it("returns input when term is empty", () => {
    expect(filterTree(tree, "")).toBe(tree);
  });

  it("matches by name case-insensitively", () => {
    const out = filterTree(tree, "payroll");
    expect(out).toHaveLength(1);
    expect(out[0].code).toBe("HR");
    expect(out[0].children?.[0].code).toBe("HR.PAY");
  });

  it("matches by code", () => {
    const out = filterTree(tree, "it");
    expect(out.map((n) => n.code)).toContain("IT");
  });

  it("keeps a parent when only a descendant matches", () => {
    const out = filterTree(tree, "payroll");
    expect(out[0].code).toBe("HR");
  });

  it("drops branches with no matches", () => {
    const out = filterTree(tree, "zzz");
    expect(out).toEqual([]);
  });
});
