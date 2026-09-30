import { IGRPPageHeader } from "@igrp/igrp-framework-react-design-system";

import { AccountsTabs } from "@/features/accounts/components/accounts-tabs";
import { PAGE_HEADER_PROPS } from "@/lib/page-header";

export default function AccountsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex flex-col gap-6">
      <IGRPPageHeader
        {...PAGE_HEADER_PROPS}
        title="Contas e Serviços"
        description="Identidades que acedem às APIs do iGRP: clientes OAuth e as contas de serviço que os envolvem."
        showBackButton
        urlBackButton="/settings"
      />
      <AccountsTabs>{children}</AccountsTabs>
    </div>
  );
}
