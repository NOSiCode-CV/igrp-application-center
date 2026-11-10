import { useCallback } from "react";

import { useTranslations } from "next-intl";

import { imageUploadProblem, MAX_IMAGE_UPLOAD_BYTES } from "./upload-rules";

export { MAX_IMAGE_UPLOAD_BYTES };

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
      const problem = imageUploadProblem(file, maxBytes);
      if (problem === "tooLarge") {
        return t("tooLarge", { size: Math.round(maxBytes / (1024 * 1024)) });
      }
      return problem && t(problem);
    },
    [t, maxBytes],
  );
}
