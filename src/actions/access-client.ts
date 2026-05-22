import "server-only";

import { AccessManagementClient } from "@igrp/platform-access-management-client-ts";
import { redirect } from "next/navigation";
import { serverSession } from "@/lib/auth";

export async function getClientAccess() {
  const session = await serverSession();
  if (!session) {
    redirect("/login");
  }

  return AccessManagementClient.create({
    baseUrl: process.env.IGRP_ACCESS_MANAGEMENT_API ?? "",
    timeout: 10_000,
    headers: {
      Authorization: `Bearer ${session.accessToken as string}`,
    },
  });
}
