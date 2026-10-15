"use client";

import { createContext, use } from "react";

import type { IGRPMenuItemArgs } from "@igrp/framework-next-types";
import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";

export interface MenuTreeContextValue {
  app: ApplicationDTO;
  allMenus: IGRPMenuItemArgs[];
  onView(menu: IGRPMenuItemArgs): void;
  onEdit(menu: IGRPMenuItemArgs): void;
  onDelete?(code: string, name: string): void;
  onAddChild?(menu: IGRPMenuItemArgs): void;
  onAddInternalPage(menu: IGRPMenuItemArgs): void;
  onAddExternalPage(menu: IGRPMenuItemArgs): void;
}

export const MenuTreeContext = createContext<MenuTreeContextValue | null>(null);

export function useMenuTree(): MenuTreeContextValue {
  const ctx = use(MenuTreeContext);
  if (!ctx)
    throw new Error("useMenuTree must be used within <MenuTreeContext>");
  return ctx;
}
