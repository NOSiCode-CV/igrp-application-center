import { IGRPLayout } from "@igrp/framework-next";
import type { IGRPLayoutConfigArgs } from "@igrp/framework-next-types";
import { createConfig } from "@igrp/template-config";
import { redirect } from "next/navigation";
import { configLayout } from "@/actions/igrp/layout";
import { getCurrentUser } from "@/actions/user";

/** SDK Status enum does not yet model TEMPORARY — cast until it does */
const TEMPORARY_STATUS = "TEMPORARY";

export default async function HomeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  if (
    user.success &&
    (user.data?.status as string | undefined) === TEMPORARY_STATUS
  ) {
    redirect("/invite/pending");
  }

  const layoutConfig = await configLayout();
  const config = await createConfig(layoutConfig as IGRPLayoutConfigArgs);

  return <IGRPLayout config={config}>{children}</IGRPLayout>;
}
