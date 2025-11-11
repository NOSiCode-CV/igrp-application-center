import type {
  IGRPMenuItemArgs,
} from "@igrp/framework-next-types";
import type {
  ApiResponse,
  MenuEntryDTO,
} from "@igrp/platform-access-management-client-ts";

export const mapperMenuCRUD = (
  menu: ApiResponse<MenuEntryDTO>,
): IGRPMenuItemArgs => {
  if (!menu.data) return {} as IGRPMenuItemArgs;
  return menu.data as IGRPMenuItemArgs;
};
export const mapperListMenusCRUD = (
  menus: ApiResponse<MenuEntryDTO[]>,
): IGRPMenuItemArgs[] => {
  if (!menus.data) return [];
  return menus.data as IGRPMenuItemArgs[]
};
