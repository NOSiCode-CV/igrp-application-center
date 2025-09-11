import { IGRPMenuItemArgs } from '@igrp/framework-next-types';
import { IGRP_DEFAULT_MENU } from './menus';

export const getMockMenus = (appCode?: string): { mockMenus: IGRPMenuItemArgs[] } => {
  console.log({ appCode });
  return {
    mockMenus: IGRP_DEFAULT_MENU,
  };
};
