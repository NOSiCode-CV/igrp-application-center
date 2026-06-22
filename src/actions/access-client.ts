import "server-only";

import { redirect } from "next/navigation";

import { AccessManagementClient } from "@igrp/platform-access-management-client-ts";

import { serverSession } from "@/lib/auth";

// Default request timeout for fast JSON calls. File uploads override this
// (see getClientAccess options) because large payloads / slow storage can
// legitimately take much longer than 10s.
const DEFAULT_TIMEOUT_MS = 10_000;

export async function getClientAccess(options?: { timeout?: number }) {
  const session = await serverSession();
  if (!session) {
    redirect("/login");
  }

  return AccessManagementClient.create({
    baseUrl: process.env.IGRP_ACCESS_MANAGEMENT_API ?? "",
    timeout: options?.timeout ?? DEFAULT_TIMEOUT_MS,
    headers: {
      Authorization: `Bearer ${session.accessToken as string}`,
    },
  });
}
