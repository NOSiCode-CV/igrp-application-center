/**
 * Menu tree rules: a GROUP lives only at the top level, a FOLDER at the top
 * level or inside a GROUP, and a page (internal or external) at the top
 * level, inside a GROUP or inside a FOLDER.
 */

export interface MenuNode {
  code: string;
  type: string;
  parentCode?: string | null;
  position?: number;
}

export interface MenuMove {
  code: string;
  parentCode: string | null;
  position: number;
}

export type MenuDropResult =
  | { ok: true; changes: MenuMove[] }
  | { ok: false; reason: "noop" | "invalidParent" };

const ALLOWED_PARENTS: Record<string, ReadonlyArray<string | null>> = {
  GROUP: [null],
  FOLDER: [null, "GROUP"],
  MENU_PAGE: [null, "GROUP", "FOLDER"],
  EXTERNAL_PAGE: [null, "GROUP", "FOLDER"],
};

/** Whether a menu of `childType` may sit under a parent of `parentType` (`null` = top level). */
export function canBeChildOf(
  childType: string,
  parentType: string | null,
): boolean {
  return ALLOWED_PARENTS[childType]?.includes(parentType) ?? false;
}

const parentOf = (menu: MenuNode) => menu.parentCode ?? null;

function siblingsOf(menus: MenuNode[], parentCode: string | null) {
  return menus
    .filter((m) => parentOf(m) === parentCode)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
}

function isDescendant(
  menus: MenuNode[],
  code: string | null,
  ancestorCode: string,
): boolean {
  let current = code;
  while (current) {
    if (current === ancestorCode) return true;
    current = parentOf(
      menus.find((m) => m.code === current) ?? { code: "", type: "" },
    );
  }
  return false;
}

/**
 * Turns dropping `activeCode` on `overCode` into the position / parent
 * updates to persist. Dropping on a GROUP or FOLDER that may hold the dragged
 * menu moves it inside (last); dropping on any other menu places it before
 * that menu, under that menu's parent. Only menus whose parent or position
 * changed are returned — previous siblings first, then the new ones.
 */
export function resolveMenuDrop(
  menus: MenuNode[],
  activeCode: string,
  overCode: string,
): MenuDropResult {
  const active = menus.find((m) => m.code === activeCode);
  const over = menus.find((m) => m.code === overCode);
  if (!active || !over || active.code === over.code) {
    return { ok: false, reason: "noop" };
  }

  const fromParent = parentOf(active);
  const dropsInside =
    canBeChildOf(active.type, over.type) && fromParent !== over.code;
  const toParent = dropsInside ? over.code : parentOf(over);
  const toParentType = toParent
    ? (menus.find((m) => m.code === toParent)?.type ?? null)
    : null;

  if (
    !canBeChildOf(active.type, toParentType) ||
    isDescendant(menus, toParent, active.code)
  ) {
    return { ok: false, reason: "invalidParent" };
  }

  const target = siblingsOf(menus, toParent).filter(
    (m) => m.code !== active.code,
  );
  const insertAt = dropsInside
    ? target.length
    : siblingsOf(menus, toParent).findIndex((m) => m.code === over.code);
  target.splice(insertAt, 0, active);

  const previous =
    fromParent === toParent
      ? []
      : siblingsOf(menus, fromParent).filter((m) => m.code !== active.code);

  const changes: MenuMove[] = [];
  for (const [list, parentCode] of [
    [previous, fromParent],
    [target, toParent],
  ] as const) {
    list.forEach((menu, position) => {
      if (parentOf(menu) !== parentCode || menu.position !== position) {
        changes.push({ code: menu.code, parentCode, position });
      }
    });
  }

  return changes.length > 0
    ? { ok: true, changes }
    : { ok: false, reason: "noop" };
}
