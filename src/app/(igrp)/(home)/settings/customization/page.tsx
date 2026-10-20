import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { igrpAssertAuthorize } from "@igrp/framework-next";
import { getTranslations } from "next-intl/server";

import { BrandingScreen } from "@/features/branding/components/branding-screen";
import { CUSTOMIZE_PERMISSION } from "@/lib/constants";
import { isBrandingEnabled } from "@/lib/utilities";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("branding.meta");
  return { title: t("title"), description: t("description") };
}

/* Flag off or auth bypassed: the route does not exist (spec §7.4). Then the
   in-chrome 403 for users without the permission. The actions check again;
   the AM API is the real enforcement. */
export default async function CustomizationPage() {
  if (!isBrandingEnabled()) notFound();
  await igrpAssertAuthorize(CUSTOMIZE_PERMISSION);
  return <BrandingScreen />;
}
