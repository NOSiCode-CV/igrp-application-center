"use server";

import type {
  FileUrlDTO,
  UploadFileOptions,
} from "@igrp/platform-access-management-client-ts";

import { toActionError } from "@/lib/utilities";

import { getClientAccess } from "./access-client";
import type { ActionResult } from "./types";

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
  const client = await getClientAccess();

  if (!file) {
    return { success: false, error: "Nenhum arquivo encontrado" };
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
  const client = await getClientAccess();

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
