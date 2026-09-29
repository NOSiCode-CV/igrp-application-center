import { Toaster } from "@igrp/igrp-framework-react-design-system";

import { IGRPQueryProvider } from "@/providers/query-provider";
import { LocaleSwitcher } from "@/i18n/components/locale-switcher";

export default function InviteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <IGRPQueryProvider>
      <div className="fixed top-4 right-4 z-10 w-44">
        <LocaleSwitcher />
      </div>
      {children}
      <Toaster richColors position="top-right" />
    </IGRPQueryProvider>
  );
}
