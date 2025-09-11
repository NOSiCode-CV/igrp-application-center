import { IGRPMenuItemArgs } from '@igrp/framework-next-types';
import { IGRP_DEFAULT_MENU_FOOTER } from './menus-footer';

export const getMockMenusFooter = (appCode?: string): { mockMenusFooter: IGRPMenuItemArgs[] } => {
  console.log({ appCode });
  return {
    mockMenusFooter: IGRP_DEFAULT_MENU_FOOTER,
  };
};
