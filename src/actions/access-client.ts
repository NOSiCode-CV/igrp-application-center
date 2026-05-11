import "server-only";

import {
  igrpGetAccessClient,
  igrpSetAccessClientConfig,
} from "@igrp/framework-next";
import { redirect } from "next/navigation";
import { serverSession } from "@/lib/auth";

export async function getClientAccess() {
  const session = await serverSession();
  if (!session) {
    redirect("/login");
  }
  // React.cache does not share state across Server Action invocations, so
  // the side-effect from serverSession() cannot be relied upon here.
  igrpSetAccessClientConfig({
    token: session.accessToken as string,
    baseUrl: process.env.IGRP_ACCESS_MANAGEMENT_API ?? "",
  });
  return await igrpGetAccessClient();
}
