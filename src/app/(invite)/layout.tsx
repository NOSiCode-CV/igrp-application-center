import { Toaster } from "@igrp/igrp-framework-react-design-system";

import { IGRPQueryProvider } from "@/providers/query-provider";

export default function InviteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <IGRPQueryProvider>
      {children}
      <Toaster richColors position="top-right" />
    </IGRPQueryProvider>
  );
}
