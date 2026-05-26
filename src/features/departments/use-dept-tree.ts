import type { DepartmentDTO } from "@igrp/platform-access-management-client-ts";
import { useMemo } from "react";
import {
  buildTree,
  type DepartmentWithChildren,
  filterTree,
} from "./dept-tree-utils";

export interface DepartmentTreeResult {
  tree: DepartmentWithChildren[];
  filtered: DepartmentWithChildren[];
}

export function useDepartmentTree(
  departments: DepartmentDTO[] | undefined,
  searchTerm: string,
): DepartmentTreeResult {
  const tree = useMemo(() => buildTree(departments), [departments]);
  const filtered = useMemo(
    () => filterTree(tree, searchTerm),
    [tree, searchTerm],
  );
  return { tree, filtered };
}
