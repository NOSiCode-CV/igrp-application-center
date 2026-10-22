import { IGRPTemplateModeSwitcher } from "@igrp/framework-next-ui";
import { Toaster } from "@igrp/igrp-framework-react-design-system";

import { InviteBrandLogo } from "@/features/branding/components/invite-brand-logo";
import { SessionLocaleSwitcher } from "@/i18n/session-locale-switcher";
import { IGRPQueryProvider } from "@/providers/query-provider";

export default function InviteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <IGRPQueryProvider>
      <InviteBrandLogo />
      <div className="fixed top-4 right-4 z-10 flex items-center gap-2">
        <SessionLocaleSwitcher />
        <IGRPTemplateModeSwitcher />
      </div>
      {children}
      <Toaster richColors position="top-right" />
    </IGRPQueryProvider>
  );
}
