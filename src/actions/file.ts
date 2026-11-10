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
import type { ActionResult } from "./types";

// Uploads carry large payloads and hit slow storage backends, so they need a
// far more generous timeout than the default fast-path JSON calls.
const UPLOAD_TIMEOUT_MS = 60_000;

export async function getFileUrl(
  path: string,
): Promise<ActionResult<FileUrlDTO>> {
  const client = await getClientAccess();

  try {
    const result = await client.files.getFileUrl(path);
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[files-get] Não foi possível obter a imagem:", error);
    return { success: false, ...toActionError(error) };
  }
}

export async function uploadPublicFile(
  file: File | Blob,
  options: UploadFileOptions,
): Promise<ActionResult<string>> {
  const client = await getClientAccess({ timeout: UPLOAD_TIMEOUT_MS });

  if (!file) {
    return { success: false, error: "Nenhum arquivo encontrado" };
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

export async function uploadPrivateFile(
  file: File | Blob,
  options: UploadFileOptions,
): Promise<ActionResult<string>> {
  const client = await getClientAccess({ timeout: UPLOAD_TIMEOUT_MS });

  try {
    const result = await client.files.uploadPrivateFile(file, options);
    return { success: true, data: result.data };
  } catch (error) {
    console.error(
      "[files-upload-private] Não foi possível carregar o ficheiro:",
      error,
    );
    return { success: false, ...toActionError(error) };
  }
}
