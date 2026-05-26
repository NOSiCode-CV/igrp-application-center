"use client";

import {
  Button,
  IGRPIcon,
  Input,
  TooltipProvider,
} from "@igrp/igrp-framework-react-design-system";
import { ButtonLink } from "@/components/button-link";
import type { DepartmentWithChildren } from "../dept-tree-utils";
import { DepartmentEmptyState } from "./dept-empty-state";
import DepartmentTreeItem from "./dept-tree-item";

interface Props {
  filtered: DepartmentWithChildren[];
  searchTerm: string;
  onSearchChange(value: string): void;
  onCreate(): void;
  isOpen: boolean;
  onOpenChange(open: boolean): void;
}

export function DepartmentSidebar({
  filtered,
  searchTerm,
  onSearchChange,
  onCreate,
  isOpen,
  onOpenChange,
}: Props) {
  return (
    <>
      <div className="block lg:hidden mb-4">
        <Button
          onClick={() => onOpenChange(!isOpen)}
          variant="outline"
          className="w-full cursor-pointer"
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
          flex pr-0 lg:pr-2 border-accent flex-col
          p-4 lg:p-0`}
      >
        <div className="flex lg:hidden justify-end mb-2">
          <Button
            onClick={() => onOpenChange(false)}
            variant="ghost"
            size="sm"
            className="cursor-pointer"
          >
            <IGRPIcon iconName="X" className="w-5 h-5" strokeWidth={2} />
          </Button>
        </div>

        <div className="flex flex-col min-w-0">
          <h2 className="text-xl font-bold tracking-tight truncate">
            Gestão de Departamentos
          </h2>
          <p className="text-muted-foreground text-sm mb-4">
            Ver e gerir todos os departamentos do sistema.
          </p>
          <ButtonLink
            onClick={onCreate}
            icon="Plus"
            href="#"
            label="Novo Departamento"
          />
        </div>

        <div className="mt-4">
          <div className="relative">
            <IGRPIcon
              iconName="Search"
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground"
            />
            <Input
              type="text"
              placeholder="Pesquisar departamento..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-background pl-8"
            />
          </div>
        </div>

        <div className="flex-1 mt-3 overflow-y-auto min-h-[200px]">
          <TooltipProvider delayDuration={350}>
            {filtered.length === 0 ? (
              <DepartmentEmptyState
                variant={searchTerm ? "sidebar-no-results" : "sidebar-empty"}
              />
            ) : (
              filtered.map((dept) => (
                <DepartmentTreeItem key={dept.code} dept={dept} />
              ))
            )}
          </TooltipProvider>
        </div>
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
