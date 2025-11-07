import {
  cn,
  IGRPBadgePrimitive,
  IGRPButtonPrimitive,
  IGRPDropdownMenuContentPrimitive,
  IGRPDropdownMenuItemPrimitive,
  IGRPDropdownMenuLabelPrimitive,
  IGRPDropdownMenuPrimitive,
  IGRPDropdownMenuSeparatorPrimitive,
  IGRPDropdownMenuTriggerPrimitive,
  IGRPIcon,
  IGRPTableCellPrimitive,
  IGRPTableRowPrimitive,
} from "@igrp/igrp-framework-react-design-system";
import { RoleWithChildren } from "./role-tree-list";
import { showStatus, statusClass } from "@/lib/utils";

export function RoleTreeRow({
  role,
  level = 0,
  handlePermissions,
  expandedRoles,
  handleNewSubRole,
  handleEdit,
  handleDelete,
  toggleExpand,
}: {
  role: RoleWithChildren;
  level?: number;
  handlePermissions: (role: RoleWithChildren) => void;
  expandedRoles: Set<string>;
  handleNewSubRole: (role: RoleWithChildren) => void;
  handleEdit: (role: RoleWithChildren) => void;
  handleDelete: (roleCode: string) => void;
  toggleExpand: (roleCode: string) => void;
}) {
  const hasChildren = role.children && role.children.length > 0;
  const isExpanded = expandedRoles.has(role.code);

  return (
    <>
      <IGRPTableRowPrimitive className={cn(level > 0 && "bg-muted/30")}>
        <IGRPTableCellPrimitive className="font-medium">
          <div
            className="flex items-center gap-2"
            style={{ paddingLeft: `${level * 1.5}rem` }}
          >
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(role.code)}
                className="w-5 h-5 flex items-center justify-center hover:bg-accent rounded transition-colors"
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
            ) : (
              <div className="w-5" />
            )}

            <IGRPIcon
              iconName="ShieldCheck"
              className="w-4 h-4 text-primary shrink-0"
              strokeWidth={2}
            />

            <span>{role.name}</span>
          </div>
        </IGRPTableCellPrimitive>

        <IGRPTableCellPrimitive>
          {role.description || "N/A"}
        </IGRPTableCellPrimitive>

        <IGRPTableCellPrimitive className="whitespace-nowrap">
          <IGRPBadgePrimitive
            className={cn(statusClass(role.status), "capitalize")}
          >
            {showStatus(role.status)}
          </IGRPBadgePrimitive>
        </IGRPTableCellPrimitive>

        <IGRPTableCellPrimitive>
          <IGRPDropdownMenuPrimitive>
            <IGRPDropdownMenuTriggerPrimitive asChild>
              <IGRPButtonPrimitive variant="ghost" className="size-8 p-0">
                <span className="sr-only">Abrir Menu</span>
                <IGRPIcon
                  iconName="Ellipsis"
                  className="size-4"
                  strokeWidth={2}
                />
              </IGRPButtonPrimitive>
            </IGRPDropdownMenuTriggerPrimitive>
            <IGRPDropdownMenuContentPrimitive align="end">
              <IGRPDropdownMenuLabelPrimitive>
                Ações
              </IGRPDropdownMenuLabelPrimitive>
              <IGRPDropdownMenuItemPrimitive onSelect={() => handleEdit(role)}>
                <IGRPIcon
                  iconName="Pencil"
                  className="mr-2 size-4"
                  strokeWidth={2}
                />
                Editar
              </IGRPDropdownMenuItemPrimitive>
              <IGRPDropdownMenuItemPrimitive
                onSelect={() => handleNewSubRole(role)}
              >
                <IGRPIcon
                  iconName="Plus"
                  className="mr-2 size-4"
                  strokeWidth={2}
                />
                Criar sub perfil
              </IGRPDropdownMenuItemPrimitive>
              <IGRPDropdownMenuItemPrimitive
                onSelect={() => handlePermissions(role)}
              >
                <IGRPIcon
                  iconName="ShieldCheck"
                  className="mr-2 size-4"
                  strokeWidth={2}
                />
                Permissões
              </IGRPDropdownMenuItemPrimitive>
              <IGRPDropdownMenuSeparatorPrimitive />
              <IGRPDropdownMenuItemPrimitive
                onClick={() => handleDelete(role.code)}
                variant="destructive"
              >
                <IGRPIcon
                  iconName="Trash"
                  className="mr-2 size-4"
                  strokeWidth={2}
                />
                Eliminar
              </IGRPDropdownMenuItemPrimitive>
            </IGRPDropdownMenuContentPrimitive>
          </IGRPDropdownMenuPrimitive>
        </IGRPTableCellPrimitive>
      </IGRPTableRowPrimitive>

      {hasChildren &&
        isExpanded &&
        role.children?.map((child) => (
          <RoleTreeRow
            key={child.code}
            role={child}
            level={level + 1}
            handlePermissions={handlePermissions}
            expandedRoles={expandedRoles}
            handleNewSubRole={handleNewSubRole}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            toggleExpand={toggleExpand}
          />
        ))}
    </>
  );
}
