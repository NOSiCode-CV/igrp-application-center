"use server";

import type {
  FileUrlDTO,
  UploadFileOptions,
} from "@igrp/platform-access-management-client-ts";
import { getTranslations } from "next-intl/server";

import {
  imageUploadProblem,
  MAX_IMAGE_UPLOAD_BYTES,
} from "@/features/files/upload-rules";
import { toActionError } from "@/lib/utilities";

import { getClientAccess } from "./access-client";
import { callApi } from "./call-api";
import type { ActionResult } from "./types";

// Uploads carry large payloads and hit slow storage backends, so they need a
// far more generous timeout than the default fast-path JSON calls.
const UPLOAD_TIMEOUT_MS = 60_000;

export async function getFileUrl(
  path: string,
): Promise<ActionResult<FileUrlDTO>> {
  return callApi("[files-get] Não foi possível obter a imagem:", (client) =>
    client.files.getFileUrl(path),
  );
}

export async function uploadPublicFile(
  file: File | Blob,
  options: UploadFileOptions,
): Promise<ActionResult<string>> {
  const client = await getClientAccess({ timeout: UPLOAD_TIMEOUT_MS });

  if (!file) {
    const t = await getTranslations("errors.actions");
    return { success: false, error: t("noFile") };
  }

  // The browser checks this too, but an action can be called directly.
  const problem = imageUploadProblem(file);
  if (problem) {
    const t = await getTranslations("common.fileUpload");
    return {
      success: false,
      status: 422,
      error:
        problem === "tooLarge"
          ? t("tooLarge", { size: MAX_IMAGE_UPLOAD_BYTES / (1024 * 1024) })
          : t(problem),
    };
  }

  try {
    const result = await client.files.uploadPublicFile(
      file,
      options,
      file.type,
    );
    return { success: true, data: result.data };
  } catch (error) {
    console.error(
      "[files-upload-public] Não foi possível carregar o ficheiro:",
      error,
    );
    return { success: false, ...toActionError(error) };
  }
}
