import { IGRPPageHeader } from "@igrp/igrp-framework-react-design-system";
import { getTranslations } from "next-intl/server";

import { AccountsTabs } from "@/features/accounts/components/accounts-tabs";
import { PAGE_HEADER_PROPS } from "@/lib/page-header";

export default async function AccountsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const t = await getTranslations("accounts.layout");
  return (
    <div className="flex flex-col gap-6">
      <IGRPPageHeader
        {...PAGE_HEADER_PROPS}
        title={t("title")}
        description={t("description")}
        showBackButton
        urlBackButton="/settings"
      />
      <AccountsTabs>{children}</AccountsTabs>
    </div>
  );
}
