/** A permission as the role dialog sees it; the API identifies it by `name`. */
export interface PermissionLike {
  id?: number;
  name: string;
  description?: string | null;
}

const norm = (s: string) => s.trim().toLowerCase();

/**
 * Permission names to add to and remove from a role so that its permissions
 * become `selected`. Names match ignoring case and surrounding spaces; the
 * returned names keep the spelling the API sent (`existing` for removals,
 * `selected` for additions).
 */
export function diffPermissions(
  selected: PermissionLike[],
  existing: PermissionLike[],
): { toAdd: string[]; toRemove: string[] } {
  const selectedByNorm = new Map(selected.map((p) => [norm(p.name), p.name]));
  const existingByNorm = new Map(existing.map((p) => [norm(p.name), p.name]));

  return {
    toAdd: [...selectedByNorm]
      .filter(([n, name]) => name && !existingByNorm.has(n))
      .map(([, name]) => name),
    toRemove: [...existingByNorm]
      .filter(([n, name]) => name && !selectedByNorm.has(n))
      .map(([, name]) => name),
  };
}
