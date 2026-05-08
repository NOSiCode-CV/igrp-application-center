import "server-only";

import {
  igrpGetAccessClient,
  igrpResetAccessClientConfig,
} from "@igrp/framework-next";
import { serverSession } from "@/lib/auth";

export async function getClientAccess() {
  igrpResetAccessClientConfig();
  await serverSession();
  return await igrpGetAccessClient();
}
