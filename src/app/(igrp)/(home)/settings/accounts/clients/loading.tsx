import { getTranslations } from "next-intl/server";

import { AppCenterLoading } from "@/components/loading";

export default async function OAuthClientsLoading() {
  const t = await getTranslations("oauthClients.loading");
  return <AppCenterLoading description={t("list")} />;
}
