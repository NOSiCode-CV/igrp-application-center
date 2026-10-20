"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import {
  BRAND_FRESHNESS_COOKIE,
  igrpAuthorize,
  igrpInvalidateBranding,
} from "@igrp/framework-next";
import type { IGRPBranding } from "@igrp/framework-next-types";
import { igrpParseBranding } from "@igrp/framework-next-ui";
import { GlobalConfigurationType } from "@igrp/platform-access-management-client-ts";

import { BRANDING_TOKEN_NAMES } from "@/features/branding/catalog";
import {
  checkSavableBranding,
  minioBaseUrl,
} from "@/features/branding/lib/branding-rules";
import { CUSTOMIZE_PERMISSION } from "@/lib/constants";
import { isBrandingEnabled, toActionError } from "@/lib/utilities";

import { getClientAccess } from "./access-client";
import type { ActionResult } from "./types";

/* The page guard is navigation; these checks are the enforcement in front of
   the SDK call. Access Management enforces the permission again on POST. */
const DISABLED = {
  success: false,
  error: "A personalização não está ativa.",
  status: 404,
} as const;
const FORBIDDEN = {
  success: false,
  error: "Não tem permissão para personalizar a plataforma.",
  status: 403,
} as const;
/* 422, not 400, so the editor can tell its own rule failures from API errors. */
const INVALID = {
  success: false,
  error: "Configuração de marca inválida.",
  status: 422,
} as const;

/** Freshness cookie lifetime; matches the loader's 300 s window. */
const BRAND_COOKIE_MAX_AGE_S = 300;

const statusOf = (error: unknown) =>
  (error as { status?: number } | null)?.status;

export async function getBranding(): Promise<
  ActionResult<IGRPBranding | null>
> {
  if (!(await igrpAuthorize(CUSTOMIZE_PERMISSION))) return FORBIDDEN;
  const client = await getClientAccess();

  try {
    const result = await client.globalConfiguration.getGlobalConfiguration(
      GlobalConfigurationType.ORGANIZATION,
    );
    return {
      success: true,
      data: igrpParseBranding(result.data.config).branding,
    };
  } catch (error) {
    if (statusOf(error) === 404) return { success: true, data: null };
    console.error("[branding] Erro ao carregar a personalização:", error);
    return { success: false, ...toActionError(error) };
  }
}

export async function saveBranding(raw: string): Promise<ActionResult<void>> {
  if (!isBrandingEnabled()) return DISABLED;
  if (!(await igrpAuthorize(CUSTOMIZE_PERMISSION))) return FORBIDDEN;
  const branding = checkSavableBranding(
    raw,
    minioBaseUrl(),
    BRANDING_TOKEN_NAMES,
  );
  if (!branding) return INVALID;

  const client = await getClientAccess();
  try {
    // Store the cleaned document, so unknown keys never reach the database.
    await client.globalConfiguration.setGlobalConfiguration({
      type: GlobalConfigurationType.ORGANIZATION,
      config: JSON.stringify(branding),
    });
  } catch (error) {
    console.error("[branding] Erro ao guardar a personalização:", error);
    return { success: false, ...toActionError(error) };
  }

  // This instance refetches on its next request; the cookie tells other
  // instances behind the same host to refetch once (spec §8.4).
  igrpInvalidateBranding();
  (await cookies()).set(BRAND_FRESHNESS_COOKIE, String(Date.now()), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: BRAND_COOKIE_MAX_AGE_S,
  });
  revalidatePath("/", "layout");
  return { success: true, data: undefined };
}
