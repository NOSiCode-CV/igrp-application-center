"use client";

import {
  Button,
  IGRPIcon,
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
}

export function DepartmentSidebar({
  filtered,
  searchTerm,
  onSearchChange,
  onCreate,
  isOpen,
  onOpenChange,
  isFiltering,
}: Props) {
  const contentProps = {
    filtered,
    searchTerm,
    onSearchChange,
    onCreate,
    isFiltering,
  };

  return (
    <>
      <div className="block lg:hidden mb-4">
        <Button
          onClick={() => onOpenChange(!isOpen)}
          variant="outline"
          className="w-full"
        >
          <IGRPIcon
            iconName={isOpen ? "X" : "Menu"}
            className="w-4 h-4"
            strokeWidth={2}
          />
          {isOpen ? "Fechar" : "Departamentos"}
        </Button>
      </div>

      <aside
        className={`${isOpen ? "block" : "hidden"} lg:block
          fixed lg:relative inset-0 lg:inset-auto
          z-50 lg:z-auto
          w-full lg:w-80
          bg-background
          overflow-y-auto
          border-accent
          p-4 lg:p-0 lg:pr-2`}
      >
        <div className="flex lg:hidden justify-end mb-2">
          <Button
            onClick={() => onOpenChange(false)}
            variant="ghost"
            size="sm"
          >
            <IGRPIcon iconName="X" className="w-5 h-5" strokeWidth={2} />
          </Button>
        </div>
        <DepartmentSidebarContent {...contentProps} />
      </aside>

      {isOpen && (
        <button
          type="button"
          aria-label="Fechar menu de departamentos"
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => onOpenChange(false)}
        />
      )}
    </>
  );
}
