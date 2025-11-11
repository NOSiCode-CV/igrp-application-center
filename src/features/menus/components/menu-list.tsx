// menu-list.tsx

"use client";

import type { IGRPApplicationArgs, IGRPMenuCRUDArgs } from "@igrp/framework-next-types";
import {
  IGRPButtonPrimitive,
  IGRPCardContentPrimitive,
  IGRPCardDescriptionPrimitive,
  IGRPCardHeaderPrimitive,
  IGRPCardPrimitive,
  IGRPCardTitlePrimitive,
  IGRPIcon,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/button-link";
import { AppCenterLoading } from "@/components/loading";
import { useMenus } from "@/features/menus/use-menus";
import { statusSchema } from "@/schemas/global";
import { MenuDeleteDialog } from "./menu-delete-dialog";
import { MenuFormDialog } from "./menu-form-dialog";
import { SortableMenuItem } from "./menu-sortable-item";

export function MenuList({ app }: { app: IGRPApplicationArgs }) {
  const { code } = app;
  const {
    data: appMenus,
    isLoading,
    error: errorGetMenus,
  } = useMenus({ applicationCode: code });

  const [menus, setMenus] = useState<IGRPMenuCRUDArgs[]>([]);
  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [openTypeFormDialog, setOpenTypeFormDialog] = useState<"edit" | "view" | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<IGRPMenuCRUDArgs | undefined>();
  const [menuToDelete, setMenuToDelete] = useState<{
    code: string;
    name: string;
  } | null>(null);

  const { igrpToast } = useIGRPToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    if (appMenus) {
      setMenus(appMenus);
    }
  }, [appMenus]);

  if (isLoading) return <AppCenterLoading descrption="A carregar menus..." />;

  if (errorGetMenus) {
    return (
      <div className="rounded-md border py-6">
        <p className="text-center">Ocorreu um erro ao carregar menus.</p>
        <p className="text-center">{errorGetMenus.message}</p>
      </div>
    );
  }

  function handleView(menu: IGRPMenuCRUDArgs) {
    setSelectedMenu(menu);
    setOpenFormDialog(true);
    setOpenTypeFormDialog("view");
  }

  const handleEdit = (menu: IGRPMenuCRUDArgs) => {
    setSelectedMenu(menu);
    setOpenFormDialog(true);
    setOpenTypeFormDialog("edit");
  };

  const handleDelete = (code: string, name: string) => {
    setMenuToDelete({ code, name });
    setDeleteDialogOpen(true);
  };

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    setMenus((items) => {
      const oldIndex = items.findIndex((item) => item.code === active.id);
      const newIndex = items.findIndex((item) => item.code === over.id);

      const reordered = arrayMove(items, oldIndex, newIndex);

      const updated = reordered.map((item, index) => ({
        ...item,
        position: index,
      }));

      igrpToast({
        type: "info",
        title: "Ordem atualizada",
        description: "A ordem dos menus foi reorganizada.",
      });

      return updated;
    });
  }

  const filteredMenus = menus.filter(
    (menu) => menu.status !== statusSchema.enum.DELETED,
  );

  const groupMenus = filteredMenus.filter(
    (menu) => !menu.parent?.code && menu.type === "GROUP",
  );

  const folderMenus = filteredMenus.filter((menu) => menu.type === "FOLDER");

  const rootMenus = filteredMenus.filter((menu) => !menu.parent?.code);
  const menuEmpty = filteredMenus.length === 0;

  return (
    <>
      <IGRPCardPrimitive className="overflow-hidden card-hover gap-3 py-6">
        <IGRPCardHeaderPrimitive>
          <div className="flex items-center justify-between">
            <div>
              <IGRPCardTitlePrimitive>
                Menus da Aplicação
              </IGRPCardTitlePrimitive>
              <IGRPCardDescriptionPrimitive>
                Gerir e reorganizar os menus desta aplicação.
              </IGRPCardDescriptionPrimitive>
            </div>
            {!menuEmpty && (
              <div className="flex justify-end">
                <ButtonLink
                  onClick={() => {
                    setSelectedMenu(undefined);
                    setOpenFormDialog(true);
                    setOpenTypeFormDialog(undefined);
                  }}
                  icon="ListPlus"
                  href="#"
                  label="Novo Menu"
                />
              </div>
            )}
          </div>
        </IGRPCardHeaderPrimitive>

        <IGRPCardContentPrimitive>
          <div className="rounded-md border">
            {menuEmpty ? (
              <div className="text-center py-12 px-4">
                <div className="flex justify-center mb-4">
                  <div className="p-4 rounded-full bg-muted">
                    <IGRPIcon
                      iconName="ListTree"
                      className="size-10 text-muted-foreground"
                      strokeWidth={1.5}
                    />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Nenhum menu encontrado
                </h3>
                <p className="text-muted-foreground mb-6">
                  Comece criando o primeiro menu para esta aplicação.
                </p>
                <IGRPButtonPrimitive
                  onClick={() => {
                    setSelectedMenu(undefined);
                    setOpenFormDialog(true);
                    setOpenTypeFormDialog(undefined);
                  }}
                  variant="default"
                >
                  <IGRPIcon iconName="Plus" className="mr-2 size-4" />
                  Criar Primeiro Menu
                </IGRPButtonPrimitive>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={rootMenus.map((m) => m.code)}
                  strategy={verticalListSortingStrategy}
                >
                  <div>
                    {rootMenus.map((menu) => {
                      const childMenus = filteredMenus.filter(
                        (m) => m.parent?.code === menu.code,
                      );

                      return (
                        <SortableMenuItem
                          key={menu.code}
                          menu={menu}
                          onView={handleView}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          subMenus={childMenus}
                          allMenus={filteredMenus}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </IGRPCardContentPrimitive>
      </IGRPCardPrimitive>

      <MenuFormDialog
        open={openFormDialog}
        onOpenChange={(open) => {
          setOpenFormDialog(open);
          if (!open) {
            setSelectedMenu(undefined);
            setOpenTypeFormDialog(undefined);
          }
        }}
        menu={selectedMenu}
        setMenus={setMenus}
        groupMenus={groupMenus}
        folderMenus={folderMenus}
        appCode={app.code}
        openType={openTypeFormDialog}
      />

      {menuToDelete && (
        <MenuDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          menuToDelete={menuToDelete}
        />
      )}
    </>
  );
}