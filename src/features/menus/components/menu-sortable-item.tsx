import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
import { useState } from "react";
import { cn, lowerCaseWithSpace } from "@/lib/utils";
import { menuTypeSchema } from "../menu-schemas";

interface SortableItemProps {
  menuCode: string;
  menu: IGRPMenuCRUDArgs;
  code: string;
  onView: (menu: IGRPMenuCRUDArgs) => void;
  onEdit: (menu: IGRPMenuCRUDArgs) => void;
  onDelete?: (code: string, name: string) => void;
  depth?: number;
  isChild?: boolean;
  subMenus?: IGRPMenuCRUDArgs[];
}

export function SortableItem({
  menuCode,
  menu,
  code,
  onView,
  onEdit,
  onDelete,
  depth = 0,
  isChild = false,
  subMenus,
}: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: menuCode,
      data: {
        type: "menu-item",
        parent: menu.parentCode,
        isChild,
      },
    });
  const [isExpanded, setIsExpanded] = useState(true);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "flex items-center justify-between p-3 border-b last:border-0",
          isChild && "pl-6 bg-muted/20",
        )}
        data-parent={menu.parentCode}
      >
        <div className="flex items-center gap-2">
          {!isChild && (
            <IGRPButtonPrimitive
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6 p-0 invisible",
                subMenus && subMenus.length > 0 && "visible",
              )}
              onClick={
                subMenus && subMenus.length > 0
                  ? () => setIsExpanded(!isExpanded)
                  : undefined
              }
            >
              <IGRPIcon
                iconName={isExpanded ? "ChevronDown" : "ChevronRight"}
                strokeWidth={2}
              />
            </IGRPButtonPrimitive>
          )}

          <IGRPButtonPrimitive
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 rounded-md hover:bg-muted"
            variant="ghost"
            size="icon"
          >
            <IGRPIcon
              iconName="GripVertical"
              className="size-4 text-primary"
              strokeWidth={2}
            />
          </IGRPButtonPrimitive>

          <div>
            <div className="font-medium">{menu.name}</div>
            <div className="text-sm text-muted-foreground">
              {menu.pageSlug ?? menu.url}
            </div>
            <div className="text-sm text-muted-foreground">
              {menu.pageSlug ?? menu.url}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <IGRPBadgePrimitive
            variant="secondary"
            className={
              menu.type === menuTypeSchema.enum.FOLDER
                ? "text-secondary bg-secondary-foreground"
                : "text-muted bg-muted-foreground"
            }
          >
            {lowerCaseWithSpace(menu.type)}
          </IGRPBadgePrimitive>
          <IGRPDropdownMenuPrimitive>
            <IGRPDropdownMenuTriggerPrimitive asChild>
              <IGRPButtonPrimitive variant="ghost" className="h-7 w-7 p-0">
                <span className="sr-only">Abrir menu</span>
                <IGRPIcon iconName="Ellipsis" strokeWidth={2} />
              </IGRPButtonPrimitive>
            </IGRPDropdownMenuTriggerPrimitive>
            <IGRPDropdownMenuContentPrimitive align="end">
              <IGRPDropdownMenuItemPrimitive onClick={() => onView(menu)}>
                <IGRPIcon
                  iconName="Eye"
                  className="size-4 mr-0.5"
                  strokeWidth={2}
                />
                Ver
              </IGRPDropdownMenuItemPrimitive>
              <IGRPDropdownMenuItemPrimitive onClick={() => onEdit(menu)}>
                <IGRPIcon
                  iconName="Pencil"
                  className="size-4 mr-0.5"
                  strokeWidth={2}
                />
                Editar
              </IGRPDropdownMenuItemPrimitive>
              <IGRPDropdownMenuSeparatorPrimitive />
              <IGRPDropdownMenuItemPrimitive
                variant="destructive"
                className=""
                onClick={() => onDelete?.(menu.code, menu.name)}
              >
                <IGRPIcon
                  iconName="Trash"
                  className="size-4 mr-0.5"
                  strokeWidth={2}
                />
                Eliminar
              </IGRPDropdownMenuItemPrimitive>
            </IGRPDropdownMenuContentPrimitive>
          </IGRPDropdownMenuPrimitive>
        </div>
      </div>
      {isExpanded && subMenus && subMenus.length > 0 && (
        <div className="border-l-2 ml-8 pl-2">
          {subMenus.map((child) => (
            <SortableItem
              key={`${child.id}-${child.code}`}
              menuCode={child.code}
              menu={child}
              code={code}
              onEdit={onEdit}
              onDelete={onDelete}
              depth={depth + 1}
              isChild={true}
              onView={onView}
            />
          ))}
        </div>
      )}
    </>
  );
}
