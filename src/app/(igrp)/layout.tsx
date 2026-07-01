import { IGRPLayoutFull, igrpGetClaims } from "@igrp/framework-next";
import type { IGRPLayoutConfigArgs } from "@igrp/framework-next-types";
import { IGRPSectionPermissions } from "@igrp/framework-next-ui";

import { createConfig } from "@/igrp.template.config";
import { getLayoutConfig, verifySession } from "@/lib/dal";
import { IGRPQueryProvider } from "@/providers/query-provider";

// Every route under this layout is authenticated and reads the session
// (cookies/headers) per request, so it can never be statically prerendered.
// Declaring it dynamic skips the build-time prerender attempt that would
// otherwise trip Next's `headers()` bailout.
export const dynamic = "force-dynamic";

export default async function IGRPRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await verifySession();

  const layoutConfig = await getLayoutConfig();
  const config = await createConfig(layoutConfig as IGRPLayoutConfigArgs);
  // verifySession() above seeds the per-request access-client config that igrpGetClaims() reads.
  const claims = await igrpGetClaims();

  return (
    <IGRPSectionPermissions state={claims}>
      <IGRPQueryProvider>
        <IGRPLayoutFull config={config}>{children}</IGRPLayoutFull>
      </IGRPQueryProvider>
    </IGRPSectionPermissions>
  );
}
