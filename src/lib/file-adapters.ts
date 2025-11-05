// lib/file-adapters.ts
import { nanoid } from "nanoid";
import type { FileWithPreview } from "@/features/files/files-schema";

export async function urlToFileWithPreview(
  url: string,
): Promise<FileWithPreview> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);

  const blob = await res.blob();

  const filename =
    decodeURIComponent((url.split("/").pop() || "file").split("?")[0]) ||
    "file";

  const file = new File([blob], filename, {
    type: blob.type || "application/octet-stream",
  });
  const preview = URL.createObjectURL(file);

  return {
    id: nanoid(),
    file,
    preview,
  };
}
