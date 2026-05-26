"use client";

import {
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
  isFiltering: boolean;
  counts: { active: number; inactive: number };
}

export function DepartmentSidebarContent({
  filtered,
  searchTerm,
  onSearchChange,
  onCreate,
  isFiltering,
  counts,
}: Props) {
  return (
    <div className="flex flex-col h-full min-w-0">
      <div className="flex flex-col min-w-0">
        <h2 className="text-xl font-bold tracking-tight truncate">
          Gestão de Departamentos
        </h2>
        <p className="text-muted-foreground text-sm mb-4">
          {counts.inactive > 0
            ? `${counts.active} ativos · ${counts.inactive} inativos`
            : `${counts.active} departamento${counts.active === 1 ? "" : "s"}`}
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
            className="w-full bg-background pl-8 pr-8"
          />
          {isFiltering && (
            <IGRPIcon
              iconName="LoaderCircle"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin"
              aria-label="A filtrar"
            />
          )}
        </div>
      </div>

      <div
        className={`flex-1 mt-3 overflow-y-auto min-h-[200px] transition-opacity ${
          isFiltering ? "opacity-70" : "opacity-100"
        }`}
      >
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
    </div>
  );
}
