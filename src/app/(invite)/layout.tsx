import { IGRPLocaleSwitcher } from "@igrp/framework-next/i18n/client";
import { IGRPTemplateModeSwitcher } from "@igrp/framework-next-ui";
import { Toaster } from "@igrp/igrp-framework-react-design-system";

import { InviteBrandLogo } from "@/features/branding/components/invite-brand-logo";
import { setLocale } from "@/i18n/actions";
import { IGRPQueryProvider } from "@/providers/query-provider";

export default function InviteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <IGRPQueryProvider>
      <InviteBrandLogo />
      <div className="fixed top-4 right-4 z-10 flex items-center gap-2">
        <IGRPLocaleSwitcher action={setLocale} />
        <IGRPTemplateModeSwitcher />
      </div>
      {children}
      <Toaster richColors position="top-right" />
    </IGRPQueryProvider>
  );
}
