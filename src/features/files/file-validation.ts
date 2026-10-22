import { useCallback } from "react";

import { useTranslations } from "next-intl";

export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

/**
 * Client-side guard for image uploads. Returns a localized error message when
 * the file is not an image or exceeds the size limit, or `null` when valid.
 * The server still validates; this is for immediate user feedback.
 */
export function useValidateImageUpload(
  maxBytes = MAX_IMAGE_UPLOAD_BYTES,
): (file: File) => string | null {
  const t = useTranslations("common.fileUpload");
  return useCallback(
    (file) => {
      if (!file.type.startsWith("image/")) return t("notImage");
      if (file.size > maxBytes) {
        return t("tooLarge", { size: Math.round(maxBytes / (1024 * 1024)) });
      }
      return null;
    },
    [t, maxBytes],
  );
}
