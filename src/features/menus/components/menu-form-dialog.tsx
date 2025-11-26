"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { IGRPMenuItemArgs } from "@igrp/framework-next-types";
import {
  IGRPButton,
  IGRPButtonPrimitive,
  IGRPCommandEmptyPrimitive,
  IGRPCommandGroupPrimitive,
  IGRPCommandInputPrimitive,
  IGRPCommandItemPrimitive,
  IGRPCommandListPrimitive,
  IGRPCommandPrimitive,
  IGRPCommandSeparatorPrimitive,
  IGRPDialogContentPrimitive,
  IGRPDialogDescriptionPrimitive,
  IGRPDialogFooterPrimitive,
  IGRPDialogHeaderPrimitive,
  IGRPDialogPrimitive,
  IGRPDialogTitlePrimitive,
  IGRPFormControlPrimitive,
  IGRPFormFieldPrimitive,
  IGRPFormItemPrimitive,
  IGRPFormLabelPrimitive,
  IGRPFormMessagePrimitive,
  IGRPFormPrimitive,
  IGRPIcon,
  IGRPIconList,
  type IGRPIconName,
  IGRPInputPrimitive,
  type IGRPOptionsProps,
  IGRPPopoverContentPrimitive,
  IGRPPopoverPrimitive,
  IGRPPopoverTriggerPrimitive,
  IGRPRadioGroupItemPrimitive,
  IGRPRadioGroupPrimitive,
  IGRPScrollAreaPrimitive,
  IGRPSwitchPrimitive,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { MenuTypeSelector } from "./menu-type-selector";
import { menuTargetOptions } from "@/features/menus/menu-constants";
import {
  type CreateMenu,
  createMenuSchema,
  menuTargetSchema,
  menuTypeSchema,
  normalizeMenu,
  type UpdateMenu,
} from "@/features/menus/menu-schemas";
import { cn, formatIconString } from "@/lib/utils";
import { statusSchema } from "@/schemas/global";
import {
  useCreateMenu,
  useUpdateMenu,
} from "@/features/applications/use-applications";
import { CreateMenuRequest } from "@igrp/platform-access-management-client-ts";

export const LUCIDE_ICON_OPTIONS: IGRPOptionsProps[] = (
  Object.keys(IGRPIconList) as IGRPIconName[]
)
  .sort((a, b) => a.localeCompare(b))
  .map((name) => ({ value: name, label: formatIconString(name) }));

interface MenuFormDialogProps {
  aplicationCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setMenus: React.Dispatch<React.SetStateAction<IGRPMenuItemArgs[]>>;
  menu?: IGRPMenuItemArgs;
  groupMenus: IGRPMenuItemArgs[];
  folderMenus: IGRPMenuItemArgs[];
  appCode: string;
  openType?: "edit" | "view";
}

export function MenuFormDialog({
  aplicationCode,
  open,
  onOpenChange,
  menu,
  groupMenus,
  folderMenus,
  appCode,
  openType,
  setMenus,
}: MenuFormDialogProps) {
  const [openIconPicker, setOpenIconPicker] = useState(false);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [step, setStep] = useState<"type" | "form">(menu ? "form" : "type");
  const [selectedType, setSelectedType] = useState<string>(
    menu?.type ?? menuTypeSchema.enum.GROUP,
  );

  const { igrpToast } = useIGRPToast();

  const { mutateAsync: createMenuAsync } = useCreateMenu();
  const { mutateAsync: updateMenu } = useUpdateMenu();

  const form = useForm<CreateMenu>({
    resolver: zodResolver(createMenuSchema),
    defaultValues: {
      name: "",
      code: "",
      type: "GROUP",
      position: 0,
      icon: "AppWindow",
      status: statusSchema.enum.ACTIVE,
      applicationCode: appCode,
    },
  });

  const menuType = selectedType;
  const selectedIcon = form.watch("icon");

  const parentOptions = useMemo(() => {
    if (menuType === menuTypeSchema.enum.FOLDER) {
      return groupMenus;
    }
    if (
      menuType === menuTypeSchema.enum.MENU_PAGE ||
      menuType === menuTypeSchema.enum.EXTERNAL_PAGE
    ) {
      return folderMenus;
    }
    return [];
  }, [menuType, groupMenus, folderMenus]);

  useEffect(() => {
    if (!open) {
      setStep(menu ? "form" : "type");
      setSelectedType(menu?.type ?? menuTypeSchema.enum.GROUP);
      return;
    }

    if (menu) {
      setStep("form");
      setSelectedType(menu?.type ?? menuTypeSchema.enum.GROUP);
      form.reset({
        name: menu.name ?? "",
        code: menu.code ?? "",
        type: menu.type ?? "GROUP",
        position: menu.position ?? 0,
        icon: menu.icon ?? "AppWindow",
        status: menu.status ?? statusSchema.enum.ACTIVE,
        target: menu.target ?? menuTargetSchema.enum._self,
        url: menu.url ?? undefined,
        parentCode: menu.parentCode ?? undefined,
        applicationCode: menu.applicationCode ?? appCode,
        pageSlug: menu.pageSlug ?? undefined,
      } as CreateMenu);
    } else {
      setSelectedType(menuTypeSchema.enum.GROUP);
      form.reset({
        name: "",
        code: "",
        type: "GROUP",
        position: 0,
        icon: "AppWindow",
        status: statusSchema.enum.ACTIVE,
        applicationCode: appCode,
      } as CreateMenu);
    }
  }, [open, menu, appCode, form]);

  useEffect(() => {
    if (openIconPicker) {
      setReady(false);
      const id = window.requestIdleCallback
        ? window.requestIdleCallback(() => setReady(true))
        : window.setTimeout(() => setReady(true), 0);
      return () => {
        if ("cancelIdleCallback" in window) {
          window.cancelIdleCallback(id);
        } else {
          clearTimeout(id);
        }
      };
    } else {
      setReady(false);
    }
  }, [openIconPicker]);

  const items = LUCIDE_ICON_OPTIONS;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (o) =>
        String(o.value).toLowerCase().includes(q) ||
        o.label.toLowerCase().includes(q),
    );
  }, [query, items]);

  const parentRef = useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 8,
  });

  const isLoading = form.formState.isSubmitting;

  async function onSubmit(values: CreateMenu) {
    const code = menu?.code ?? "";

    try {
      if (code) {
        const update = normalizeMenu(values as UpdateMenu);
        const result = await updateMenu({
          appCode: aplicationCode,
          menuCode: code,
          data: update,
        });

        if (!result.success) {
          throw new Error(result.error);
        }

        setMenus((prevMenus) =>
          prevMenus.map((m) =>
            m.code === code
              ? ({ ...m, ...result.data } as IGRPMenuItemArgs)
              : m,
          ),
        );

        igrpToast({
          type: "success",
          title: "Menu Atualizado",
          description: "O menu foi atualizado com sucesso.",
        });
      } else {
        const create = normalizeMenu(values);
        const result = await createMenuAsync({
          appCode: aplicationCode,
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
        });
      }

      form.reset();
      setStep("type");
      onOpenChange(false);
    } catch (err) {
      igrpToast({
        type: "error",
        title: "Erro",
        description:
          err instanceof Error
            ? err.message
            : "Algo correu mal. Por favor, tente novamente",
      });
    }
  }

  const currentIcon = useMemo(
    () => LUCIDE_ICON_OPTIONS.find((icon) => icon.value === selectedIcon),
    [selectedIcon],
  );

  const setDefaultFromName = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;

    if (openType !== "edit") {
      const code = name
        .toUpperCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "_");
      form.setValue("code", code);
    }
  };

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    const currentType = form.getValues("type");

    if (currentType !== type) {
      form.setValue("type", type as any);
      form.setValue("parentCode", undefined);

      if (
        type === menuTypeSchema.enum.GROUP ||
        type === menuTypeSchema.enum.FOLDER
      ) {
        form.setValue("pageSlug", undefined as any);
        form.setValue("url", undefined as any);
        form.setValue("target", undefined as any);
      }

      // if (type === menuTypeSchema.enum.MENU_PAGE) {
      //   form.setValue("url", undefined as any);
      // }

      // if (type === menuTypeSchema.enum.EXTERNAL_PAGE) {
      //   form.setValue("pageSlug", undefined as any);
      // }
    }

    setStep("form");
  };

  const handleBack = () => {
    if (step === "form" && !menu) {
      setStep("type");
    }
  };

  const isMenuPage = menuType === menuTypeSchema.enum.MENU_PAGE;
  const isExternalPage = menuType === menuTypeSchema.enum.EXTERNAL_PAGE;
  const showParentSelect = parentOptions.length > 0;

  const dialogTitle =
    openType === "view"
      ? "Visualizar Menu"
      : openType === "edit"
        ? "Editar Menu"
        : menu?.parentCode
          ? menu.type === "FOLDER"
            ? "Adicionar Pasta"
            : "Adicionar Menu"
          : "Novo Menu";

  return (
    <IGRPDialogPrimitive open={open} onOpenChange={onOpenChange}>
      <IGRPDialogContentPrimitive className="py-4 px-0 sm:min-w-2xl ">
        <IGRPDialogHeaderPrimitive className="px-6">
          <IGRPDialogTitlePrimitive>{dialogTitle}</IGRPDialogTitlePrimitive>
          <IGRPDialogDescriptionPrimitive>
            {menu
              ? openType === "view"
                ? "Visualizar informações do menu"
                : "Atualizar os detalhes deste menu"
              : step === "type"
                ? "Selecione o tipo de menu que deseja criar"
                : "Preencha os detalhes do novo menu"}
          </IGRPDialogDescriptionPrimitive>
        </IGRPDialogHeaderPrimitive>

        {step === "type" && !menu ? (
          <div className="px-6 py-4">
            <MenuTypeSelector
              value={selectedType}
              onChange={handleTypeSelect}
              disabled={openType === "view"}
            />
            <div className="flex justify-end gap-2 mt-6">
              <IGRPButton
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                showIcon
                iconName="X"
              >
                Cancelar
              </IGRPButton>
            </div>
          </div>
        ) : (
          <IGRPScrollAreaPrimitive className="max-h-[70vh] px-6">
            <IGRPFormPrimitive {...form}>
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
                        <IGRPFormFieldPrimitive
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <IGRPFormItemPrimitive className="w-full">
                              <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive'>
                                Nome
                              </IGRPFormLabelPrimitive>
                              <IGRPInputPrimitive
                                className="w-full"
                                placeholder="Nome do Menu"
                                {...field}
                                required
                                onChange={(e) => {
                                  field.onChange(e);
                                  setDefaultFromName(e);
                                }}
                                disabled={openType === "view"}
                              />
                              <IGRPFormMessagePrimitive />
                            </IGRPFormItemPrimitive>
                          )}
                        />

                        <IGRPFormFieldPrimitive
                          control={form.control}
                          name="code"
                          render={({ field }) => (
                            <IGRPFormItemPrimitive className="w-full">
                              <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive'>
                                Código
                              </IGRPFormLabelPrimitive>
                              <IGRPFormControlPrimitive>
                                <IGRPInputPrimitive
                                  placeholder="CODIGO_MENU"
                                  {...field}
                                  pattern="^[A-Z0-9_]+$"
                                  disabled={openType === "view"}
                                />
                              </IGRPFormControlPrimitive>
                              <IGRPFormMessagePrimitive />
                            </IGRPFormItemPrimitive>
                          )}
                        />
                      </div>

                      <IGRPFormFieldPrimitive
                        control={form.control}
                        name="icon"
                        render={({ field }) => (
                          <IGRPFormItemPrimitive>
                            <IGRPFormLabelPrimitive>
                              Ícone
                            </IGRPFormLabelPrimitive>
                            <IGRPPopoverPrimitive
                              open={openIconPicker}
                              onOpenChange={setOpenIconPicker}
                            >
                              <IGRPPopoverTriggerPrimitive
                                asChild
                                disabled={openType === "view"}
                              >
                                <IGRPFormControlPrimitive>
                                  <IGRPButtonPrimitive
                                    variant="outline"
                                    role="combobox"
                                    className="justify-between"
                                  >
                                    {currentIcon ? (
                                      <div className="flex items-center gap-2">
                                        <IGRPIcon
                                          iconName={String(currentIcon.value)}
                                          className="size-4"
                                        />
                                        <span>{currentIcon.label}</span>
                                      </div>
                                    ) : (
                                      "Selecionar ícone..."
                                    )}
                                    <IGRPIcon iconName="ChevronsUpDown" />
                                  </IGRPButtonPrimitive>
                                </IGRPFormControlPrimitive>
                              </IGRPPopoverTriggerPrimitive>

                              <IGRPPopoverContentPrimitive
                                className="w-[--radix-popover-trigger-width] p-0"
                                align="start"
                              >
                                <IGRPCommandPrimitive
                                  onValueChange={setQuery}
                                  filter={() => 1}
                                >
                                  <div className="relative">
                                    <IGRPCommandInputPrimitive placeholder="Procurar ícone..." />
                                    {!ready && (
                                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                        <IGRPIcon
                                          iconName="LoaderCircle"
                                          className="size-4 animate-spin"
                                        />
                                      </div>
                                    )}
                                  </div>

                                  {!ready ? (
                                    <IGRPCommandListPrimitive className="max-h-80">
                                      <IGRPCommandGroupPrimitive>
                                        {Array.from({ length: 10 }).map(
                                          (_, i) => (
                                            <div
                                              key={i}
                                              className="h-9 animate-pulse rounded-sm bg-foreground/5 mx-2 my-1"
                                            />
                                          ),
                                        )}
                                      </IGRPCommandGroupPrimitive>
                                    </IGRPCommandListPrimitive>
                                  ) : (
                                    <IGRPCommandListPrimitive
                                      ref={parentRef}
                                      className="max-h-80 overflow-auto"
                                    >
                                      {filtered.length === 0 ? (
                                        <IGRPCommandEmptyPrimitive>
                                          Nenhum ícone encontrado.
                                        </IGRPCommandEmptyPrimitive>
                                      ) : (
                                        <IGRPCommandGroupPrimitive>
                                          <div
                                            style={{
                                              height:
                                                rowVirtualizer.getTotalSize(),
                                              width: "100%",
                                              position: "relative",
                                            }}
                                          >
                                            {rowVirtualizer
                                              .getVirtualItems()
                                              .map((virtualRow) => {
                                                const iconData =
                                                  filtered[virtualRow.index];
                                                return (
                                                  <div
                                                    key={iconData.value}
                                                    style={{
                                                      position: "absolute",
                                                      top: 0,
                                                      left: 0,
                                                      width: "100%",
                                                      transform: `translateY(${virtualRow.start}px)`,
                                                    }}
                                                  >
                                                    <IGRPCommandItemPrimitive
                                                      value={`${iconData.value} ${iconData.label}`}
                                                      onSelect={() => {
                                                        field.onChange(
                                                          iconData.value,
                                                        );
                                                        setOpenIconPicker(
                                                          false,
                                                        );
                                                      }}
                                                      className="gap-3"
                                                    >
                                                      <IGRPIcon
                                                        iconName={String(
                                                          iconData.value,
                                                        )}
                                                      />
                                                      <span>
                                                        {iconData.label}
                                                      </span>
                                                      <IGRPIcon
                                                        iconName="Check"
                                                        className={cn(
                                                          "ml-auto opacity-0",
                                                          iconData.value ===
                                                            field.value &&
                                                            "opacity-100",
                                                        )}
                                                      />
                                                    </IGRPCommandItemPrimitive>
                                                  </div>
                                                );
                                              })}
                                          </div>
                                        </IGRPCommandGroupPrimitive>
                                      )}
                                    </IGRPCommandListPrimitive>
                                  )}
                                </IGRPCommandPrimitive>
                              </IGRPPopoverContentPrimitive>
                            </IGRPPopoverPrimitive>
                            <IGRPFormMessagePrimitive />
                          </IGRPFormItemPrimitive>
                        )}
                      />

                      <IGRPFormFieldPrimitive
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <IGRPFormItemPrimitive className="w-full">
                            <IGRPFormLabelPrimitive>
                              Estado
                            </IGRPFormLabelPrimitive>
                            <div className="flex items-center justify-between h-10 px-3 border border-input rounded-md bg-background">
                              <span className="text-sm">
                                {field.value === statusSchema.enum.ACTIVE
                                  ? "Ativo"
                                  : "Inativo"}
                              </span>
                              <IGRPSwitchPrimitive
                                checked={
                                  field.value === statusSchema.enum.ACTIVE
                                }
                                onCheckedChange={(checked) =>
                                  field.onChange(
                                    checked
                                      ? statusSchema.enum.ACTIVE
                                      : statusSchema.enum.INACTIVE,
                                  )
                                }
                                disabled={openType === "view"}
                              />
                            </div>
                            <IGRPFormMessagePrimitive />
                          </IGRPFormItemPrimitive>
                        )}
                      />
                    </div>
                  </fieldset>

                  {(isMenuPage || isExternalPage) && (
                    <fieldset className="border border-accent p-4 rounded-md">
                      <legend className="text-base font-semibold px-2">
                        Configurações de Página
                      </legend>
                      <div className="flex flex-col gap-4">
                            <IGRPFormFieldPrimitive
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <IGRPFormItemPrimitive>
                            <IGRPFormLabelPrimitive>
                              Tipo de Página
                            </IGRPFormLabelPrimitive>
                            <IGRPFormControlPrimitive>
                              <IGRPRadioGroupPrimitive
                                value={field.value}
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  setSelectedType(value as any);
                                  if (value === menuTypeSchema.enum.EXTERNAL_PAGE) {
                                    form.setValue("pageSlug", undefined as any);
                                    form.setValue("target", menuTargetSchema.enum._blank);
                                  } else {
                                    form.setValue("url", undefined as any);
                                    form.setValue("target", menuTargetSchema.enum._self);
                                  }
                                }}
                                disabled={openType === "view"}
                                className="flex flex-row"
                              >
                                <div className="flex items-center space-x-2">
                                  <IGRPRadioGroupItemPrimitive
                                    value={menuTypeSchema.enum.MENU_PAGE}
                                    id="internal"
                                  />
                                  <label htmlFor="internal" className="cursor-pointer">
                                    Página Interna
                                  </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <IGRPRadioGroupItemPrimitive
                                    value={menuTypeSchema.enum.EXTERNAL_PAGE}
                                    id="external"
                                  />
                                  <label htmlFor="external" className="cursor-pointer">
                                    Página Externa
                                  </label>
                                </div>
                              </IGRPRadioGroupPrimitive>
                            </IGRPFormControlPrimitive>
                            <IGRPFormMessagePrimitive />
                          </IGRPFormItemPrimitive>
                        )}
    />

                        {form.watch("type") ===
                          menuTypeSchema.enum.MENU_PAGE && (
                          <IGRPFormFieldPrimitive
                            control={form.control}
                            name="pageSlug"
                            render={({ field }) => (
                              <IGRPFormItemPrimitive>
                                <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive'>
                                  URL Relativo
                                </IGRPFormLabelPrimitive>
                                <IGRPFormControlPrimitive>
                                  <IGRPInputPrimitive
                                    placeholder="page-slug"
                                    {...field}
                                    value={field.value ?? ""}
                                    disabled={openType === "view"}
                                  />
                                </IGRPFormControlPrimitive>
                                <IGRPFormMessagePrimitive />
                              </IGRPFormItemPrimitive>
                            )}
                          />
                        )}

                        {form.watch("type") ===
                          menuTypeSchema.enum.EXTERNAL_PAGE && (
                          <IGRPFormFieldPrimitive
                            control={form.control}
                            name="url"
                            render={({ field }) => (
                              <IGRPFormItemPrimitive>
                                <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive'>
                                  URL Externa
                                </IGRPFormLabelPrimitive>
                                <IGRPFormControlPrimitive>
                                  <IGRPInputPrimitive
                                    placeholder="https://example.com"
                                    {...field}
                                    value={field.value ?? ""}
                                    disabled={openType === "view"}
                                  />
                                </IGRPFormControlPrimitive>
                                <IGRPFormMessagePrimitive />
                              </IGRPFormItemPrimitive>
                            )}
                          />
                        )}

                        <IGRPFormFieldPrimitive
                          control={form.control}
                          name="target"
                          render={({ field }) => (
                            <IGRPFormItemPrimitive>
                              <div className="flex items-center justify-between">
                                <IGRPFormLabelPrimitive>
                                  Abrir em nova aba
                                </IGRPFormLabelPrimitive>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground">
                                    {field.value ===
                                    menuTargetSchema.enum._blank
                                      ? "Sim"
                                      : "Não"}
                                  </span>
                                  <IGRPSwitchPrimitive
                                    checked={
                                      field.value ===
                                      menuTargetSchema.enum._blank
                                    }
                                    onCheckedChange={(checked) =>
                                      field.onChange(
                                        checked
                                          ? menuTargetSchema.enum._blank
                                          : menuTargetSchema.enum._self,
                                      )
                                    }
                                    disabled={openType === "view"}
                                  />
                                </div>
                              </div>
                              <IGRPFormMessagePrimitive />
                            </IGRPFormItemPrimitive>
                          )}
                        />
                      </div>
                    </fieldset>
                  )}

                  {showParentSelect && (
                    <fieldset className="border border-accent p-4 rounded-md">
                      <legend className="text-base font-semibold px-2">
                        Hierarquia
                      </legend>
                      <IGRPFormFieldPrimitive
                        control={form.control}
                        name="parentCode"
                        render={({ field }) => (
                          <IGRPFormItemPrimitive>
                            <IGRPFormLabelPrimitive>
                              {menuType === "FOLDER"
                                ? "Grupo (Opcional)"
                                : "Pasta (Opcional)"}
                            </IGRPFormLabelPrimitive>
                            <IGRPPopoverPrimitive>
                              <IGRPPopoverTriggerPrimitive
                                asChild
                                disabled={openType === "view"}
                              >
                                <IGRPFormControlPrimitive>
                                  <IGRPButtonPrimitive
                                    variant="outline"
                                    role="combobox"
                                    className="justify-between w-full"
                                  >
                                    {field.value
                                      ? parentOptions.find(
                                          (m) => m.code === field.value,
                                        )?.name
                                      : `Selecionar ${
                                          menuType === "FOLDER"
                                            ? "grupo"
                                            : "pasta"
                                        }...`}
                                    <IGRPIcon iconName="ChevronsUpDown" />
                                  </IGRPButtonPrimitive>
                                </IGRPFormControlPrimitive>
                              </IGRPPopoverTriggerPrimitive>
                              <IGRPPopoverContentPrimitive
                                className="w-[--radix-popover-trigger-width] p-0"
                                align="start"
                              >
                                <IGRPCommandPrimitive>
                                  <IGRPCommandInputPrimitive
                                    placeholder={`Procurar ${
                                      menuType === "FOLDER" ? "grupo" : "pasta"
                                    }...`}
                                  />
                                  <IGRPCommandListPrimitive>
                                    <IGRPCommandEmptyPrimitive>
                                      Nenhum{" "}
                                      {menuType === "FOLDER"
                                        ? "grupo"
                                        : "pasta"}{" "}
                                      encontrado.
                                    </IGRPCommandEmptyPrimitive>
                                    <IGRPCommandGroupPrimitive>
                                      <IGRPCommandItemPrimitive
                                        onSelect={() => {
                                          field.onChange("");
                                          form.setValue(
                                            "parentCode",
                                            "" as any,
                                          );
                                        }}
                                      >
                                        Nenhum (Raiz)
                                        <IGRPIcon
                                          iconName="Check"
                                          className={cn(
                                            "ml-auto opacity-0",
                                            !field.value && "opacity-100",
                                          )}
                                        />
                                      </IGRPCommandItemPrimitive>
                                      <IGRPCommandSeparatorPrimitive />
                                      {parentOptions.map((menu) => (
                                        <IGRPCommandItemPrimitive
                                          key={menu.code}
                                          onSelect={() => {
                                            field.onChange(menu.code);
                                          }}
                                        >
                                          <IGRPIcon
                                            iconName={menu.icon || "Folder"}
                                            className="mr-2 size-4"
                                          />
                                          {menu.name}
                                          <IGRPIcon
                                            iconName="Check"
                                            className={cn(
                                              "ml-auto opacity-0",
                                              menu.code === field.value &&
                                                "opacity-100",
                                            )}
                                          />
                                        </IGRPCommandItemPrimitive>
                                      ))}
                                    </IGRPCommandGroupPrimitive>
                                  </IGRPCommandListPrimitive>
                                </IGRPCommandPrimitive>
                              </IGRPPopoverContentPrimitive>
                            </IGRPPopoverPrimitive>
                            <IGRPFormMessagePrimitive />
                          </IGRPFormItemPrimitive>
                        )}
                      />
                    </fieldset>
                  )}
                </div>

                <IGRPDialogFooterPrimitive className="mt-4 gap-2">
                  {/* <div className="flex gap-2 justify-between"> */}
                  <div className="flex-1">
                    {!menu && step === "form" && (
                      <IGRPButton
                        type="button"
                        variant="ghost"
                        onClick={handleBack}
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
                      variant="outline"
                      onClick={() => {
                        form.reset();
                        setStep("type");
                        onOpenChange(false);
                      }}
                      iconName="X"
                      showIcon
                      disabled={isLoading}
                    >
                      Cancelar
                    </IGRPButton>
                    {openType !== "view" && (
                      <IGRPButton
                        iconName="Save"
                        showIcon
                        type="submit"
                        disabled={isLoading}
                      >
                        {isLoading ? "Guardando..." : openType === "edit" ? "Atualizar" : "Criar Menu"}
                      </IGRPButton>
                    )}
                  </div>
                  {/* </div> */}
                </IGRPDialogFooterPrimitive>
              </form>
            </IGRPFormPrimitive>
          </IGRPScrollAreaPrimitive>
        )}
      </IGRPDialogContentPrimitive>
    </IGRPDialogPrimitive>
  );
}
