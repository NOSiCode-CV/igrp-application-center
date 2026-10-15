import { useTranslations } from "next-intl";

import { AppCenterLoading } from "@/components/loading";

export function TabLoading() {
  const t = useTranslations("users.detail");
  return <AppCenterLoading description={t("loading")} />;
}
