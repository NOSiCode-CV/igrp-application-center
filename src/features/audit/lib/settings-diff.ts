/* The Settings Report encodes edits as `field=old` → `field=new`, several
   fields separated by `;` (guide §3.3). Values are free text and may contain
   either character, so this never throws: anything it can't read cleanly
   returns null and the caller shows the raw strings. */

export interface FieldChange {
  field: string;
  previous: string | null;
  next: string | null;
}

function parseSide(
  value: string | null | undefined,
): Map<string, string> | null {
  const pairs = new Map<string, string>();
  if (!value) return pairs;
  for (const part of value.split(";")) {
    if (part === "") continue;
    const eq = part.indexOf("=");
    if (eq <= 0) return null;
    pairs.set(part.slice(0, eq).trim(), part.slice(eq + 1));
  }
  return pairs;
}

export function parseSettingsDiff(
  previous?: string | null,
  next?: string | null,
): FieldChange[] | null {
  const before = parseSide(previous);
  const after = parseSide(next);
  if (!before || !after) return null;

  const fields = [...new Set([...before.keys(), ...after.keys()])];
  if (fields.length === 0) return null;

  return fields.map((field) => ({
    field,
    previous: before.get(field) ?? null,
    next: after.get(field) ?? null,
  }));
}
