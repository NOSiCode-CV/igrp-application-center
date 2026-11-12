import "server-only";

import { toActionError } from "@/lib/utilities";

import { getClientAccess } from "./access-client";
import type { AccessClient, ActionResult } from "./types";

/**
 * The shape every SDK-backed action shares. The client is resolved OUTSIDE the
 * try: its `redirect("/login")` throws a control-flow error that Next must see,
 * and catching it would turn an expired session into an error toast.
 */
export async function callApi<T>(
  label: string,
  call: (client: AccessClient) => Promise<{ data: T }>,
  options?: { timeout?: number },
): Promise<ActionResult<T>> {
  const client = await getClientAccess(options);
  try {
    return { success: true, data: (await call(client)).data };
  } catch (error) {
    console.error(label, error);
    return { success: false, ...toActionError(error) };
  }
}
