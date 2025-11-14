import type { IGRPMenuItemArgs } from "@igrp/framework-next-types";
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
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

interface SortableMenuItemProps {
  menu: IGRPMenuItemArgs;
  onView: (menu: IGRPMenuItemArgs) => void;
  onEdit: (menu: IGRPMenuItemArgs) => void;
  onDelete?: (code: string, name: string) => void;
  onAddChild?: (menu: IGRPMenuItemArgs) => void;
  depth?: number;
  isChild?: boolean;
  subMenus?: IGRPMenuItemArgs[];
  allMenus?: IGRPMenuItemArgs[];
  appCode?: string;
  onAddInternalPage: any
  onAddExternalPage: any
}

const MENU_TYPE_CONFIG = {
  GROUP: {
    icon: "FolderTree" as const,
    label: "Grupo",
  },
  FOLDER: {
    icon: "Folder" as const,
    label: "Pasta",
  },
  MENU_PAGE: {
    icon: "FileText" as const,
    label: "Página",
  },
  EXTERNAL_PAGE: {
    icon: "ExternalLink" as const,
    label: "Externo",
  },
} as any;

export function SortableMenuItem({
  menu,
  onView,
  onEdit,
  onDelete,
  onAddChild,
  depth = 0,
  isChild = false,
  subMenus,
  allMenus,
   onAddInternalPage,
  onAddExternalPage,
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
    data: {
      menu,
      depth,
      parentCode: menu.parentCode ?? null,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const typeConfig = MENU_TYPE_CONFIG[menu.type] || MENU_TYPE_CONFIG.MENU_PAGE;
  const hasChildren = subMenus && subMenus.length > 0;

  const sortedSubMenus = subMenus
    ? [...subMenus].sort((a: any, b: any) => {
      const aOrder = a.position ?? a.sortOrder ?? 0;
      const bOrder = b.position ?? b.sortOrder ?? 0;
      return aOrder - bOrder;
    })
    : [];

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "group relative flex items-center justify-between border-b last:border-b-0 bg-background transition-all",
          isDragging && "opacity-50 z-50",
          isChild && "bg-muted/30",
        )}
      >
        <div className="flex items-center gap-3 flex-1 py-3 pl-3">
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

          {/* <div style={{ width: `${depth * 1.5}rem` }} className="shrink-0" /> */}

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

          <div className="flex items-center justify-center size-8 rounded-md bg-muted shrink-0">
            <IGRPIcon
              iconName={typeConfig.icon}
              className="size-4 text-muted-foreground"
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
            {typeConfig?.label === "Página" && (
              <p className="text-sm text-muted-foreground truncate">
                {menu.pageSlug || menu.url || "Sem URL"}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 mr-3 shrink-0">
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
                {menu.type === 'GROUP' && (
                  <IGRPDropdownMenuItemPrimitive onClick={() => onAddChild?.(menu)} >
                    <IGRPIcon iconName="FolderPlus" className="size-4" />
                    Adicionar Pasta
                  </IGRPDropdownMenuItemPrimitive>
                )}

                {menu.type === 'FOLDER' && (
  <>
    <IGRPDropdownMenuItemPrimitive onClick={() => onAddInternalPage?.(menu)}>
      <IGRPIcon iconName="FileText" className="size-4 mr-2" />
      Adicionar Página Interna
    </IGRPDropdownMenuItemPrimitive>
    
    <IGRPDropdownMenuItemPrimitive onClick={() => onAddExternalPage?.(menu)}>
      <IGRPIcon iconName="ExternalLink" className="size-4 mr-2" />
      Adicionar Página Externa
    </IGRPDropdownMenuItemPrimitive>
  </>
)}

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
        <SortableContext
          items={sortedSubMenus.map((m) => m.code)}
          strategy={verticalListSortingStrategy}
        >
          <div>
            {sortedSubMenus.map((child) => {
              const childSubMenus =
                allMenus?.filter((m) => m.parentCode === child.code) || [];

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
                  onAddExternalPage={onAddExternalPage}
                  onAddInternalPage={onAddInternalPage}
                />
              );
            })}
          </div>
        </SortableContext>
      )}
    </>
  );
}