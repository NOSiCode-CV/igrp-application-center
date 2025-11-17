"use server";

import type { UploadFileOptions } from "@igrp/platform-access-management-client-ts";
import { getClientAccess } from "./access-client";
import { headers } from "next/headers";

export async function getFileUrl(path: string) {
  const client = await getClientAccess();

  try {
    const result = await client.files.getFileUrl(path);
    return result.data;
  } catch (error) {
    console.error("[files-get] Não obter a imagem:", error);
    throw error;
  }
}

export async function uploadPublicFile(
  formData: FormData,
  options: UploadFileOptions
) {
  const client = await getClientAccess();
  const headersList = await headers();
  const contentType = headersList.get('content-type') ?? '';
  
  const file = formData.get('file') as File | Blob;
  
  if (!file) {
    throw new Error('Nenhum arquivo encontrado');
  }
  
  try {
    const result = await client.files.uploadPublicFile(file, options, contentType);
    return result.data;
  } catch (error) {
    console.error(
      "[files-upload-public] Não possivel carregar o ficheiro:",
      error,
    );
    throw error;
  }
}


export async function uploadPrivateFile(
  file: File | Blob,
  options: UploadFileOptions,
) {
  const client = await getClientAccess();

  // console.log({ file, options });

  try {
    const result = await client.files.uploadPrivateFile(file, options);
    return result.data;
  } catch (error) {
    console.error(
      "[files-upload-private] Não possivel carregar o ficheiro:",
      error,
    );
    throw error;
  }
}
