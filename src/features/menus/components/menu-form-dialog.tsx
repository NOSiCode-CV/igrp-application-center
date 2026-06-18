"use client";

import { useEffect, useMemo, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import type { IGRPMenuItemArgs } from "@igrp/framework-next-types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  IGRPButton,
  Input,
  ScrollArea,
  Switch,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import type { CreateMenuRequest } from "@igrp/platform-access-management-client-ts";
import { type Resolver, useForm } from "react-hook-form";

import {
  useCreateMenu,
  useUpdateMenu,
} from "@/features/applications/use-applications";
import { getNextMenuPosition } from "@/features/menus/menu-constants";
import {
  type CreateMenu,
  createMenuSchema,
  type MenuTypeArgs,
  menuTargetSchema,
  menuTypeSchema,
  normalizeMenu,
  type UpdateMenu,
  updateMenuSchema,
} from "@/features/menus/menu-schemas";
import { statusSchema } from "@/schemas/global";

import { MenuIconPicker } from "./menu-icon-picker";
import { MenuPageConfigFields } from "./menu-page-config-fields";
import { MenuParentCombobox } from "./menu-parent-combobox";
import { MenuTypeSelector } from "./menu-type-selector";

interface MenuFormDialogProps {
  appCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setMenus: React.Dispatch<React.SetStateAction<IGRPMenuItemArgs[]>>;
  allMenus: IGRPMenuItemArgs[];
  menu?: IGRPMenuItemArgs;
  groupMenus: IGRPMenuItemArgs[];
  folderMenus: IGRPMenuItemArgs[];
  openType?: "edit" | "view";
}

export function MenuFormDialog({
  appCode,
  open,
  onOpenChange,
  menu,
  groupMenus,
  folderMenus,
  allMenus,
  openType,
  setMenus,
}: MenuFormDialogProps) {
  const isEditMode = openType === "edit" && Boolean(menu?.code);
  const isPrefilledCreate = Boolean(menu) && !isEditMode;
  const [step, setStep] = useState<"type" | "form">(menu ? "form" : "type");
  const [createType, setCreateType] = useState<MenuTypeArgs>(
    menuTypeSchema.enum.GROUP,
  );

  useEffect(() => {
    if (!open) {
      setStep(menu ? "form" : "type");
      setCreateType(menuTypeSchema.enum.GROUP);
    }
  }, [open, menu]);

  const dialogTitle =
    openType === "view"
      ? "Visualizar Menu"
      : isEditMode
        ? "Editar Menu"
        : isPrefilledCreate
          ? menu?.type === "FOLDER"
            ? "Adicionar Pasta"
            : "Adicionar Menu"
          : "Novo Menu";

  const formKey = isEditMode
    ? `edit-${menu?.code}`
    : `create-${menu?.parentCode ?? "root"}-${step}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="py-4 px-0 sm:min-w-2xl ">
        <DialogHeader className="px-6">
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {isEditMode || isPrefilledCreate
              ? openType === "view"
                ? "Visualizar informações do menu"
                : isEditMode
                  ? "Atualizar os detalhes deste menu"
                  : "Preencha os detalhes do novo menu"
              : step === "type"
                ? "Selecione o tipo de menu que deseja criar"
                : "Preencha os detalhes do novo menu"}
          </DialogDescription>
        </DialogHeader>

        {step === "type" && !menu ? (
          <MenuTypeStep
            value={createType}
            onCancel={() => onOpenChange(false)}
            onSelect={(type) => {
              setCreateType(type);
              setStep("form");
            }}
          />
        ) : (
          <MenuFormBody
            key={formKey}
            appCode={appCode}
            allMenus={allMenus}
            menu={menu}
            initialType={createType}
            groupMenus={groupMenus}
            folderMenus={folderMenus}
            openType={openType}
            isEditMode={isEditMode}
            setMenus={setMenus}
            onOpenChange={onOpenChange}
            onBack={!menu ? () => setStep("type") : undefined}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function MenuTypeStep({
  value,
  onCancel,
  onSelect,
}: {
  value: MenuTypeArgs;
  onCancel: () => void;
  onSelect: (type: MenuTypeArgs) => void;
}) {
  return (
    <div className="px-6 py-4">
      <MenuTypeSelector
        value={value}
        onChange={(nextValue) => onSelect(nextValue as MenuTypeArgs)}
        disabled={false}
      />
      <div className="flex justify-end gap-2 mt-6">
        <IGRPButton
          type="button"
          variant="secondary"
          onClick={onCancel}
          showIcon
          iconName="X"
        >
          Cancelar
        </IGRPButton>
      </div>
    </div>
  );
}

interface MenuFormBodyProps {
  appCode: string;
  allMenus: IGRPMenuItemArgs[];
  menu?: IGRPMenuItemArgs;
  initialType: MenuTypeArgs;
  groupMenus: IGRPMenuItemArgs[];
  folderMenus: IGRPMenuItemArgs[];
  openType?: "edit" | "view";
  isEditMode: boolean;
  setMenus: React.Dispatch<React.SetStateAction<IGRPMenuItemArgs[]>>;
  onOpenChange: (open: boolean) => void;
  onBack?: () => void;
}

function MenuFormBody({
  appCode,
  allMenus,
  menu,
  initialType,
  groupMenus,
  folderMenus,
  openType,
  isEditMode,
  setMenus,
  onOpenChange,
  onBack,
}: MenuFormBodyProps) {
  const { igrpToast } = useIGRPToast();
  const { mutateAsync: createMenuAsync } = useCreateMenu();
  const { mutateAsync: updateMenu } = useUpdateMenu();
  const isViewMode = openType === "view";

  const defaultParentCode = menu?.parentCode ?? undefined;

  const form = useForm<CreateMenu>({
    resolver: zodResolver(
      isEditMode ? updateMenuSchema : createMenuSchema,
    ) as Resolver<CreateMenu>,
    defaultValues: {
      name: "",
      code: "",
      type: menuTypeSchema.enum.GROUP,
      position: 0,
      icon: "AppWindow",
      status: statusSchema.enum.ACTIVE,
      applicationCode: appCode,
      parentCode: defaultParentCode,
    } as CreateMenu,
  });

  const { reset } = form;
  const menuType = form.watch("type");
  const isLoading = form.formState.isSubmitting;

  const isPageType =
    menuType === menuTypeSchema.enum.MENU_PAGE ||
    menuType === menuTypeSchema.enum.EXTERNAL_PAGE;

  useEffect(() => {
    const parentCode = menu?.parentCode ?? undefined;
    const nextPosition = isEditMode
      ? (menu?.position ?? 0)
      : getNextMenuPosition(allMenus, parentCode);

    if (menu) {
      reset({
        name: menu.name ?? "",
        code: menu.code ?? "",
        type: (menu.type ?? menuTypeSchema.enum.GROUP) as MenuTypeArgs,
        position: nextPosition,
        icon: menu.icon ?? "AppWindow",
        status: menu.status ?? statusSchema.enum.ACTIVE,
        target: menu.target ?? menuTargetSchema.enum._self,
        url: menu.url ?? undefined,
        parentCode,
        applicationCode: menu.applicationCode ?? appCode,
        pageSlug: menu.pageSlug ?? undefined,
      } as CreateMenu);
      return;
    }

    reset({
      name: "",
      code: "",
      type: initialType,
      position: nextPosition,
      icon: "AppWindow",
      status: statusSchema.enum.ACTIVE,
      applicationCode: appCode,
    } as CreateMenu);
  }, [menu, appCode, allMenus, isEditMode, initialType, reset]);

  async function onSubmit(values: CreateMenu) {
    try {
      if (isEditMode && menu?.code) {
        const update = normalizeMenu(values as UpdateMenu);
        const result = await updateMenu({
          appCode,
          menuCode: menu.code,
          data: update,
        });

        if (!result.success) {
          throw new Error(result.error);
        }

        setMenus((prevMenus) =>
          prevMenus.map((m) =>
            m.code === menu.code
              ? ({ ...m, ...result.data } as IGRPMenuItemArgs)
              : m,
          ),
        );

        igrpToast({
          type: "success",
          title: "Menu Atualizado",
          description: "O menu foi atualizado com sucesso.",
          duration: 6000,
        });
      } else {
        const parentCode = values.parentCode ?? menu?.parentCode ?? undefined;
        const createValues = {
          ...values,
          position: getNextMenuPosition(allMenus, parentCode),
        };
        const create = normalizeMenu(createValues);
        const result = await createMenuAsync({
          appCode,
          menu: create as CreateMenuRequest,
        });

        if (!result.success) {
          throw new Error(result.error);
        }

        setMenus((prev) => [...prev, result.data as IGRPMenuItemArgs]);

        igrpToast({
          type: "success",
          title: "Criação de Menu",
          description: "Menu criado com sucesso.",
          duration: 6000,
        });
      }

      reset();
      onOpenChange(false);
    } catch (err) {
      igrpToast({
        type: "error",
        title: "Erro",
        description:
          err instanceof Error
            ? err.message
            : "Algo correu mal. Por favor, tente novamente",
        duration: 6000,
      });
    }
  }

  const setDefaultFromName = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isEditMode) return;

    const code = e.target.value
      .toUpperCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "_");
    form.setValue("code", code);
  };

  const showParentSelect =
    menuType === menuTypeSchema.enum.FOLDER
      ? groupMenus.length > 0
      : isPageType && (groupMenus.length > 0 || folderMenus.length > 0);

  return (
    <ScrollArea className="max-h-[70vh] px-6">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4 py-2"
        >
          <div className="grid grid-cols-1 gap-4">
            <fieldset className="border border-accent p-4 rounded-md">
              <legend className="text-base font-semibold px-2">
                Informações Gerais
              </legend>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel className='after:content-["*"] after:text-destructive'>
                          Nome
                        </FormLabel>
                        <Input
                          className="w-full"
                          placeholder="Nome do Menu"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            setDefaultFromName(e);
                          }}
                          disabled={isViewMode}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel className='after:content-["*"] after:text-destructive'>
                          Código
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="CODIGO_MENU"
                            {...field}
                            disabled={isViewMode || isEditMode}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                      <MenuIconPicker
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isViewMode}
                      />
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Estado</FormLabel>
                        <div className="flex items-center justify-between h-10 px-3 border border-input rounded-md bg-background">
                          <span className="text-sm">
                            {field.value === statusSchema.enum.ACTIVE
                              ? "Ativo"
                              : "Inativo"}
                          </span>
                          <Switch
                            checked={field.value === statusSchema.enum.ACTIVE}
                            onCheckedChange={(checked) =>
                              field.onChange(
                                checked
                                  ? statusSchema.enum.ACTIVE
                                  : statusSchema.enum.INACTIVE,
                              )
                            }
                            disabled={isViewMode}
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </fieldset>

            <MenuPageConfigFields
              form={form}
              menuType={menuType}
              disabled={isViewMode}
            />

            {showParentSelect && (
              <MenuParentCombobox
                control={form.control}
                menuType={menuType}
                groupOptions={groupMenus}
                folderOptions={folderMenus}
                disabled={isViewMode}
              />
            )}
          </div>

          <DialogFooter className="mt-4 gap-2">
            <div className="flex-1">
              {onBack && (
                <IGRPButton
                  type="button"
                  variant="link"
                  onClick={onBack}
                  disabled={isLoading}
                  iconName="ChevronLeft"
                  showIcon
                >
                  Voltar
                </IGRPButton>
              )}
            </div>
            <div className="flex gap-1.5">
              <IGRPButton
                type="button"
                variant="secondary"
                onClick={() => {
                  reset();
                  onOpenChange(false);
                }}
                iconName="X"
                showIcon
                disabled={isLoading}
              >
                Cancelar
              </IGRPButton>
              {!isViewMode && (
                <IGRPButton
                  iconName="Save"
                  showIcon
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading
                    ? "Guardando..."
                    : isEditMode
                      ? "Atualizar"
                      : "Criar Menu"}
                </IGRPButton>
              )}
            </div>
          </DialogFooter>
        </form>
      </Form>
    </ScrollArea>
  );
}
