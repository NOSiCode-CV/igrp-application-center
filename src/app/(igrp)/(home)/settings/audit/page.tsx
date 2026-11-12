import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";

import { igrpAssertAuthorize } from "@igrp/framework-next";
import { getTranslations } from "next-intl/server";

import { AuditScreen } from "@/features/audit/components/audit-screen";
import { PanelOpenProvider } from "@/features/audit/components/report-query-panel";
import {
  PANEL_OPEN_COOKIE,
  panelOpenFromCookie,
} from "@/features/audit/lib/panel-cookie";
import { AUDIT_VIEW_PERMISSION } from "@/lib/constants";

import Loading from "./loading";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("audit.meta");
  return { title: t("title"), description: t("description") };
}

/* The first page in the app to use a server guard (docs/PERMISSIONS.md):
   a missing permission renders the in-chrome 403 before anything streams.
   The server actions check again; the AM API is the real enforcement. */
export default async function AuditPage() {
  await igrpAssertAuthorize(AUDIT_VIEW_PERMISSION);
  const panelOpen = panelOpenFromCookie(
    (await cookies()).get(PANEL_OPEN_COOKIE)?.value,
  );

  // useSearchParams() inside needs a Suspense boundary.
  return (
    <Suspense fallback={<Loading />}>
      <PanelOpenProvider initial={panelOpen}>
        <AuditScreen />
      </PanelOpenProvider>
    </Suspense>
  );
}
