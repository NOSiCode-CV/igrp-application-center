import type { IGRPErrorCopyResolver } from "@igrp/framework-next-ui";

import { parsePublicDigest } from "@/lib/errors";

/**
 * Platform error codes and the generic copy come from the framework's chrome
 * catalog in the current language. The only app-specific input is an
 * `AppError`'s public message, carried in `error.digest`: when present it
 * becomes the description and the catalog keeps the title.
 */
export const resolvePublicErrorCopy: IGRPErrorCopyResolver = (error) => {
  // Next adds `digest` to errors crossing the server→client edge; the
  // resolver's parameter is typed as a plain `Error`.
  const { message } = parsePublicDigest((error as { digest?: string }).digest);
  return message ? { description: message } : undefined;
};
