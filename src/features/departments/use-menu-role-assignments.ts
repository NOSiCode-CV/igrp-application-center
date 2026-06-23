import { useCallback, useEffect, useMemo, useState } from "react";

import type { MenuEntryDTO } from "@igrp/platform-access-management-client-ts";

export function useMenuRoleAssignments(args: {
  menus: MenuEntryDTO[] | undefined;
  roles: { code: string }[] | undefined;
  filteredMenus: { code: string }[];
  selectedApp: string;
}): {
  assignments: Map<string, Set<string>>;
  hasChanges: boolean;
  columnCheckState: Map<string, boolean | "indeterminate">;
  toggleMenuRole: (menuCode: string, roleCode: string) => void;
  toggleAllMenusForRole: (roleCode: string) => void;
  reset: () => void;
  diffForSave: () => {
    menuCode: string;
    toAdd: string[];
    toRemove: string[];
  }[];
} {
  const { menus, roles, filteredMenus, selectedApp } = args;

  const [assignments, setAssignments] = useState<Map<string, Set<string>>>(
    new Map(),
  );

  // Re-seed whenever the selected app or the menus data changes.
  // This replaces the fragile `size === 0` guard: switching apps clears
  // stale assignments and re-seeds from the newly loaded menus.
  useEffect(() => {
    if (!menus || menus.length === 0) return;
    const initialAssignments = new Map<string, Set<string>>();
    menus.forEach((menu) => {
      initialAssignments.set(
        menu.code,
        new Set(menu.roles.map((r) => r?.roleCode) || []),
      );
    });
    setAssignments(initialAssignments);
  }, [selectedApp, menus]);

  const columnCheckState = useMemo(() => {
    const visibleMenuCodes = filteredMenus.map((m) => m.code);
    const map = new Map<string, boolean | "indeterminate">();
    for (const role of roles ?? []) {
      const menusWithRole = visibleMenuCodes.filter((code) =>
        assignments.get(code)?.has(role.code),
      );
      map.set(
        role.code,
        menusWithRole.length === 0
          ? false
          : menusWithRole.length === visibleMenuCodes.length
            ? true
            : "indeterminate",
      );
    }
    return map;
  }, [roles, filteredMenus, assignments]);

  const hasChanges = useMemo(
    () =>
      Array.from(assignments.entries()).some(([menuCode, currentRoles]) => {
        const originalMenu = menus?.find((m) => m.code === menuCode);
        const originalRoles = new Set(
          originalMenu?.roles.map((r) => r?.roleCode) || [],
        );

        if (currentRoles.size !== originalRoles.size) return true;

        for (const role of currentRoles) {
          if (!originalRoles.has(role)) return true;
        }

        return false;
      }),
    [assignments, menus],
  );

  const toggleMenuRole = useCallback((menuCode: string, roleCode: string) => {
    setAssignments((prev) => {
      const newMap = new Map(prev);
      const currentRoles = new Set(newMap.get(menuCode) || []);

      if (currentRoles.has(roleCode)) {
        currentRoles.delete(roleCode);
      } else {
        currentRoles.add(roleCode);
      }

      newMap.set(menuCode, currentRoles);
      return newMap;
    });
  }, []);

  const toggleAllMenusForRole = useCallback(
    (roleCode: string) => {
      const visibleMenuCodes = filteredMenus.map((m) => m.code);
      const currentState = columnCheckState.get(roleCode) ?? false;

      setAssignments((prev) => {
        const newMap = new Map(prev);

        visibleMenuCodes.forEach((menuCode) => {
          const currentRoles = new Set(newMap.get(menuCode) || []);

          if (currentState === true) {
            currentRoles.delete(roleCode);
          } else {
            currentRoles.add(roleCode);
          }

          newMap.set(menuCode, currentRoles);
        });

        return newMap;
      });
    },
    [filteredMenus, columnCheckState],
  );

  const reset = useCallback(() => {
    setAssignments(new Map());
  }, []);

  const diffForSave = useCallback((): {
    menuCode: string;
    toAdd: string[];
    toRemove: string[];
  }[] => {
    const result: { menuCode: string; toAdd: string[]; toRemove: string[] }[] =
      [];

    for (const [menuCode, currentRoles] of assignments.entries()) {
      const originalMenu = menus?.find((m) => m.code === menuCode);
      const originalRoles = new Set(
        originalMenu?.roles.map((r) => r?.roleCode) || [],
      );

      const toAdd = Array.from(currentRoles).filter(
        (role) => !originalRoles.has(role),
      );
      const toRemove = Array.from(originalRoles).filter(
        (role) => !currentRoles.has(role),
      );

      if (toAdd.length > 0 || toRemove.length > 0) {
        result.push({ menuCode, toAdd, toRemove });
      }
    }

    return result;
  }, [assignments, menus]);

  return {
    assignments,
    hasChanges,
    columnCheckState,
    toggleMenuRole,
    toggleAllMenusForRole,
    reset,
    diffForSave,
  };
}
