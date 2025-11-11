
import type { IGRPMenuCRUDArgs } from "@igrp/framework-next-types";
import {
  IGRPBadgePrimitive,
  IGRPButtonPrimitive,
  IGRPDropdownMenuContentPrimitive,
  IGRPDropdownMenuItemPrimitive,
  IGRPDropdownMenuPrimitive,
  IGRPDropdownMenuSeparatorPrimitive,
  IGRPDropdownMenuTriggerPrimitive,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SortableMenuItemProps {
  menu: IGRPMenuCRUDArgs;
  onView: (menu: IGRPMenuCRUDArgs) => void;
  onEdit: (menu: IGRPMenuCRUDArgs) => void;
  onDelete?: (code: string, name: string) => void;
  depth?: number;
  isChild?: boolean;
  subMenus?: IGRPMenuCRUDArgs[];
  allMenus?: IGRPMenuCRUDArgs[];
}

const MENU_TYPE_CONFIG = {
  GROUP: {
    icon: "FolderTree" as const,
    label: "Grupo",
    color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30",
  },
  FOLDER: {
    icon: "Folder" as const,
    label: "Pasta",
    color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30",
  },
  MENU_PAGE: {
    icon: "FileText" as const,
    label: "Página",
    color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
  },
  EXTERNAL_PAGE: {
    icon: "ExternalLink" as const,
    label: "Externo",
    color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30",
  },
} as const;

export function SortableMenuItem({
  menu,
  onView,
  onEdit,
  onDelete,
  depth = 0,
  isChild = false,
  subMenus,
  allMenus,
}: SortableMenuItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: menu.code,
    data: { menu },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const typeConfig = MENU_TYPE_CONFIG[menu.type] || MENU_TYPE_CONFIG.MENU_PAGE;
  const hasChildren = subMenus && subMenus.length > 0;

  return (
    <>
      <div
        ref={setNodeRef}
        style={{
          ...style,
          paddingLeft: `${(depth + 1) * 1.5}rem`,
        }}
        className={cn(
          "group relative flex items-center justify-between border-b last:border-0 bg-background transition-all",
          isDragging && "opacity-50 z-50",
          isChild && "bg-muted/30",
        )}
      >
        {isChild && (
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
        )}

        <div className="flex items-center gap-3 flex-1 py-3">
          {hasChildren ? (
            <IGRPButtonPrimitive
              variant="ghost"
              size="icon"
              className="h-7 w-7 p-0 shrink-0"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <IGRPIcon
                iconName={isExpanded ? "ChevronDown" : "ChevronRight"}
                strokeWidth={2}
                className="size-4"
              />
            </IGRPButtonPrimitive>
          ) : (
            <div className="w-7 shrink-0" />
          )}

          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded-md shrink-0"
            type="button"
          >
            <IGRPIcon
              iconName="GripVertical"
              className="size-4 text-muted-foreground"
              strokeWidth={2}
            />
          </button>

          <div className="flex items-center justify-center size-8 rounded-md bg-primary/10 shrink-0">
            <IGRPIcon
              iconName={menu.icon || "AppWindow"}
              className="size-4 text-primary"
              strokeWidth={2}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium truncate">{menu.name}</h4>
              {menu.status === "INACTIVE" && (
                <IGRPBadgePrimitive variant="secondary" className="text-xs">
                  Inativo
                </IGRPBadgePrimitive>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {menu.pageSlug || menu.url || "Sem URL"}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-md", typeConfig.color)}>
              <IGRPIcon
                iconName={typeConfig.icon}
                className="size-3.5"
                strokeWidth={2}
              />
              <span className="text-xs font-medium">{typeConfig.label}</span>
            </div>

            <IGRPDropdownMenuPrimitive>
              <IGRPDropdownMenuTriggerPrimitive asChild>
                <IGRPButtonPrimitive variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Abrir menu</span>
                  <IGRPIcon iconName="Ellipsis" strokeWidth={2} className="size-4" />
                </IGRPButtonPrimitive>
              </IGRPDropdownMenuTriggerPrimitive>
              <IGRPDropdownMenuContentPrimitive align="end">
                <IGRPDropdownMenuItemPrimitive onClick={() => onView(menu)}>
                  <IGRPIcon iconName="Eye" className="size-4 mr-2" strokeWidth={2} />
                  Ver
                </IGRPDropdownMenuItemPrimitive>
                <IGRPDropdownMenuItemPrimitive onClick={() => onEdit(menu)}>
                  <IGRPIcon iconName="Pencil" className="size-4 mr-2" strokeWidth={2} />
                  Editar
                </IGRPDropdownMenuItemPrimitive>
                <IGRPDropdownMenuSeparatorPrimitive />
                <IGRPDropdownMenuItemPrimitive
                  variant="destructive"
                  onClick={() => onDelete?.(menu.code, menu.name)}
                >
                  <IGRPIcon iconName="Trash" className="size-4 mr-2" strokeWidth={2} />
                  Eliminar
                </IGRPDropdownMenuItemPrimitive>
              </IGRPDropdownMenuContentPrimitive>
            </IGRPDropdownMenuPrimitive>
          </div>
        </div>
      </div>

      {isExpanded && hasChildren && (
        <div>
          {subMenus.map((child) => {
            const childSubMenus = allMenus?.filter(
              (m) => m.parent?.code === child.code
            ) || [];

            return (
              <SortableMenuItem
                key={child.code}
                menu={child}
                onEdit={onEdit}
                onDelete={onDelete}
                onView={onView}
                depth={depth + 1}
                isChild={true}
                subMenus={childSubMenus}
                allMenus={allMenus}
              />
            );
          })}
        </div>
      )}
    </>
  );
}