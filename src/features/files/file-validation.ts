export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

/**
 * Client-side guard for image uploads. Returns a localized error message when
 * the file is not an image or exceeds the size limit, or `null` when valid.
 * The server still validates; this is for immediate user feedback.
 */
export function validateImageUpload(
  file: File,
  maxBytes = MAX_IMAGE_UPLOAD_BYTES,
): string | null {
  if (!file.type.startsWith("image/")) {
    return "Ficheiro inválido. Selecione uma imagem.";
  }
  if (file.size > maxBytes) {
    const maxMb = Math.round(maxBytes / (1024 * 1024));
    return `A imagem excede o limite de ${maxMb}MB.`;
  }
  return null;
}
