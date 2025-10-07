'use server';

import { UploadFileOptions } from '@igrp/platform-access-management-client-ts';
import { getClientAccess } from './access-client';

export async function getFileUrl(path: string) {
  const client = await getClientAccess();

  try {
    const result = await client.files.getFileUrl(path);
    return result.data;
  } catch (error) {
    console.error('[files-get] Não obter a imagem:', error);
    throw error;
  }
}

export async function uploadPublicFile(file: File | Blob, options: UploadFileOptions) {
  const client = await getClientAccess();

  console.log({ file, options });

  try {
    const result = await client.files.uploadPublicFile(file, options);
    return result.data;
  } catch (error) {
    console.error('[files-upload] Não possivel carregar o ficheiro:', error);
    throw error;
  }
}
