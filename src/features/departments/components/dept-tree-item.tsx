import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IGRPIcon,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@igrp/igrp-framework-react-design-system";
import type React from "react";
import type { DepartmentWithChildren } from "../dept-tree-utils";
import { useDeptTree } from "./dept-tree-context";

interface Props {
  dept: DepartmentWithChildren;
  level?: number;
}

const DepartmentTreeItem = ({ dept, level = 0 }: Props) => {
  const { selectedCode, expanded, select, toggle, onEdit, onCreateSub, onDelete } =
    useDeptTree();

  const hasChildren = !!dept.children?.length;
  const isExpanded = expanded.has(dept.code);
  const isSelected = selectedCode === dept.code;
  const isActive = dept.status === "ACTIVE";

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-2 px-3 py-2.5 my-1.5 rounded-sm text-sm transition-all",
          isSelected
            ? "bg-accent/50 text-primary font-medium"
            : "border-accent text-foreground bg-accent/20",
        )}
        style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
      >
        <button
          type="button"
          className="w-4 h-4 flex items-center justify-center shrink-0 disabled:cursor-default"
          onClick={() => hasChildren && toggle(dept.code)}
          disabled={!hasChildren}
          aria-expanded={hasChildren ? isExpanded : undefined}
          aria-label={
            hasChildren
              ? isExpanded
                ? "Recolher departamento"
                : "Expandir departamento"
              : undefined
          }
        >
          {hasChildren ? (
            <IGRPIcon
              iconName="ChevronRight"
              className={cn(
                "w-3.5 h-3.5 transition-transform",
                isExpanded && "rotate-90",
              )}
              strokeWidth={2}
            />
          ) : (
            <div className="w-3.5" />
          )}
        </button>

        <button
          type="button"
          onClick={() => select(dept.code)}
          className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
        >
          <div className="relative">
            <IGRPIcon
              iconName={isExpanded ? "FolderOpen" : "Folder"}
              className={cn("w-4 h-4 shrink-0", !isActive && "opacity-50")}
              strokeWidth={2}
            />
            {!isActive && (
              <div className="absolute -right-0.5 -bottom-0.5 w-2 h-2 rounded-full bg-red-500/50 border border-background" />
            )}
          </div>
          <span className="flex-1 text-left truncate font-medium">
            {dept.name}
          </span>
        </button>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => onCreateSub(dept)}
              >
                <span className="sr-only">Criar Sub-departamento</span>
                <IGRPIcon iconName="Plus" className="w-4 h-4" strokeWidth={2} />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="px-2 py-1 text-xs">
              Criar Sub-departamento
            </TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              >
                <span className="sr-only">Abrir menu</span>
                <IGRPIcon
                  iconName="EllipsisVertical"
                  className="w-4 h-4"
                  strokeWidth={2}
                />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              onCloseAutoFocus={(e) => e.preventDefault()}
              align="end"
            >
              <DropdownMenuItem onSelect={() => onEdit(dept)}>
                <IGRPIcon iconName="Pencil" className="w-4 h-4 mr-2" strokeWidth={2} />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onCreateSub(dept)}>
                <IGRPIcon iconName="FolderPlus" className="w-4 h-4 mr-2" strokeWidth={2} />
                Criar Sub-departamento
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => onDelete(dept.code, dept.name)}
              >
                <IGRPIcon iconName="Trash" className="w-4 h-4 mr-2" strokeWidth={2} />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {hasChildren &&
        isExpanded &&
        dept.children?.map((child) => (
          <DepartmentTreeItem key={child.code} dept={child} level={level + 1} />
        ))}
    </div>
  );
};

export default DepartmentTreeItem;
