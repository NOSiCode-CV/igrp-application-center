export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

export function imageUploadProblem(
  file: File | Blob,
  maxBytes = MAX_IMAGE_UPLOAD_BYTES,
): "notImage" | "tooLarge" | null {
  const ico =
    file.type === "" && /\.ico$/i.test((file as Partial<File>).name ?? "");
  if (!file.type.startsWith("image/") && !ico) return "notImage";
  if (file.size > maxBytes) return "tooLarge";
  return null;
}
