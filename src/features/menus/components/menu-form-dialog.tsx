'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  IGRPButtonPrimitive,
  IGRPCommandPrimitive,
  IGRPCommandEmptyPrimitive,
  IGRPCommandGroupPrimitive,
  IGRPCommandInputPrimitive,
  IGRPCommandItemPrimitive,
  IGRPCommandListPrimitive,
  IGRPDialogPrimitive,
  IGRPDialogContentPrimitive,
  IGRPDialogDescriptionPrimitive,
  IGRPDialogFooterPrimitive,
  IGRPDialogHeaderPrimitive,
  IGRPDialogTitlePrimitive,
  IGRPFormPrimitive,
  IGRPFormControlPrimitive,
  IGRPFormDescriptionPrimitive,
  IGRPFormFieldPrimitive,
  IGRPFormItemPrimitive,
  IGRPFormLabelPrimitive,
  IGRPInputPrimitive,
  IGRPPopoverPrimitive,
  IGRPPopoverTriggerPrimitive,
  IGRPPopoverContentPrimitive,
  IGRPRadioGroupPrimitive,
  IGRPRadioGroupItemPrimitive,
  IGRPScrollAreaPrimitive,
  useIGRPToast,
  IGRPFormMessagePrimitive,
  IGRPIcon,
  IGRPIconName,
  IGRPIconList,
  IGRPOptionsProps,
  IGRPCommandSeparatorPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { IGRPMenuItemArgs } from '@igrp/framework-next-types';
import { IGRPMenuCRUDArgs } from '@igrp/framework-next-types';

import { MENU_VIEW, menuTargetOptions, menuTypeOptions } from '@/features/menus/menu-constants';
import {
  createMenuSchema,
  MenuArgs,
  menuTargetSchema,
  menuTypeSchema,
  CreateMenu,
  OnSaveMenu,
  normalizeMenu,
  UpdateMenu,
} from '@/features/menus/menu-schemas';
import { useCreateMenu, useUpdateMenu } from '@/features/menus/use-menus';
import { OPEN_TYPE_VIEW, STATUS_OPTIONS } from '@/lib/constants';
import { cn, formatIconString } from '@/lib/utils';
import { statusSchema } from '@/schemas/global';

export const LUCIDE_ICON_OPTIONS: IGRPOptionsProps[] = (Object.keys(IGRPIconList) as IGRPIconName[])
  .sort((a, b) => a.localeCompare(b))
  .map((name) => ({ value: name, label: formatIconString(name) }));

interface MenuFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setMenus: React.Dispatch<React.SetStateAction<IGRPMenuCRUDArgs[]>>;
  menu?: IGRPMenuCRUDArgs;
  onSave?: (values: OnSaveMenu, code?: string) => void;
  parentMenus: IGRPMenuItemArgs[];
  appCode: string;
  openType?: 'edit' | 'view';
}

type FormValues = z.input<typeof createMenuSchema>;

export function MenuFormDialog({
  open,
  onOpenChange,
  menu,
  parentMenus,
  appCode,
  openType,
  setMenus,
}: MenuFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [openIconPicker, setOpenIconPicker] = useState(false);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState('');

  const { igrpToast } = useIGRPToast();

  const { mutateAsync: createMenuAsync } = useCreateMenu();
  const { mutate: updateMenu } = useUpdateMenu();

  const form = useForm<FormValues>({
    resolver: zodResolver(createMenuSchema),
    defaultValues: {
      name: '',
      code: '',
      type: menuTypeSchema.enum.MENU_PAGE,
      position: 0,
      icon: 'AppWindow',
      status: statusSchema.enum.ACTIVE,
      target: menuTargetSchema.enum._self,
      url: '',
      parentCode: '',
      applicationCode: appCode,
      pageSlug: '',
    } satisfies FormValues,
  });

  useEffect(() => {
    if (!open) return;

    if (menu) {
      form.reset({
        name: menu.name ?? '',
        code: menu.code ?? '',
        type: menu.type ?? menuTypeSchema.enum.MENU_PAGE,
        position: menu.position ?? 0,
        icon: menu.icon ?? 'AppWindow',
        status: menu.status ?? statusSchema.enum.ACTIVE,
        target: menu.target ?? menuTargetSchema.enum._self,
        url: menu.url ?? '',
        parentCode: menu.parentCode ?? '',
        applicationCode: menu.applicationCode ?? appCode,
        pageSlug: menu.pageSlug ?? '',
      } as FormValues);
    } else {
      form.reset({
        name: '',
        code: '',
        type: menuTypeSchema.enum.MENU_PAGE,
        position: 0,
        icon: 'AppWindow',
        status: statusSchema.enum.ACTIVE,
        target: menuTargetSchema.enum._self,
        url: '',
        parentCode: '',
        applicationCode: appCode,
        pageSlug: '',
      } as FormValues);
    }
  }, [open, menu, appCode, form]);

  useEffect(() => {
    if (openIconPicker) {
      setReady(false);
      const id = window.requestIdleCallback
        ? window.requestIdleCallback(() => setReady(true))
        : window.setTimeout(() => setReady(true), 0);
      return () => {
        if ('cancelIdleCallback' in window) {
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
      (o) => o.value.toLowerCase().includes(q) || o.label.toLowerCase().includes(q),
    );
  }, [query, items]);

  const parentRef = useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 8,
  });

  async function onSubmit(values: MenuArgs) {
    const payload: OnSaveMenu = { ...values, applicationCode: appCode };
    const code = menu?.code ?? '';

    setIsLoading(true);

    try {
      if (code) {
        const update = normalizeMenu(payload as UpdateMenu);

        updateMenu({ code, data: update });

        setMenus((prevMenus) =>
          prevMenus.map((menu) => (menu.code === code ? { ...menu, ...update } : menu)),
        );

        igrpToast({
          type: 'success',
          title: 'Menu Atualizado',
          description: 'O menu foi atualizado com sucesso.',
          duration: 4000,
        });
      } else {
        try {
          const create = normalizeMenu(payload as CreateMenu);
          const newMenu = await createMenuAsync(create);
          setMenus((prev) => [...prev, newMenu]);

          igrpToast({
            type: 'success',
            title: 'Criação de Menu',
            description: 'Menu criado com sucesso.',
            duration: 4000,
          });
        } catch (err) {
          igrpToast({
            type: 'error',
            title: 'Falha na criação de menu.',
            description: (err as Error).message,
            duration: 4000,
          });
        }
      }

      form.reset();
    } catch (err) {
      igrpToast({
        type: 'error',
        title: 'Algo correu mal. Por favor, tente novamente',
        description:
          err instanceof Error ? err.message : 'Algo correu mal. Por favor, tente novamente',
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        onOpenChange(false);
      }, 2500);
    }
  }

  const isMenuPage = form.watch('type') === menuTypeSchema.enum.MENU_PAGE;
  const isExternalPage = form.watch('type') === menuTypeSchema.enum.EXTERNAL_PAGE;
  const selectedIcon = form.watch('icon');

  const currentIcon = useMemo(
    () => LUCIDE_ICON_OPTIONS.find((icon) => icon.value === selectedIcon),
    [selectedIcon],
  );

  const setDefaultFromName = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue('name', name);

    if (!menu || form.getValues('pageSlug') === '') {
      const pageSlug = name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');

      form.setValue('pageSlug', pageSlug);
    }

    if (!menu || form.getValues('code') === '') {
      const code = name
        .toUpperCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '_');
      form.setValue('code', code);
    }
  };

  return (
    <IGRPDialogPrimitive
      open={open}
      onOpenChange={onOpenChange}
      modal
    >
      <IGRPDialogContentPrimitive className='py-4 px-0 sm:min-w-3/4 lg:min-w-1/2'>
        <IGRPDialogHeaderPrimitive className='px-4'>
          <IGRPDialogTitlePrimitive>
            {menu ? (openType === MENU_VIEW ? 'Detalhes do Menu' : 'Editar Menu') : 'Criar Menu'}
          </IGRPDialogTitlePrimitive>
          <IGRPDialogDescriptionPrimitive>
            {menu
              ? openType === MENU_VIEW
                ? 'Detalhes do item menu'
                : 'Atualizar os detalhes deste item de menu.'
              : 'Adicionar um novo item de menu à aplicação.'}
          </IGRPDialogDescriptionPrimitive>
        </IGRPDialogHeaderPrimitive>

        <IGRPScrollAreaPrimitive className='max-h-[80vh] sm:max-h-screen px-4 sm:px-6'>
          <IGRPFormPrimitive {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className='flex flex-col gap-4 p-2'
            >
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <IGRPFormFieldPrimitive
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <IGRPFormItemPrimitive>
                      <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive gap-0.5 mb-1'>
                        Nome
                      </IGRPFormLabelPrimitive>
                      <IGRPFormControlPrimitive>
                        <IGRPInputPrimitive
                          placeholder='Nome de Menu'
                          {...field}
                          required
                          onChange={setDefaultFromName}
                          disabled={openType === MENU_VIEW}
                          className='placeholder:truncate border-primary/30 focus-visible:ring-[2px] focus-visible:ring-primary/30 focus-visible:border-primary/30'
                        />
                      </IGRPFormControlPrimitive>
                      <IGRPFormMessagePrimitive />
                    </IGRPFormItemPrimitive>
                  )}
                />

                <IGRPFormFieldPrimitive
                  control={form.control}
                  name='code'
                  render={({ field }) => (
                    <IGRPFormItemPrimitive>
                      <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive'>
                        Código
                      </IGRPFormLabelPrimitive>
                      <IGRPFormControlPrimitive>
                        <IGRPInputPrimitive
                          placeholder='CODIGO_MENU'
                          {...field}
                          pattern='^[A-Z0-9_]+$'
                          disabled={openType === MENU_VIEW}
                          className='placeholder:truncate border-primary/30 focus-visible:ring-[2px] focus-visible:ring-primary/30 focus-visible:border-primary/30'
                        />
                      </IGRPFormControlPrimitive>
                      <IGRPFormMessagePrimitive />
                    </IGRPFormItemPrimitive>
                  )}
                />

                <IGRPFormFieldPrimitive
                  control={form.control}
                  name='type'
                  render={({ field }) => (
                    <IGRPFormItemPrimitive>
                      <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive gap-0.5 mb-1'>
                        Tipo
                      </IGRPFormLabelPrimitive>
                      <IGRPFormControlPrimitive>
                        <IGRPRadioGroupPrimitive
                          orientation='vertical'
                          onValueChange={(value) => field.onChange(value)}
                          value={field.value}
                          disabled={openType === MENU_VIEW}
                        >
                          {menuTypeOptions.map(({ value, label }) => (
                            <IGRPFormItemPrimitive
                              className='flex'
                              key={value}
                            >
                              <IGRPFormControlPrimitive>
                                <IGRPRadioGroupItemPrimitive
                                  value={value}
                                  className='border-primary'
                                />
                              </IGRPFormControlPrimitive>
                              <IGRPFormLabelPrimitive className='font-normal'>
                                {label}
                              </IGRPFormLabelPrimitive>
                            </IGRPFormItemPrimitive>
                          ))}
                        </IGRPRadioGroupPrimitive>
                      </IGRPFormControlPrimitive>

                      <IGRPFormMessagePrimitive />
                    </IGRPFormItemPrimitive>
                  )}
                />

                <IGRPFormFieldPrimitive
                  control={form.control}
                  name='status'
                  render={({ field }) => (
                    <IGRPFormItemPrimitive>
                      <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive gap-0.5'>
                        Estado
                      </IGRPFormLabelPrimitive>
                      <IGRPFormControlPrimitive>
                        <IGRPRadioGroupPrimitive
                          onValueChange={field.onChange}
                          value={field.value}
                          orientation='vertical'
                          disabled={openType === MENU_VIEW}
                        >
                          {STATUS_OPTIONS.map(({ value, label }) => (
                            <IGRPFormItemPrimitive
                              className='flex items-center'
                              key={value}
                            >
                              <IGRPFormControlPrimitive>
                                <IGRPRadioGroupItemPrimitive
                                  value={value}
                                  className='cursor-pointer border-primary'
                                />
                              </IGRPFormControlPrimitive>
                              <IGRPFormLabelPrimitive className='font-normal'>
                                {label}
                              </IGRPFormLabelPrimitive>
                            </IGRPFormItemPrimitive>
                          ))}
                        </IGRPRadioGroupPrimitive>
                      </IGRPFormControlPrimitive>
                      <IGRPFormMessagePrimitive />
                    </IGRPFormItemPrimitive>
                  )}
                />

                {isMenuPage && (
                  <>
                    <IGRPFormFieldPrimitive
                      control={form.control}
                      name='pageSlug'
                      render={({ field }) => (
                        <IGRPFormItemPrimitive>
                          <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive gap-0.5'>
                            URL Relátivo
                          </IGRPFormLabelPrimitive>
                          <IGRPFormControlPrimitive>
                            <IGRPInputPrimitive
                              placeholder='page-slug'
                              name={field.name}
                              ref={field.ref}
                              onBlur={field.onBlur}
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value)}
                              disabled={openType === MENU_VIEW}
                            />
                          </IGRPFormControlPrimitive>
                          <IGRPFormMessagePrimitive />
                        </IGRPFormItemPrimitive>
                      )}
                    />

                    <IGRPFormFieldPrimitive
                      control={form.control}
                      name='target'
                      render={({ field }) => (
                        <IGRPFormItemPrimitive>
                          <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive gap-0.5'>
                            Abrir em
                          </IGRPFormLabelPrimitive>
                          <IGRPFormControlPrimitive>
                            <IGRPRadioGroupPrimitive
                              onValueChange={field.onChange}
                              value={field.value}
                              className='flex flex-row'
                              disabled={openType === OPEN_TYPE_VIEW}
                            >
                              {menuTargetOptions.map(({ value, label }) => (
                                <IGRPFormItemPrimitive
                                  className='flex items-center'
                                  key={value}
                                >
                                  <IGRPFormControlPrimitive>
                                    <IGRPRadioGroupItemPrimitive
                                      value={value}
                                      className='cursor-pointer border-primary'
                                    />
                                  </IGRPFormControlPrimitive>
                                  <IGRPFormLabelPrimitive className='font-normal'>
                                    {label}
                                  </IGRPFormLabelPrimitive>
                                </IGRPFormItemPrimitive>
                              ))}
                            </IGRPRadioGroupPrimitive>
                          </IGRPFormControlPrimitive>
                          <IGRPFormMessagePrimitive />
                        </IGRPFormItemPrimitive>
                      )}
                    />
                  </>
                )}

                {isExternalPage && (
                  <>
                    <IGRPFormFieldPrimitive
                      control={form.control}
                      name='url'
                      render={({ field }) => (
                        <IGRPFormItemPrimitive>
                          <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive gap-0.5'>
                            URL
                          </IGRPFormLabelPrimitive>
                          <IGRPFormControlPrimitive>
                            <IGRPInputPrimitive
                              placeholder='https://example.com'
                              name={field.name}
                              ref={field.ref}
                              onBlur={field.onBlur}
                              value={field.value ?? ''}
                              onChange={(e) =>
                                field.onChange(e.target.value === '' ? null : e.target.value)
                              }
                              disabled={openType === MENU_VIEW}
                            />
                          </IGRPFormControlPrimitive>
                          <IGRPFormMessagePrimitive />
                        </IGRPFormItemPrimitive>
                      )}
                    />
                  </>
                )}

                {(isExternalPage || isMenuPage) && parentMenus.length > 0 && (
                  <IGRPFormFieldPrimitive
                    control={form.control}
                    name='parentCode'
                    render={({ field }) => (
                      <IGRPFormItemPrimitive className='flex flex-col'>
                        <IGRPFormLabelPrimitive>Selecionar Grupo</IGRPFormLabelPrimitive>
                        <IGRPPopoverPrimitive>
                          <IGRPPopoverTriggerPrimitive
                            asChild
                            disabled={openType === MENU_VIEW}
                          >
                            <IGRPFormControlPrimitive>
                              <IGRPButtonPrimitive
                                variant='outline'
                                role='combobox'
                                className={cn(
                                  'justify-between',
                                  !field.value && 'text-muted-foreground',
                                )}
                              >
                                {field.value
                                  ? parentMenus.find((menu) => menu.code === field.value)?.name
                                  : 'Selecionar Grupo...'}
                                <IGRPIcon
                                  iconName='ChevronsUpDown'
                                  className='opacity-50'
                                />
                              </IGRPButtonPrimitive>
                            </IGRPFormControlPrimitive>
                          </IGRPPopoverTriggerPrimitive>
                          <IGRPPopoverContentPrimitive
                            className='w-[--radix-popover-trigger-width] p-0'
                            align='start'
                          >
                            <IGRPCommandPrimitive>
                              <IGRPCommandInputPrimitive
                                placeholder='Procurar menu...'
                                className='h-9'
                              />
                              <IGRPCommandListPrimitive className='px-3 oy-2'>
                                <IGRPCommandEmptyPrimitive>
                                  Nenhum Grupo encontrado.
                                </IGRPCommandEmptyPrimitive>
                                <IGRPCommandGroupPrimitive>
                                  <IGRPCommandItemPrimitive
                                    value='none'
                                    onSelect={() => {
                                      form.setValue('parentCode', '');
                                    }}
                                  >
                                    Selecionar Grupo...
                                    <IGRPIcon
                                      iconName='Check'
                                      className={cn(
                                        'ml-auto opacity-0',
                                        field.value === null && 'opacity-100',
                                      )}
                                    />
                                  </IGRPCommandItemPrimitive>
                                  <IGRPCommandSeparatorPrimitive className='my-2' />
                                  {parentMenus.map((menu) => (
                                    <IGRPCommandItemPrimitive
                                      value={menu.id?.toString() || ''}
                                      key={`menu-${menu.id}`}
                                      onSelect={() => {
                                        form.setValue('parentCode', menu.code);
                                      }}
                                    >
                                      {menu.name}
                                      <IGRPIcon
                                        iconName='Check'
                                        className={cn(
                                          'ml-auto opacity-0',
                                          menu.code === field.value && 'opacity-100',
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
                )}

                <IGRPFormFieldPrimitive
                  control={form.control}
                  name='icon'
                  render={({ field }) => (
                    <IGRPFormItemPrimitive className=''>
                      <IGRPFormLabelPrimitive>Icon</IGRPFormLabelPrimitive>
                      <IGRPPopoverPrimitive
                        open={openIconPicker}
                        onOpenChange={setOpenIconPicker}
                      >
                        <IGRPPopoverTriggerPrimitive
                          asChild
                          disabled={openType === MENU_VIEW}
                        >
                          <IGRPFormControlPrimitive>
                            <IGRPButtonPrimitive
                              variant='outline'
                              role='combobox'
                              className={cn(
                                'justify-between',
                                !field.value && 'text-muted-foreground',
                              )}
                            >
                              {currentIcon ? (
                                <div className='flex items-center gap-2'>
                                  <IGRPIcon
                                    iconName={currentIcon.value}
                                    className='size-4'
                                  />
                                  <span>{currentIcon.label}</span>
                                </div>
                              ) : (
                                'Select menu icon...'
                              )}
                              <IGRPIcon
                                iconName='ChevronsUpDown'
                                className='opacity-50'
                              />
                            </IGRPButtonPrimitive>
                          </IGRPFormControlPrimitive>
                        </IGRPPopoverTriggerPrimitive>

                        <IGRPPopoverContentPrimitive
                          className='w-[--radix-popover-trigger-width] p-0'
                          align='start'
                        >
                          <IGRPCommandPrimitive
                            onValueChange={setQuery}
                            filter={() => 1}
                          >
                            {/* Input with loading indicator */}
                            <div className='relative'>
                              <IGRPCommandInputPrimitive placeholder='Procurar ícone...' />
                              {!ready && (
                                <div className='pointer-events-none absolute right-2 top-1/2 -translate-y-1/2'>
                                  <IGRPIcon
                                    iconName='Loader'
                                    className='size-4 animate-spin opacity-60'
                                  />
                                </div>
                              )}
                            </div>

                            {!ready ? (
                              <IGRPCommandListPrimitive className='max-h-80'>
                                <IGRPCommandGroupPrimitive>
                                  {Array.from({ length: 10 }).map((_, i) => (
                                    <div
                                      key={i}
                                      className='h-9 animate-pulse rounded-sm bg-foreground/5 mx-2 my-1'
                                    />
                                  ))}
                                </IGRPCommandGroupPrimitive>
                              </IGRPCommandListPrimitive>
                            ) : (
                              // Ready: render virtualized list
                              <IGRPCommandListPrimitive
                                ref={parentRef}
                                className='max-h-80 overflow-auto'
                              >
                                {filtered.length === 0 ? (
                                  <IGRPCommandEmptyPrimitive>
                                    Nenhum ícone encontrado.
                                  </IGRPCommandEmptyPrimitive>
                                ) : (
                                  <IGRPCommandGroupPrimitive>
                                    <div
                                      style={{
                                        height: rowVirtualizer.getTotalSize(),
                                        width: '100%',
                                        position: 'relative',
                                      }}
                                    >
                                      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                        const iconData = filtered[virtualRow.index];
                                        return (
                                          <div
                                            key={iconData.value}
                                            data-index={virtualRow.index}
                                            style={{
                                              position: 'absolute',
                                              top: 0,
                                              left: 0,
                                              width: '100%',
                                              transform: `translateY(${virtualRow.start}px)`,
                                            }}
                                          >
                                            <IGRPCommandItemPrimitive
                                              // Use both value & label to improve searchability
                                              value={`${iconData.value} ${iconData.label}`}
                                              onSelect={() => {
                                                field.onChange(iconData.value);
                                                setOpenIconPicker(false);
                                              }}
                                              className='py-2.5 gap-3'
                                            >
                                              <div className='flex gap-2'>
                                                {/* Keep the SVG small; this component should be memoized */}
                                                <IGRPIcon iconName={iconData.value} />
                                                <span>{iconData.label}</span>
                                              </div>
                                              <IGRPIcon
                                                iconName='Check'
                                                className={cn(
                                                  'ml-auto size-4 opacity-0',
                                                  iconData.value === field.value && 'opacity-100',
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
                  name='position'
                  render={({ field }) => (
                    <IGRPFormItemPrimitive>
                      <IGRPFormLabelPrimitive>Posição</IGRPFormLabelPrimitive>
                      <IGRPFormControlPrimitive>
                        <IGRPInputPrimitive
                          type='number'
                          min='0'
                          placeholder='0'
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          disabled={openType === MENU_VIEW}
                        />
                      </IGRPFormControlPrimitive>
                      <IGRPFormDescriptionPrimitive>
                        Posição do menu para ordenação.
                      </IGRPFormDescriptionPrimitive>
                      <IGRPFormMessagePrimitive />
                    </IGRPFormItemPrimitive>
                  )}
                />
              </div>
              <IGRPDialogFooterPrimitive>
                <IGRPButtonPrimitive
                  type='button'
                  variant='outline'
                  onClick={() => {
                    form.reset();
                    onOpenChange(false);
                  }}
                  disabled={isLoading}
                >
                  Cancelar
                </IGRPButtonPrimitive>
                {openType !== OPEN_TYPE_VIEW && (
                  <IGRPButtonPrimitive
                    type='submit'
                    disabled={isLoading}
                  >
                    {isLoading ? 'Guardando...' : menu ? 'Atualizar Menu' : 'Criar Menu'}
                  </IGRPButtonPrimitive>
                )}
              </IGRPDialogFooterPrimitive>
            </form>
          </IGRPFormPrimitive>
        </IGRPScrollAreaPrimitive>
      </IGRPDialogContentPrimitive>
    </IGRPDialogPrimitive>
  );
}
