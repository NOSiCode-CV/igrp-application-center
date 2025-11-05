import { MenuEntryDTO } from "@igrp/platform-access-management-client-ts";
import type { DepartmentArgs } from "./dept-schemas";
import { MenuWithChildren } from "./components/dept-menu";

export type DepartmentOption = { value: string; label: string };

export const DEPT_OPTIONS = (
  departments: DepartmentArgs[],
): DepartmentOption[] =>
  departments.map((d) => ({
    value: String(d.code),
    label: String(d.name),
  }));


export const buildMenuTree = (menus: MenuEntryDTO[]): MenuWithChildren[] => {
  const map = new Map<string, MenuWithChildren>();
  const roots: MenuWithChildren[] = [];

  menus.forEach((menu) => {
    map.set(menu.code, { ...menu, children: [] });
  });

  menus.forEach((menu) => {
    const node = map.get(menu.code)!;
    if (menu.parentCode) {
      const parent = map.get(menu.parentCode);
      if (parent) {
        parent.children!.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
};