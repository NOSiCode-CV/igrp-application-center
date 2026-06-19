"use client";

import type { Route } from "next";
import Link from "next/link";

import { cn, IGRPIcon } from "@igrp/igrp-framework-react-design-system";

type Department = {
  id: number;
  code: string;
  name: string;
  description: string;
  status: string;
  icon: string | null;
  parentCode: string | null;
};

type DepartmentWithChildren = Department & {
  children?: DepartmentWithChildren[];
};

const DepartmentTreeItemSimple = ({
  dept,
  level = 0,
  expandedDepts,
  setExpandedDepts,
  ancestorCodes,
}: {
  dept: DepartmentWithChildren;
  level?: number;
  expandedDepts: Set<string>;
  setExpandedDepts: React.Dispatch<React.SetStateAction<Set<string>>>;
  ancestorCodes?: ReadonlySet<string>;
}) => {
  const hasChildren = dept.children && dept.children.length > 0;
  const isExpanded = expandedDepts.has(dept.code);
  const isActive = dept.status === "ACTIVE";

  const toggleExpand = () => {
    const newExpanded = new Set(expandedDepts);
    if (newExpanded.has(dept.code)) {
      newExpanded.delete(dept.code);
    } else {
      newExpanded.add(dept.code);
    }
    setExpandedDepts(newExpanded);
  };

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-2 px-3 py-2.5 my-1.5 rounded-sm text-sm transition-all",
          isActive
            ? "text-foreground bg-accent/20"
            : "text-foreground bg-accent/20 opacity-60",
        )}
        style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
      >
        <button
          onClick={toggleExpand}
          className="size-4 flex items-center justify-center shrink-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default"
          type="button"
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
              aria-hidden
              className={cn(
                "w-3.5 h-3.5 transition-transform motion-reduce:transition-none",
                isExpanded && "rotate-90",
              )}
              strokeWidth={2}
            />
          ) : (
            <div className="w-3.5" />
          )}
        </button>

        <Link
          href={"/departments" as Route}
          className="flex items-center gap-2 flex-1 min-w-0 hover:text-primary transition-colors"
        >
          <div className="relative">
            <IGRPIcon
              iconName={isExpanded ? "FolderOpen" : "Folder"}
              aria-hidden
              className={cn("size-4 shrink-0", !isActive && "opacity-50")}
              strokeWidth={2}
            />
            {!isActive && (
              <div className="absolute -right-0.5 -bottom-0.5 size-2 rounded-full bg-destructive/50 border border-background" />
            )}
          </div>
          <span className="flex-1 text-left truncate font-medium">
            {dept.name}
          </span>
        </Link>
      </div>

      {hasChildren &&
        isExpanded &&
        dept.children?.map((child) =>
          // Skip any child already in the render path — guards against a
          // malformed cycle causing infinite recursion.
          ancestorCodes?.has(child.code) ? null : (
            <DepartmentTreeItemSimple
              key={child.code}
              dept={child}
              level={level + 1}
              expandedDepts={expandedDepts}
              setExpandedDepts={setExpandedDepts}
              ancestorCodes={new Set(ancestorCodes ?? []).add(dept.code)}
            />
          ),
        )}
    </div>
  );
};

export default DepartmentTreeItemSimple;
