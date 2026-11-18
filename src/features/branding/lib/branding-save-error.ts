/** Why a save failed. `detail` is the slot key for "upload", the API message for "api". */
export class BrandingSaveError extends Error {
  constructor(
    readonly reason: "upload" | "forbidden" | "invalid" | "api",
    readonly detail?: string,
  ) {
    super(`branding.${reason}`);
  }
}
