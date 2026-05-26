import type { DepartmentDTO } from "@igrp/platform-access-management-client-ts";

export type DepartmentWithChildren = DepartmentDTO & {
  children?: DepartmentWithChildren[];
};

export function buildTree(
  depts: DepartmentDTO[] | undefined,
): DepartmentWithChildren[] {
  if (!depts?.length) return [];

  const map = new Map<string, DepartmentWithChildren>();
  for (const d of depts) map.set(d.code, { ...d, children: [] });

  const roots: DepartmentWithChildren[] = [];
  for (const d of depts) {
    const node = map.get(d.code);
    if (!node) continue;
    const parent = d.parentCode ? map.get(d.parentCode) : undefined;
    if (parent) parent.children!.push(node);
    else roots.push(node);
  }
  return roots;
}

export function filterTree(
  depts: DepartmentWithChildren[],
  term: string,
): DepartmentWithChildren[] {
  if (!term) return depts;
  const needle = term.toLowerCase();

  const walk = (nodes: DepartmentWithChildren[]): DepartmentWithChildren[] => {
    const out: DepartmentWithChildren[] = [];
    for (const node of nodes) {
      const self =
        node.name.toLowerCase().includes(needle) ||
        node.code.toLowerCase().includes(needle);
      const kids = node.children ? walk(node.children) : [];
      if (self || kids.length > 0) out.push({ ...node, children: kids });
    }
    return out;
  };

  return walk(depts);
}
