import type { IGRPMenuItemArgs } from "@igrp/framework-next-types";
import {
  IGRPIconObject,
  type IGRPOptionsProps,
} from "@igrp/igrp-framework-react-design-system";

import { formatIconString } from "@/lib/utilities";

// Names only (sorted data): IGRPIconList would pull every icon's code into the bundle.
export const LUCIDE_ICON_OPTIONS: IGRPOptionsProps[] = IGRPIconObject.map(
  (name) => ({ value: name, label: formatIconString(name) }),
);

export function getNextMenuPosition(
  menus: IGRPMenuItemArgs[],
  parentCode?: string | null,
): number {
  const normalizedParent = parentCode ?? null;
  const siblings = menus.filter(
    (m) => (m.parentCode ?? null) === normalizedParent,
  );
  if (siblings.length === 0) return 0;
  return Math.max(...siblings.map((m) => m.position ?? 0)) + 1;
}
