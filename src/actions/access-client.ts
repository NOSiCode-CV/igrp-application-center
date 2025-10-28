import { getAccessToken } from "@/lib/auth-helpers";
import {
  igrpGetAccessClient,
  igrpResetAccessClientConfig,
  igrpSetAccessClientConfig,
} from "@igrp/framework-next";
//import { serverSession } from "./igrp/auth";

export async function getClientAccess() {
  igrpResetAccessClientConfig();
  const session = await getAccessToken();

  if (session !== null) {
    igrpSetAccessClientConfig({
      token: session.accessToken as string,
      baseUrl: process.env.IGRP_APP_MANAGER_API || "",
    });
  }

  return await igrpGetAccessClient();
}
