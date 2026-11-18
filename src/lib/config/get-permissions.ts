import type { IGRPPermissionCatalogEntry } from "@igrp/framework-next-types";

// Static import, NOT `readFileSync(process.cwd() + '/.igrpstudio/...')`.
// A static import is traced by the bundler, so the catalog is baked into the
// server build and is present in the Docker standalone output. A runtime read
// of a computed path is not traced — it works in dev and is missing in the
// container, which is the worst possible failure shape.
import catalog from "../../../.igrpstudio/permissions.json";

interface IgrpStudioPermission {
  /** iGRP Studio's local identifier. Meaningless server-side — dropped. */
  id?: string;
  name: string;
  /** Studio-only UI string. Access Management stores `description` — dropped. */
  label?: string;
  description?: string;
  enabled: boolean;
}

/**
 * The application's permission catalog, as declared in
 * `.igrpstudio/permissions.json` (maintained by iGRP Studio).
 *
 * Pushed to Access Management at startup only when `IGRP_SYNC_PERMISSIONS=true`
 * (plus `IGRP_SYNC_ACCESS=true` and `IGRP_PREVIEW_MODE=false`). The push is an
 * idempotent upsert keyed on `name`; entries removed here are NOT deleted in
 * AM — retire them via the AM admin UI.
 *
 * Registering a permission does not make it checkable: AM must still grant it
 * to a role, and the user's token must carry the resulting claim. See
 * `docs/PERMISSIONS.md`.
 */
export function getPermissions(): IGRPPermissionCatalogEntry[] {
  const permissions =
    (catalog as { permissions?: IgrpStudioPermission[] }).permissions ?? [];

  return permissions.map((permission) => ({
    name: permission.name,
    description: permission.description,
    enabled: permission.enabled,
  }));
}
