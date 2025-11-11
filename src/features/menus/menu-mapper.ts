import type {
  IGRPMenuCRUDArgs,
  IGRPMenuTypeCRUD,
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
  type: menu.type as IGRPMenuTypeCRUD,
  position: menu.position,
  icon: menu.icon || undefined,
  status: menu.status as IGRPStatus,
  target: menu.target as IGRPTargetType,
  url: menu.url,
  pageSlug: menu.pageSlug,
  application: { code: menu.application.code },
  roles: menu.roles,
  parent: { code: menu.parent.code} ,
});

export const mapperMenuCRUD = (
  menu: ApiResponse<MenuEntryDTO>,
): IGRPMenuCRUDArgs => {
  if (!menu.data) return {} as IGRPMenuCRUDArgs;
  return menu.data;
};
export const mapperListMenusCRUD = (
  menus: ApiResponse<MenuEntryDTO[]>,
): IGRPMenuCRUDArgs[] => {
  if (!menus.data) return [];
  return menus.data //.map(mapMenuCRUD);
};
