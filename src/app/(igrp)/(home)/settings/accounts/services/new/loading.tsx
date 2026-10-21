import { getTranslations } from "next-intl/server";

import { AppCenterLoading } from "@/components/loading";

export default async function NewServiceAccountLoading() {
  const t = await getTranslations("serviceAccounts.loading");
  return <AppCenterLoading description={t("new")} />;
}
