import { IGRPForbidden } from "@igrp/framework-next-ui";
import { getTranslations } from "next-intl/server";

/* Replaces the (igrp) 403 for this segment only. */
export default async function CustomizationForbidden() {
  const t = await getTranslations("branding.forbidden");
  return <IGRPForbidden description={t("description")} />;
}
