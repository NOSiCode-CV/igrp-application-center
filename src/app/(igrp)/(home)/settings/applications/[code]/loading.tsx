import { getTranslations } from "next-intl/server";

import { AppCenterLoading } from "@/components/loading";

export default async function ApplicationDetailsLoading() {
  const t = await getTranslations("applications.details");
  return <AppCenterLoading description={t("loading")} />;
}
