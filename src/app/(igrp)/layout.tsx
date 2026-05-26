import { TooltipProvider } from "@igrp/igrp-framework-react-design-system";
import { verifySession } from "@/lib/dal";
import { QueryProvider } from "@/providers/query-provider";

export default async function IGRPRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await verifySession();
  return (
    <QueryProvider>
      <TooltipProvider>{children}</TooltipProvider>
    </QueryProvider>
  );
}
