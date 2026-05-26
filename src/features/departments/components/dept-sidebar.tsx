"use client";

import {
  Button,
  Drawer,
  DrawerContent,
  DrawerTitle,
  IGRPIcon,
  Sheet,
  SheetContent,
  SheetTitle,
} from "@igrp/igrp-framework-react-design-system";
import type { DepartmentWithChildren } from "../dept-tree-utils";
import { DepartmentSidebarContent } from "./dept-sidebar-content";

interface Props {
  filtered: DepartmentWithChildren[];
  searchTerm: string;
  onSearchChange(value: string): void;
  onCreate(): void;
  isOpen: boolean;
  onOpenChange(open: boolean): void;
  isFiltering: boolean;
  counts: { active: number; inactive: number };
}

export function DepartmentSidebar({
  filtered,
  searchTerm,
  onSearchChange,
  onCreate,
  isOpen,
  onOpenChange,
  isFiltering,
  counts,
}: Props) {
  const contentProps = {
    filtered,
    searchTerm,
    onSearchChange,
    onCreate,
    isFiltering,
    counts,
  };

  return (
    <>
      {/* Hamburger trigger — visible only below lg */}
      <div className="block lg:hidden mb-4">
        <Button
          onClick={() => onOpenChange(true)}
          variant="outline"
          className="w-full"
          aria-label="Abrir lista de departamentos"
        >
          <IGRPIcon iconName="Menu" className="w-4 h-4" strokeWidth={2} />
          Departamentos
        </Button>
      </div>

      {/* < sm: Drawer (bottom sheet) */}
      <div className="sm:hidden">
        <Drawer open={isOpen} onOpenChange={onOpenChange}>
          <DrawerContent className="max-h-[90vh] p-4">
            <DrawerTitle className="sr-only">Departamentos</DrawerTitle>
            <DepartmentSidebarContent {...contentProps} />
          </DrawerContent>
        </Drawer>
      </div>

      {/* sm – lg: Sheet (left side) */}
      <div className="hidden sm:block lg:hidden">
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
          <SheetContent side="left" className="w-80 p-4">
            <SheetTitle className="sr-only">Departamentos</SheetTitle>
            <DepartmentSidebarContent {...contentProps} />
          </SheetContent>
        </Sheet>
      </div>

      {/* lg+: static aside */}
      <aside className="hidden lg:flex lg:flex-col w-80 pr-2 border-accent overflow-y-auto">
        <DepartmentSidebarContent {...contentProps} />
      </aside>
    </>
  );
}
