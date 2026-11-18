// shortcut: the Access Management API proxy rejects bodies over ~1 MB (413);
// raise this (and serverActions.bodySizeLimit) once that limit is raised.
export const MAX_IMAGE_UPLOAD_BYTES = 1 * 1024 * 1024;

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
