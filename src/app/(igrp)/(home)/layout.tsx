import { IGRPLayoutFull } from "@igrp/framework-next";
import type { IGRPLayoutConfigArgs } from "@igrp/framework-next-types";
import { createConfig } from "@igrp/template-config";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/user";
import { getLayoutConfig } from "@/lib/dal";

/** SDK Status enum does not yet model TEMPORARY — cast until it does */
const TEMPORARY_STATUS = "TEMPORARY";

export default async function HomeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [user, layoutConfig] = await Promise.all([
    getCurrentUser(),
    getLayoutConfig(),
  ]);

  if (
    user.success &&
    (user.data?.status as string | undefined) === TEMPORARY_STATUS
  ) {
    redirect("/invite/pending");
  }

  const config = await createConfig(layoutConfig as IGRPLayoutConfigArgs);

  return (
    <IGRPLayoutFull config={config} showSidebar={false}>
      <div className="container mx-auto max-w-7xl">{children}</div>
    </IGRPLayoutFull>
  );
}
