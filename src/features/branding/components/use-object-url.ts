"use client";

import { useEffect, useState } from "react";

/** A displayable URL for a picked `File` (revoked on change) or the saved URL string. */
export function useObjectUrl(value: File | string | undefined): string {
  const [url, setUrl] = useState(typeof value === "string" ? value : "");
  useEffect(() => {
    if (!(value instanceof File)) {
      setUrl(typeof value === "string" ? value : "");
      return;
    }
    const objectUrl = URL.createObjectURL(value);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [value]);
  return url;
}
