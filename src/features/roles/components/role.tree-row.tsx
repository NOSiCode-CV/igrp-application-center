import {
  Badge,
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IGRPIcon,
  TableCell,
  TableRow,
} from "@igrp/igrp-framework-react-design-system";

import { showStatus, statusClass } from "@/lib/app-utilities";

import { useRoleTree } from "./role-tree-context";
import type { RoleWithChildren } from "./role-tree-list";

export function RoleTreeRow({
  role,
  level = 0,
  ancestorCodes,
}: {
  role: RoleWithChildren;
  level?: number;
  ancestorCodes?: ReadonlySet<string>;
}) {
  const {
    expandedRoles,
    toggleExpand,
    handleEdit,
    handleNewSubRole,
    handlePermissions,
    handleDelete,
  } = useRoleTree();
  const hasChildren = role.children && role.children.length > 0;
  const isExpanded = expandedRoles.has(role.code);

  return (
    <>
      <TableRow className={cn(level > 0 && "bg-muted/30")}>
        <TableCell className="font-medium">
          <div
            className="flex items-center gap-2"
            style={{ paddingLeft: `${level * 1.5}rem` }}
          >
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(role.code)}
                className="size-5 flex items-center justify-center hover:bg-accent rounded transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                type="button"
                aria-expanded={isExpanded}
                aria-label={isExpanded ? "Recolher perfil" : "Expandir perfil"}
              >
                <IGRPIcon
                  iconName="ChevronRight"
                  aria-hidden
                  className={cn(
                    "size-4 transition-transform motion-reduce:transition-none",
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
              aria-hidden
              className="size-4 text-primary shrink-0"
              strokeWidth={2}
            />

            <span>{role.name}</span>
          </div>
        </TableCell>

        <TableCell>{role.description || "N/A"}</TableCell>

        <TableCell className="whitespace-nowrap">
          <Badge className={cn(statusClass(role.status), "capitalize")}>
            {showStatus(role.status)}
          </Badge>
        </TableCell>

        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="size-8 p-0">
                <span className="sr-only">Abrir Menu</span>
                <IGRPIcon
                  iconName="Ellipsis"
                  aria-hidden
                  className="size-4"
                  strokeWidth={2}
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => handleEdit(role)}>
                <IGRPIcon
                  iconName="Pencil"
                  aria-hidden
                  className="mr-2 size-4"
                  strokeWidth={2}
                />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleNewSubRole(role)}>
                <IGRPIcon
                  iconName="Plus"
                  aria-hidden
                  className="mr-2 size-4"
                  strokeWidth={2}
                />
                Criar sub perfil
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handlePermissions(role)}>
                <IGRPIcon
                  iconName="ShieldCheck"
                  aria-hidden
                  className="mr-2 size-4"
                  strokeWidth={2}
                />
                Permissões
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDelete(role.code)}
                variant="destructive"
              >
                <IGRPIcon
                  iconName="Trash"
                  aria-hidden
                  className="mr-2 size-4"
                  strokeWidth={2}
                />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      {hasChildren &&
        isExpanded &&
        role.children?.map((child) =>
          // Skip any child already in the render path — guards against a
          // malformed cycle causing infinite recursion.
          ancestorCodes?.has(child.code) ? null : (
            <RoleTreeRow
              key={child.code}
              role={child}
              level={level + 1}
              ancestorCodes={new Set(ancestorCodes ?? []).add(role.code)}
            />
          ),
        )}
    </>
  );
}
