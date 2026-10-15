import "server-only";

import { redirect } from "next/navigation";

import {
  AccessManagementClient,
  type ApiClientConfig,
  BaseApiClient,
} from "@igrp/platform-access-management-client-ts";
import { getLocale } from "next-intl/server";

import { serverSession } from "@/lib/auth";

// Default request timeout for fast JSON calls. File uploads override this
// (see getClientAccess options) because large payloads / slow storage can
// legitimately take much longer than 10s.
const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * Connection settings for the Access Management API on behalf of the current
 * user: bearer token plus `Accept-Language` = the resolved locale, so the API
 * translates error `detail`s, validation messages and reports (FR-9).
 */
export async function getAccessClientConfig(options?: {
  timeout?: number;
}): Promise<ApiClientConfig> {
  const session = await serverSession();
  if (!session) {
    redirect("/login");
  }

  return {
    baseUrl: process.env.IGRP_ACCESS_MANAGEMENT_API ?? "",
    timeout: options?.timeout ?? DEFAULT_TIMEOUT_MS,
    headers: {
      Authorization: `Bearer ${session.accessToken as string}`,
      "Accept-Language": await getLocale(),
    },
  };
}

export async function getClientAccess(options?: { timeout?: number }) {
  return AccessManagementClient.create(await getAccessClientConfig(options));
}

// TODO(i18n): use client.users.updateCurrentUserLocale once
// @igrp/platform-access-management-client-ts with it is released (the
// installed version predates `PUT /api/users/me/locale`).
class CurrentUserLocaleClient extends BaseApiClient {
  updateCurrentUserLocale(locale: string) {
    return this.put<void>("/api/users/me/locale", { locale });
  }
}

/** `PUT /api/users/me/locale` — stores `metadata.locale` (204). */
export async function updateCurrentUserLocale(locale: string): Promise<void> {
  const client = new CurrentUserLocaleClient(await getAccessClientConfig());
  await client.updateCurrentUserLocale(locale);
}
