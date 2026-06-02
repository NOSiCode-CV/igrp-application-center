import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";
import type { MouseEvent } from "react";
import type { DepartmentWithChildren } from "../dept-tree-utils";
import { useDeptTree } from "./dept-tree-context";

interface Props {
  dept: DepartmentWithChildren;
  level?: number;
}

const DepartmentTreeItem = ({ dept, level = 0 }: Props) => {
  const {
    selectedCode,
    expanded,
    select,
    toggle,
    onEdit,
    onCreateSub,
    onDelete,
  } = useDeptTree();

  const hasChildren = !!dept.children?.length;
  const isExpanded = expanded.has(dept.code);
  const isSelected = selectedCode === dept.code;
  const isActive = dept.status === "ACTIVE";

  return (
    <div style={{ contentVisibility: "auto", containIntrinsicSize: "40px" }}>
      <div
        className={cn(
          "group flex items-center gap-2 px-3 py-2 my-0.5 rounded-full text-sm transition-colors",
          isSelected
            ? "bg-accent text-accent-foreground font-medium"
            : "hover:bg-accent/60 text-foreground",
          !isActive && !isSelected && "text-muted-foreground",
        )}
        style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
      >
        <button
          type="button"
          className="size-4 flex items-center justify-center shrink-0 disabled:cursor-default"
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
          {!isActive && (
            <span
              aria-hidden
              className="size-1.5 rounded-full bg-muted-foreground shrink-0"
            />
          )}
          <span className="flex-1 text-left truncate">{dept.name}</span>
        </button>

        <div className="opacity-40 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={(e: MouseEvent) => e.stopPropagation()}
                aria-label="Abrir menu"
              >
                <IGRPIcon
                  iconName="EllipsisVertical"
                  className="size-4"
                  strokeWidth={2}
                />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              onCloseAutoFocus={(e) => e.preventDefault()}
              align="end"
            >
              <DropdownMenuItem onSelect={() => onEdit(dept)}>
                <IGRPIcon
                  iconName="Pencil"
                  className="size-4 mr-2"
                  strokeWidth={2}
                />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onCreateSub(dept)}>
                <IGRPIcon
                  iconName="FolderPlus"
                  className="size-4 mr-2"
                  strokeWidth={2}
                />
                Criar Sub-departamento
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => onDelete(dept.code, dept.name)}
              >
                <IGRPIcon
                  iconName="Trash"
                  className="size-4 mr-2"
                  strokeWidth={2}
                />
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
