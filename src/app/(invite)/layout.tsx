import { IGRPTemplateModeSwitcher } from "@igrp/framework-next-ui";
import { Toaster } from "@igrp/igrp-framework-react-design-system";

import { LocaleSwitcher } from "@/i18n/components/locale-switcher";
import { IGRPQueryProvider } from "@/providers/query-provider";

export default function InviteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <IGRPQueryProvider>
      <div className="fixed top-4 right-4 z-10 flex items-center gap-2">
        <LocaleSwitcher />
        <IGRPTemplateModeSwitcher />
      </div>
      {children}
      <Toaster richColors position="top-right" />
    </IGRPQueryProvider>
  );
}
