import {
  cn,
  IGRPCheckboxPrimitive,
  IGRPIcon,
  IGRPTableCellPrimitive,
  IGRPTableRowPrimitive,
} from "@igrp/igrp-framework-react-design-system";
import { useState } from "react";
import { MenuWithChildren } from "./dept-menu";
import { getMenuIcon } from "@/lib/utils";

const MenuTreeRow = ({
  menu,
  level = 0,
  setMenuRoleAssignments,
  roles,
  menuRoleAssignments,
}: {
  menu: MenuWithChildren;
  level?: number;
  setMenuRoleAssignments: React.Dispatch<
    React.SetStateAction<Map<string, Set<string>>>
  >;
  roles?: { name: string, code: string }[];
  menuRoleAssignments: Map<string, Set<string>>;
}) => {
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  const hasChildren = menu.children && menu.children.length > 0;
  const isExpanded = expandedMenus.has(menu.code);

  const toggleMenuRole = (menuCode: string, roleCode: string) => {
    setMenuRoleAssignments((prev) => {
      const newMap = new Map(prev);
      const currentRoles = new Set(newMap.get(menuCode) || []);

      if (currentRoles.has(roleCode)) {
        currentRoles.delete(roleCode);
      } else {
        currentRoles.add(roleCode);
      }

      newMap.set(menuCode, currentRoles);
      return newMap;
    });
  };

  const toggleExpand = (menuCode: string) => {
    setExpandedMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(menuCode)) {
        newSet.delete(menuCode);
      } else {
        newSet.add(menuCode);
      }
      return newSet;
    });
  };

  return (
    <>
      <IGRPTableRowPrimitive className={cn(level > 0 && "bg-muted/20")}>
        <IGRPTableCellPrimitive>
          <div
            className="flex items-center gap-2"
            style={{ paddingLeft: `${level * 1.5}rem` }}
          >
            {hasChildren && (
              <button
                onClick={() => toggleExpand(menu.code)}
                className="w-5 h-5 flex items-center justify-center hover:bg-accent rounded transition-colors shrink-0"
              >
                <IGRPIcon
                  iconName="ChevronRight"
                  className={cn(
                    "w-4 h-4 transition-transform",
                    isExpanded && "rotate-90"
                  )}
                  strokeWidth={2}
                />
              </button>
            )}

            <IGRPIcon
              iconName={getMenuIcon(menu.type)}
              className="w-4 h-4 text-primary shrink-0"
              strokeWidth={2}
            />

            <div className="min-w-0 flex-1">
              <div className="font-medium truncate">{menu.name}</div>
              {menu.url && (
                <div className="text-xs text-muted-foreground truncate">
                  {menu.url}
                </div>
              )}
            </div>
          </div>
        </IGRPTableCellPrimitive>

        {roles?.map((role) => (
          <IGRPTableCellPrimitive
            key={role.name}
            className="text-center border-l"
          >
            <div className="flex items-center justify-center">
            <IGRPCheckboxPrimitive
  checked={menuRoleAssignments.get(menu.code)?.has(role.code) ?? false}
  onCheckedChange={() => toggleMenuRole(menu.code, role.code)}
/>
            </div>
          </IGRPTableCellPrimitive>
        ))}
      </IGRPTableRowPrimitive>

      {hasChildren &&
        isExpanded &&
        menu.children?.map((child) => (
          <MenuTreeRow 
            key={child.code} 
            menu={child} 
            level={level + 1}
            setMenuRoleAssignments={setMenuRoleAssignments}
            roles={roles}
            menuRoleAssignments={menuRoleAssignments}
          />
        ))}
    </>
  );
};

export default MenuTreeRow;