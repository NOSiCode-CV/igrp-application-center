import { IGRPApplicationArgs } from '@igrp/framework-next-types';
import { IGRP_MOCK_APPS_DATA } from './apps';

export const getMockApps = (appCode?: string): { mockApps: IGRPApplicationArgs[] } => {
  console.log({ appCode });
  return {
    mockApps: IGRP_MOCK_APPS_DATA,
  };
};
