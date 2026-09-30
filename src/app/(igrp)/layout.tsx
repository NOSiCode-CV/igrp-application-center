import { Suspense } from "react";

import { IGRPLayoutFull, igrpGetClaims } from "@igrp/framework-next";
import { IGRPSectionPermissions } from "@igrp/framework-next-ui";

import { AppSearch } from "@/components/header/app-search";
import { LocaleSwitcher } from "@/i18n/components/locale-switcher";
import { createConfig } from "@/igrp.template.config";
import { getLayoutConfig, verifySession } from "@/lib/dal";
import {
  type AppSearchCommand,
  getHeaderSearchCommands,
} from "@/lib/header-search";
import { IGRPQueryProvider } from "@/providers/query-provider";

// Every route under this layout is authenticated and reads the session
// (cookies/headers) per request, so it can never be statically prerendered.
// Declaring it dynamic skips the build-time prerender attempt that would
// otherwise trip Next's `headers()` bailout.
export const dynamic = "force-dynamic";

/**
 * Awaits the search commands inside the `<Suspense>` below, so the menu fetch
 * streams in instead of holding back the whole shell.
 *
 * The promise is created in the layout body, not here: a Suspense-deferred
 * Server Component does not reliably inherit the per-request access-client
 * AsyncLocalStorage store (see IGRPLayoutFull), so the fetch has to start in
 * the layout's own async context — the same one it always ran in.
 */
async function AppSearchSlot({
  commands,
}: {
  commands: Promise<AppSearchCommand[]>;
}) {
  return <AppSearch commands={await commands} />;
}

export default async function IGRPRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Independent: verifySession() gates the request, getLayoutConfig() reads the
  // (cached) session + theme the root layout already requested.
  const [, layoutConfig] = await Promise.all([
    verifySession(),
    getLayoutConfig(),
  ]);
  const config = await createConfig(layoutConfig);
  // verifySession() above seeds the per-request access-client config that igrpGetClaims() reads.
  const claims = await igrpGetClaims();

  // Header slots are consumer-injected chrome: the framework still fetches and
  // owns all header data, a slot only replaces what renders in its position.
  // `search` here supplies the command palette the framework mounts empty.
  //
  // Not awaited: this is a live Access Management call, and awaiting it here
  // would block the first byte of every authenticated page on it — including
  // the header/sidebar skeletons IGRPLayoutFull streams behind their own
  // Suspense boundaries. The sidebar shares the same per-request menu fetch.
  const searchCommands = getHeaderSearchCommands(config);

  return (
    <IGRPSectionPermissions state={claims}>
      <IGRPQueryProvider>
        <IGRPLayoutFull
          config={config}
          headerSlots={{
            search: (
              <Suspense fallback={<AppSearch commands={[]} />}>
                <AppSearchSlot commands={searchCommands} />
              </Suspense>
            ),
            actions: <LocaleSwitcher />,
          }}
          showSidebar={false}
          rootProviderClassName="p-0"
        >
          {children}
        </IGRPLayoutFull>
      </IGRPQueryProvider>
    </IGRPSectionPermissions>
  );
}
