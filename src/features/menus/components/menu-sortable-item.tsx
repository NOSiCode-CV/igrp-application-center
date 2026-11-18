"use client";

import { useState } from "react";

import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type {
  IGRPMenuItemArgs,
  IGRPMenuType,
} from "@igrp/framework-next-types";
import {
  Badge,
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";

import { useStatusLabel } from "@/i18n/status";

import { useMenuTree } from "./menu-tree-context";

interface SortableMenuItemProps {
  menu: IGRPMenuItemArgs;
  depth?: number;
  /** Whether this is the last child of its parent (draws └ instead of ├). */
  isLast?: boolean;
  /** Per ancestor level above the parent: whether its rail keeps running. */
  rails?: boolean[];
}

const MENU_TYPE_ICON: Partial<Record<IGRPMenuType, string>> = {
  GROUP: "FolderTree",
  FOLDER: "Folder",
  MENU_PAGE: "FileText",
  EXTERNAL_PAGE: "ExternalLink",
};

/** Tree geometry in px: the drag-handle gutter and one indent level. */
const GUTTER = 40;
const INDENT = 24;
const railX = (level: number) => GUTTER + level * INDENT + INDENT / 2;

/** Page destination for the row meta; "#" is a placeholder, not a route. */
function pageRoute(menu: IGRPMenuItemArgs) {
  if (menu.pageSlug) return menu.pageSlug;
  return menu.url && menu.url !== "#" ? menu.url : "";
}

export function SortableMenuItem({
  menu,
  depth = 0,
  isLast = false,
  rails = [],
}: SortableMenuItemProps) {
  const t = useTranslations("menus.item");
  const statusLabel = useStatusLabel();
  const {
    app,
    allMenus,
    onView,
    onEdit,
    onDelete,
    onAddChild,
    onAddInternalPage,
  } = useMenuTree();
  const [isExpanded, setIsExpanded] = useState(true);

  const subMenus = allMenus.filter((m) => m.parentCode === menu.code);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
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

  const isContainer = menu.type === "GROUP" || menu.type === "FOLDER";
  const isInactive = menu.status === "INACTIVE";
  const hasChildren = subMenus.length > 0;
  const showChildren = isExpanded && hasChildren;

  const sortedSubMenus = [...subMenus].sort(
    (
      a: IGRPMenuItemArgs & { sortOrder?: number },
      b: IGRPMenuItemArgs & { sortOrder?: number },
    ) => {
      const aOrder = a.position ?? a.sortOrder ?? 0;
      const bOrder = b.position ?? b.sortOrder ?? 0;
      return aOrder - bOrder;
    },
  );
  const childRails = depth === 0 ? [] : [...rails, !isLast];
  const route = isContainer ? "" : pageRoute(menu);

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "group relative flex min-h-12 items-center bg-background transition-colors hover:bg-muted/40",
          isDragging && "z-10 opacity-80 shadow-sm",
          isContainer &&
            isOver &&
            !isDragging &&
            "ring-2 ring-inset ring-primary",
        )}
      >
        {/* Tree rails: ancestors that continue, then the elbow into this row. */}
        {rails.map(
          (continues, level) =>
            continues && (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: one rail per fixed level
                key={level}
                aria-hidden
                className="pointer-events-none absolute inset-y-0 w-px bg-border"
                style={{ left: railX(level) }}
              />
            ),
        )}
        {depth > 0 && (
          <>
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute top-0 w-px bg-border",
                isLast ? "h-1/2" : "h-full",
              )}
              style={{ left: railX(depth - 1) }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute top-1/2 h-px bg-border"
              style={{ left: railX(depth - 1), width: INDENT / 2 }}
            />
          </>
        )}
        {showChildren && (
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-0 top-[calc(50%+0.75rem)] w-px bg-border"
            style={{ left: railX(depth) }}
          />
        )}

        <button
          {...attributes}
          {...listeners}
          className="flex shrink-0 cursor-grab items-center justify-center self-stretch text-muted-foreground/50 transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring group-hover:text-muted-foreground active:cursor-grabbing"
          style={{ width: GUTTER }}
          type="button"
          aria-label={t("drag")}
        >
          <IGRPIcon
            iconName="GripVertical"
            className="size-4"
            strokeWidth={2}
          />
        </button>

        <div
          className="flex min-w-0 flex-1 items-center gap-2 py-2"
          style={{ paddingLeft: depth * INDENT }}
        >
          {hasChildren ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-6 shrink-0 p-0"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-label={isExpanded ? t("collapse") : t("expand")}
              aria-expanded={isExpanded}
            >
              <IGRPIcon
                iconName="ChevronDown"
                strokeWidth={2}
                className={cn(
                  "size-4 transition-transform motion-reduce:transition-none",
                  !isExpanded && "-rotate-90",
                )}
              />
            </Button>
          ) : (
            <span aria-hidden className="size-6 shrink-0" />
          )}

          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-md",
              menu.type === "GROUP"
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground",
            )}
          >
            <IGRPIcon
              iconName={MENU_TYPE_ICON[menu.type] ?? "FileText"}
              className="size-4"
              strokeWidth={2}
            />
          </span>

          <div className="flex min-w-0 flex-1 items-baseline gap-3">
            <span
              className={cn(
                "truncate text-sm",
                menu.type === "GROUP" && "font-semibold",
                menu.type === "FOLDER" && "font-medium",
                isInactive && "text-muted-foreground",
              )}
            >
              {menu.name}
            </span>
            {isContainer ? (
              <span className="shrink-0 text-xs text-muted-foreground">
                {t("childCount", { count: subMenus.length })}
              </span>
            ) : (
              <span
                className={cn(
                  "truncate text-xs text-muted-foreground",
                  !route && "italic",
                )}
              >
                {route || t("noUrl")}
              </span>
            )}
            {isInactive && (
              <Badge variant="outline" className="shrink-0 text-xs">
                {statusLabel(menu.status)}
              </Badge>
            )}
          </div>
        </div>

        <div className="mr-2 flex shrink-0 items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="size-8 p-0">
                <span className="sr-only">{t("openActions")}</span>
                <IGRPIcon
                  iconName="Ellipsis"
                  strokeWidth={2}
                  className="size-4"
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(menu)}>
                <IGRPIcon
                  iconName="Eye"
                  className="size-4 mr-2"
                  strokeWidth={2}
                />
                {t("view")}
              </DropdownMenuItem>
              {String(app?.type) !== "SYSTEM" && (
                <>
                  <DropdownMenuItem onClick={() => onEdit(menu)}>
                    <IGRPIcon
                      iconName="Pencil"
                      className="size-4 mr-2"
                      strokeWidth={2}
                    />
                    {t("edit")}
                  </DropdownMenuItem>

                  {menu.type === "GROUP" && (
                    <DropdownMenuItem onClick={() => onAddChild?.(menu)}>
                      <IGRPIcon iconName="FolderPlus" className="size-4 mr-2" />
                      {t("addFolder")}
                    </DropdownMenuItem>
                  )}

                  {(menu.type === "GROUP" || menu.type === "FOLDER") && (
                    <DropdownMenuItem onClick={() => onAddInternalPage?.(menu)}>
                      <IGRPIcon iconName="FileText" className="size-4 mr-2" />
                      {t("addPage")}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onDelete?.(menu.code, menu.name)}
                  >
                    <IGRPIcon
                      iconName="Trash"
                      className="size-4 mr-2"
                      strokeWidth={2}
                    />
                    {t("delete")}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {showChildren && (
        <SortableContext
          items={sortedSubMenus.map((m) => m.code)}
          strategy={verticalListSortingStrategy}
        >
          <div>
            {sortedSubMenus.map((child, index) => (
              <SortableMenuItem
                key={child.code}
                menu={child}
                depth={depth + 1}
                isLast={index === sortedSubMenus.length - 1}
                rails={childRails}
              />
            ))}
          </div>
        </SortableContext>
      )}
    </>
  );
}
