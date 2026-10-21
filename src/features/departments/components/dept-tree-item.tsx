import type { MouseEvent } from "react";

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
import { useTranslations } from "next-intl";

import type { DepartmentWithChildren } from "../dept-tree-utils";
import { useDeptTree } from "./dept-tree-context";

interface Props {
  dept: DepartmentWithChildren;
  level?: number;
  /** Codes of ancestors in the current render path — guards against cycles. */
  ancestorCodes?: ReadonlySet<string>;
}

const DepartmentTreeItem = ({ dept, level = 0, ancestorCodes }: Props) => {
  const t = useTranslations("departments");
  const {
    selectedCode,
    expanded,
    searchActive,
    select,
    toggle,
    onEdit,
    onCreateSub,
    onDelete,
  } = useDeptTree();

  const hasChildren = !!dept.children?.length;
  // During an active search the filtered tree is shown fully expanded so
  // nested matches aren't hidden behind collapsed parents.
  const isExpanded = searchActive || expanded.has(dept.code);
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
          className="size-7 -my-1 flex items-center justify-center shrink-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default"
          onClick={() => hasChildren && toggle(dept.code)}
          disabled={!hasChildren || searchActive}
          aria-expanded={hasChildren ? isExpanded : undefined}
          aria-label={
            hasChildren
              ? isExpanded
                ? t("tree.collapse")
                : t("tree.expand")
              : undefined
          }
        >
          {hasChildren ? (
            <IGRPIcon
              iconName="ChevronRight"
              aria-hidden
              className={cn(
                "size-3.5 transition-transform motion-reduce:transition-none",
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
          aria-current={isSelected ? "page" : undefined}
          className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {!isActive && (
            <>
              <span
                aria-hidden
                className="size-1.5 rounded-full bg-muted-foreground shrink-0"
              />
              <span className="sr-only">{t("tree.inactive")}</span>
            </>
          )}
          <span className="flex-1 text-left truncate">{dept.name}</span>
        </button>

        <div className="opacity-70 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity motion-reduce:transition-none">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="size-8 p-0"
                onClick={(e: MouseEvent) => e.stopPropagation()}
                aria-label={t("tree.openMenu")}
              >
                <IGRPIcon
                  iconName="EllipsisVertical"
                  aria-hidden
                  className="size-4"
                  strokeWidth={2}
                />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onEdit(dept)}>
                <IGRPIcon
                  iconName="Pencil"
                  aria-hidden
                  className="size-4 mr-2"
                  strokeWidth={2}
                />
                {t("actions.edit")}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onCreateSub(dept)}>
                <IGRPIcon
                  iconName="FolderPlus"
                  aria-hidden
                  className="size-4 mr-2"
                  strokeWidth={2}
                />
                {t("tree.createSub")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => onDelete(dept.code, dept.name)}
              >
                <IGRPIcon
                  iconName="Trash"
                  aria-hidden
                  className="size-4 mr-2"
                  strokeWidth={2}
                />
                {t("tree.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {hasChildren &&
        isExpanded &&
        dept.children?.map((child) =>
          // Skip any child already in the render path — guards against a
          // malformed cycle (e.g. A→B→A) causing infinite recursion.
          ancestorCodes?.has(child.code) ? null : (
            <DepartmentTreeItem
              key={child.code}
              dept={child}
              level={level + 1}
              ancestorCodes={new Set(ancestorCodes ?? []).add(dept.code)}
            />
          ),
        )}
    </div>
  );
};

export default DepartmentTreeItem;
