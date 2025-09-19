import { igrpGetAccessClient, igrpResetAccessClientConfig } from '@igrp/framework-next';
import { serverSession } from './igrp/auth';

export async function getClientAccess() {
  igrpResetAccessClientConfig();
  await serverSession();
  return await igrpGetAccessClient();
}
