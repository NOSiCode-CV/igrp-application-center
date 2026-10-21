import { getTranslations } from "next-intl/server";

import { AppCenterLoading } from "@/components/loading";

export default async function ServiceAccountsLoading() {
  const t = await getTranslations("serviceAccounts.loading");
  return <AppCenterLoading description={t("list")} />;
}
