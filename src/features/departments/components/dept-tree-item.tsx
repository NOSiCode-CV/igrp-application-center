import {
  cn,
  IGRPIcon,
  IGRPDropdownMenuPrimitive,
  IGRPDropdownMenuTriggerPrimitive,
  IGRPDropdownMenuContentPrimitive,
  IGRPDropdownMenuItemPrimitive,
  IGRPDropdownMenuSeparatorPrimitive,
  IGRPButtonPrimitive,
  IGRPTooltipPrimitive,
  IGRPTooltipTriggerPrimitive,
  IGRPTooltipContentPrimitive,
  IGRPTooltipProviderPrimitive,
} from "@igrp/igrp-framework-react-design-system";

import React from "react";
import type { DepartmentArgs } from "../dept-schemas";

type DepartmentWithChildren = DepartmentArgs & {
  children?: DepartmentWithChildren[];
};

const DepartmentTreeItem = ({
  dept,
  level = 0,
  setSelectedDeptCode,
  selectedDeptCode,
  handleEdit,
  handleCreateSubDept,
  handleDelete,
  expandedDepts,
  setExpandedDepts,
}: {
  dept: DepartmentWithChildren;
  level?: number;
  setSelectedDeptCode: React.Dispatch<React.SetStateAction<string | null>>;
  selectedDeptCode: string | null;
  handleEdit: (dept: DepartmentWithChildren) => void;
  handleCreateSubDept: (parentCode: any) => void;
  handleDelete: (code: string, name: string) => void;
  expandedDepts: Set<string>;
  setExpandedDepts: React.Dispatch<React.SetStateAction<Set<string>>>;
}) => {
  const hasChildren = dept.children && dept.children.length > 0;
  const isExpanded = expandedDepts.has(dept.code);
  const isSelected = selectedDeptCode === dept.code;

  const isActive = dept.status === "ACTIVE";

  const toggleExpand = (code: string) => {
    const newExpanded = new Set(expandedDepts);
    if (newExpanded.has(code)) {
      newExpanded.delete(code);
    } else {
      newExpanded.add(code);
    }
    setExpandedDepts(newExpanded);
  };

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-2 px-3 py-2.5 my-1.5 rounded-sm text-sm transition-all cursor-pointer",
          isSelected
            ? "bg-accent/50 text-primary font-medium"
            : isActive
              ? "border-accent text-foreground bg-accent/20"
              : "border-accent text-foreground bg-accent/20",
        )}
        onClick={() => {
          if (hasChildren) toggleExpand(dept.code);
        }}
        style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
      >
        <button className="w-4 h-4 flex items-center justify-center shrink-0">
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
          onClick={() => setSelectedDeptCode(dept.code)}
          className="flex items-center gap-2 flex-1 min-w-0"
        >
          <div className="relative">
            <IGRPIcon
              iconName={isExpanded ? "FolderOpen" : "Folder"}
              className={cn(
                "w-4 h-4 shrink-0",
                !isActive && "opacity-50"
              )}
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
          <IGRPTooltipProviderPrimitive delayDuration={350}>
            <IGRPTooltipPrimitive>
              <IGRPTooltipTriggerPrimitive asChild>
                <IGRPButtonPrimitive
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => handleCreateSubDept(dept)}
                >
                  <span className="sr-only">Criar Sub-departamento</span>
                  <IGRPIcon
                    iconName="Plus"
                    className="w-4 h-4"
                    strokeWidth={2}
                  />
                </IGRPButtonPrimitive>
              </IGRPTooltipTriggerPrimitive>
              <IGRPTooltipContentPrimitive className="px-2 py-1 text-xs">
                Criar Sub-departamento
              </IGRPTooltipContentPrimitive>
            </IGRPTooltipPrimitive>
          </IGRPTooltipProviderPrimitive>

          <IGRPDropdownMenuPrimitive>
            <IGRPDropdownMenuTriggerPrimitive asChild>
              <IGRPButtonPrimitive
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
              </IGRPButtonPrimitive>
            </IGRPDropdownMenuTriggerPrimitive>

            <IGRPDropdownMenuContentPrimitive
              onCloseAutoFocus={(e) => e.preventDefault()}
              align="end"
            >
              <IGRPDropdownMenuItemPrimitive
                onSelect={(e) => {
                  e.stopPropagation();
                  handleEdit(dept);
                }}
              >
                <IGRPIcon
                  iconName="Pencil"
                  className="w-4 h-4 mr-2"
                  strokeWidth={2}
                />
                Editar
              </IGRPDropdownMenuItemPrimitive>

              <IGRPDropdownMenuItemPrimitive
                onSelect={(e) => {
                  e.stopPropagation();
                  handleCreateSubDept(dept);
                }}
              >
                <IGRPIcon
                  iconName="FolderPlus"
                  className="w-4 h-4 mr-2"
                  strokeWidth={2}
                />
                Criar Sub-departamento
              </IGRPDropdownMenuItemPrimitive>

              <IGRPDropdownMenuSeparatorPrimitive />

              <IGRPDropdownMenuItemPrimitive
                variant="destructive"
                onClick={() => handleDelete(dept.code, dept.name)}
              >
                <IGRPIcon
                  iconName="Trash"
                  className="w-4 h-4 mr-2"
                  strokeWidth={2}
                />
                Eliminar
              </IGRPDropdownMenuItemPrimitive>
            </IGRPDropdownMenuContentPrimitive>
          </IGRPDropdownMenuPrimitive>
        </div>
      </div>

      {hasChildren &&
        isExpanded &&
        dept.children?.map((child) => (
          <DepartmentTreeItem
            key={child.code}
            dept={child}
            level={level + 1}
            setSelectedDeptCode={setSelectedDeptCode}
            selectedDeptCode={selectedDeptCode}
            handleEdit={handleEdit}
            handleCreateSubDept={handleCreateSubDept}
            handleDelete={handleDelete}
            expandedDepts={expandedDepts}
            setExpandedDepts={setExpandedDepts}
          />
        ))}
    </div>
  );
};

export default DepartmentTreeItem;