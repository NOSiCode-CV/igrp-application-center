import type { Metadata } from "next";

import { IGRPTemplateNotFound } from "@igrp/framework-next-ui";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("app.notFound");
  return { title: t("title"), description: t("description") };
}

export default function NotFound() {
  const appCode = process.env.IGRP_APP_CODE || "";
  return <IGRPTemplateNotFound appCode={appCode} />;
}
