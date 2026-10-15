import { uploadPublicFile } from "@/actions/file";
import { saveBranding } from "@/actions/global-configuration";

import {
  type BrandingFormValues,
  LOGO_SLOTS,
  type LogoSlotKey,
  toBrandingDocument,
} from "./branding-mapper";
import { minioBaseUrl } from "./branding-rules";
import { BrandingSaveError } from "./branding-save-error";

/** String join, not `new URL(path, base)`, which would drop a bucket path without a trailing slash. */
export function brandingAssetUrl(path: string, base = minioBaseUrl()): string {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

async function upload(
  slot: LogoSlotKey,
  value: File | string,
): Promise<string> {
  if (!(value instanceof File)) return value;
  const result = await uploadPublicFile(value, { folder: "branding" });
  if (!result.success) throw new BrandingSaveError("upload", slot);
  return brandingAssetUrl(result.data);
}

/** Uploads every picked file in parallel; the first failure aborts. */
export async function uploadLogos(
  logos: BrandingFormValues["logos"],
): Promise<BrandingFormValues<string>["logos"]> {
  const entries = await Promise.all(
    LOGO_SLOTS.map(async (slot) => {
      const s = logos[slot];
      const [light, dark] = await Promise.all([
        upload(slot, s.light),
        upload(slot, s.dark),
      ]);
      return [slot, { ...s, light, dark }] as const;
    }),
  );
  return Object.fromEntries(entries) as BrandingFormValues<string>["logos"];
}

/** Spec §10.3: upload, normalize, save. Throws `BrandingSaveError`. */
export async function persistBranding(
  values: BrandingFormValues,
): Promise<void> {
  const logos = await uploadLogos(values.logos);
  const result = await saveBranding(
    JSON.stringify(toBrandingDocument({ ...values, logos })),
  );
  if (result.success) return;
  if (result.status === 403) throw new BrandingSaveError("forbidden");
  if (result.status === 422) throw new BrandingSaveError("invalid");
  throw new BrandingSaveError(
    "api",
    result.status === 404 ? undefined : result.error,
  );
}
