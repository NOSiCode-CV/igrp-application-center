import {
  cn,
  IGRPCheckboxPrimitive,
  IGRPIcon,
  IGRPTableCellPrimitive,
  IGRPTableRowPrimitive,
} from "@igrp/igrp-framework-react-design-system";
import { MenuWithChildren } from "./dept-menu";
import { getMenuIcon } from "@/lib/utils";

export function MenuTreeRow({
  menu,
  level = 0,
  menuRoleAssignments,
  setMenuRoleAssignments,
  roles,
  expandedMenus,
  setExpandedMenus,
}: {
  menu: MenuWithChildren;
  menuRoleAssignments: Map<string, Set<string>>;
  level?: number;
  setMenuRoleAssignments: React.Dispatch<
    React.SetStateAction<Map<string, Set<string>>>
  >;
  roles?: { name: string }[];
  expandedMenus: Set<string>;
  setExpandedMenus: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
  const hasChildren = menu.children && menu.children.length > 0;
  const isExpanded = expandedMenus.has(menu.code);
  const assignedRoles = menuRoleAssignments.get(menu.code) || new Set<string>();

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

  const toggleRoleForMenu = (menuCode: string, roleName: string) => {
    setMenuRoleAssignments((prev) => {
      const newMap = new Map(prev);
      const menuRoles = new Set(newMap.get(menuCode) || new Set<string>());

      if (menuRoles.has(roleName)) {
        menuRoles.delete(roleName);
      } else {
        menuRoles.add(roleName);
      }

      newMap.set(menuCode, menuRoles);
      return newMap;
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
                    isExpanded && "rotate-90",
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

            <div className="min-w-0">
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
          <IGRPTableCellPrimitive key={role.name} className="text-center">
            <div className="flex items-center justify-center">
              <IGRPCheckboxPrimitive
                checked={assignedRoles.has(role.name)}
                onCheckedChange={() => toggleRoleForMenu(menu.code, role.name)}
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
            menuRoleAssignments={menuRoleAssignments}
            setMenuRoleAssignments={setMenuRoleAssignments}
            roles={roles || []}
            expandedMenus={expandedMenus}
            setExpandedMenus={setExpandedMenus}
          />
        ))}
    </>
  );
}
