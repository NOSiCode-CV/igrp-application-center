import { HttpStatusError } from "@/lib/errors";

import type { getClientAccess } from "./access-client";

/**
 * Shared discriminated-union result for server actions.
 * Use across all `src/actions/*` files instead of redefining locally.
 */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; status?: number };

/**
 * Narrows an `ActionResult` inside a TanStack `queryFn`: returns `data` on
 * success, otherwise throws `HttpStatusError` so the client failure carries
 * the HTTP status (used by the status error boundaries). Standardizes what
 * was previously a mix of `throw new Error(result.error)` and
 * `throw new HttpStatusError(...)` across queryFns.
 */
export function unwrap<T>(result: ActionResult<T>): T {
  if (!result.success) throw new HttpStatusError(result.status, result.error);
  return result.data;
}

/**
 * Resolves the SDK access-client type once so action files can extract
 * return shapes for SDK methods whose DTOs are not re-exported by the
 * `@igrp/platform-access-management-client-ts` package (PermissionDTO,
 * InvitationDTO, RoleDepartmentDTO, …).
 *
 * Usage:
 *   type Result = SdkData<AccessClient["users"]["getUserInvitations"]>;
 */
export type AccessClient = Awaited<ReturnType<typeof getClientAccess>>;

export type SdkData<F extends (...args: never[]) => unknown> =
  Awaited<ReturnType<F>> extends { data: infer D } ? D : never;
