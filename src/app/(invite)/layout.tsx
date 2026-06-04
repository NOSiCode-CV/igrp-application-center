import { Toaster } from "@igrp/igrp-framework-react-design-system";

import { QueryProvider } from "@/providers/query-provider";

export default function InviteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <QueryProvider>
      {children}
      <Toaster richColors position="top-right" />
    </QueryProvider>
  );
}
