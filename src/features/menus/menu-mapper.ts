import type {
  IGRPMenuCRUDArgs,
  IGRPStatus,
  IGRPTargetType,
} from "@igrp/framework-next-types";
import type {
  ApiResponse,
  MenuEntryDTO,
} from "@igrp/platform-access-management-client-ts";

const mapMenuCRUD = (menu: MenuEntryDTO): IGRPMenuCRUDArgs => ({
  id: menu.id as number,
  code: menu.code,
  name: menu.name,
  type: menu.type,
  position: menu.position,
  icon: menu.icon || undefined,
  status: menu.status as IGRPStatus,
  target: menu.target as IGRPTargetType,
  url: menu.url,
  pageSlug: menu.pageSlug,
  applicationCode: menu.applicationCode,
  roles: menu.roles,
  parentCode: menu.parentCode,
});

export const mapperMenuCRUD = (
  menu: ApiResponse<MenuEntryDTO>,
): IGRPMenuCRUDArgs => {
  if (!menu.data) return {} as IGRPMenuCRUDArgs;
  return mapMenuCRUD(menu.data);
};
export const mapperListMenusCRUD = (
  menus: ApiResponse<MenuEntryDTO[]>,
): IGRPMenuCRUDArgs[] => {
  if (!menus.data) return [];
  return menus.data.map(mapMenuCRUD);
};
