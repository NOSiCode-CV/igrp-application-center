'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import {
  IGRPCardPrimitive,
  IGRPCardContentPrimitive,
  IGRPCardFooterPrimitive,
  IGRPSelectTriggerPrimitive,
  IGRPFormPrimitive,
  IGRPFormFieldPrimitive,
  IGRPFormItemPrimitive,
  IGRPFormLabelPrimitive,
  IGRPFormControlPrimitive,
  IGRPFormMessagePrimitive,
  IGRPFormDescriptionPrimitive,
  IGRPInputPrimitive,
  IGRPSelectPrimitive,
  IGRPSelectContentPrimitive,
  IGRPSelectItemPrimitive,
  IGRPSelectValuePrimitive,
  IGRPTextAreaPrimitive,
  useIGRPToast,
  IGRPButton,
} from '@igrp/igrp-framework-react-design-system';
import { IGRPApplicationArgs } from '@igrp/framework-next-types';

import { FileUploadField } from '@/components/file-upload-field';
import { AppCenterLoading } from '@/components/loading';
import { ROUTES } from '@/lib/constants';
import { urlToFileWithPreview } from '@/lib/file-adapters';
import {
  useCreateApplication,
  useUpdateApplication,
} from '@/features/applications/use-applications';
import {
  ApplicationArgs,
  appTypeCrud,
  applicationSchema,
} from '@/features/applications/app-schemas';
import { useUsers } from '@/features/users/use-users';
import { useDepartments } from '@/features/departments/use-departments';
import { APPLICATIONS_TYPES_FILTERED } from '../app-utils';
import { mapperUpdateApplication } from '../app-mapper';
import { statusSchema } from '@/schemas/global';

export function ApplicationForm({ application }: { application?: IGRPApplicationArgs }) {
  const router = useRouter();
  const { igrpToast } = useIGRPToast();

  const { data: users, isLoading: userLoading, error: userError } = useUsers();
  const {
    data: departments,
    isLoading: departmentLoading,
    error: departmentError,
  } = useDepartments();

  const { mutateAsync: addApplication } = useCreateApplication();
  const { mutateAsync: updateApplication } = useUpdateApplication();

  const form = useForm<ApplicationArgs>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      name: '',
      slug: '',
      type: appTypeCrud.enum.INTERNAL,
      owner: '',
      description: '',
      code: '',
      url: '',
      picture: '',
      status: statusSchema.enum.ACTIVE,
      departmentCode: '',
      image: null,
    },
    mode: 'onChange',
  });

  const type = form.watch('type');

  useEffect(() => {
    if (!application) return;

    const defaultValues: Partial<ApplicationArgs> = {
      name: application.name || '',
      owner: application.owner || '',
      code: application.code || '',
      slug: application.slug || '',
      url: application.url || '',
      description: application.description || '',
      type: application.type || appTypeCrud.enum.INTERNAL,
      picture: application.picture || '',
      status: application.status || statusSchema.enum.ACTIVE,
      departmentCode: application.departmentCode || '',
      image: null,
    };

    form.reset(defaultValues);

    (async () => {
      if (application.picture) {
        const fw = await urlToFileWithPreview(application.picture);
        form.setValue('image', fw, { shouldDirty: false, shouldValidate: false });
      }
    })();
  }, [application, form]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue('name', name);

    if (!application || form.getValues('slug') === '') {
      const slug = name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
      form.setValue('slug', slug);
    }
  };

  const onSubmit = async (values: ApplicationArgs) => {
    const payload = { ...values };

    // const file = values.image?.file;
    // const imageFile =
    //   file instanceof File
    //     ? file
    //     : file?.file instanceof File
    //       ? file.file
    //       : undefined;

    if (payload.type === appTypeCrud.enum.INTERNAL) delete payload.url;
    if (payload.type === appTypeCrud.enum.EXTERNAL) delete payload.slug;
    delete payload.image;

    try {
      if (application) {
        const payloadData = mapperUpdateApplication(payload);
        await updateApplication({ code: application.code, data: payloadData });
      } else {
        await addApplication(payload);
        form.reset();
      }

      igrpToast({
        type: 'success',
        title: `${application ? ' Atualização' : 'Criação'} concluída`,
        description: `A aplicação foi ${application ? ' atualizada' : 'criada'} com sucesso!`,
        duration: 3500,
      });

      setTimeout(() => {
        router.push(`${ROUTES.APPS}/${payload.code}`);
      }, 4000);
    } catch (error) {
      igrpToast({
        type: 'error',
        title: 'Não foi possível concluir a operação.',
        description: error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.',
      });
    }
  };

  const isLoading = userLoading || !users || !departments || departmentLoading;

  if (isLoading) return <AppCenterLoading descrption='A preparar dados da aplicação...' />;
  if (userError) throw userError;
  if (departmentError) throw departmentError;

  const userOptions = users.map((user) => {
    return {
      value: user.username,
      label: user.name,
    };
  });


  const departmentOptions = departments.map((department) => {
    return {
      value: department.code,
      label: department.name,
    };
  });

  const disabledFields = application ? true : false;

  const disabledBtn =
    form.formState.isSubmitting ||
    isLoading ||
    userLoading ||
    userError !== null ||
    departmentLoading ||
    departmentError !== null;

  const submitLblBtn = form.formState.isSubmitting ? 'Guardando...' : 'Guardar';

  return (
    <IGRPCardPrimitive className='py-6'>
      <IGRPFormPrimitive {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <IGRPCardContentPrimitive>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
              <IGRPFormFieldPrimitive
                control={form.control}
                name='name'
                render={({ field }) => (
                  <IGRPFormItemPrimitive>
                    <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive'>
                      Nome
                    </IGRPFormLabelPrimitive>
                    <IGRPFormControlPrimitive>
                      <IGRPInputPrimitive
                        placeholder='Nome da Aplicação'
                        {...field}
                        onChange={handleNameChange}
                        required
                        className='placeholder:truncate border-primary/30 focus-visible:ring-[2px] focus-visible:ring-primary/30 focus-visible:border-primary/30'
                      />
                    </IGRPFormControlPrimitive>
                    <IGRPFormDescriptionPrimitive>
                      O nome da sua aplicação.
                    </IGRPFormDescriptionPrimitive>
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
                        placeholder='APP_CODE'
                        {...field}
                        pattern='^[A-Z0-9_]+$'
                        onFocus={() => form.trigger('code')}
                        className='placeholder:truncate border-primary/30 focus-visible:ring-[2px] focus-visible:ring-primary/30 focus-visible:border-primary/30'
                      />
                    </IGRPFormControlPrimitive>
                    <IGRPFormDescriptionPrimitive>
                      Permite letras maiúsculas, números e sublinhados.
                    </IGRPFormDescriptionPrimitive>
                    <IGRPFormMessagePrimitive />
                  </IGRPFormItemPrimitive>
                )}
              />

              <IGRPFormFieldPrimitive
                control={form.control}
                name='owner'
                render={({ field }) => (
                  <IGRPFormItemPrimitive>
                    <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive'>
                      Proprietário
                    </IGRPFormLabelPrimitive>
                    <IGRPSelectPrimitive
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <IGRPFormControlPrimitive>
                        <IGRPSelectTriggerPrimitive className='w-full truncate'>
                          <IGRPSelectValuePrimitive placeholder='Selecione o proprietário' />
                        </IGRPSelectTriggerPrimitive>
                      </IGRPFormControlPrimitive>
                      <IGRPSelectContentPrimitive>
                        {userOptions.map((user) => (
                          <IGRPSelectItemPrimitive
                            key={user.value}
                            value={user.value}
                          >
                            {user.label}
                          </IGRPSelectItemPrimitive>
                        ))}
                      </IGRPSelectContentPrimitive>
                    </IGRPSelectPrimitive>

                    {userError ? (
                      <p className='text-destructive'>{userError}</p>
                    ) : (
                      <>
                        <IGRPFormDescriptionPrimitive>
                          O Responsável pela criação.
                        </IGRPFormDescriptionPrimitive>
                        <IGRPFormMessagePrimitive />
                      </>
                    )}
                  </IGRPFormItemPrimitive>
                )}
              />

              <IGRPFormFieldPrimitive
                control={form.control}
                name='departmentCode'
                render={({ field }) => (
                  <IGRPFormItemPrimitive>
                    <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive'>
                      Departamento
                    </IGRPFormLabelPrimitive>
                    <IGRPSelectPrimitive
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <IGRPFormControlPrimitive>
                        <IGRPSelectTriggerPrimitive
                          className='w-full truncate'
                          disabled={disabledFields}
                        >
                          <IGRPSelectValuePrimitive placeholder='Selecione o departamento' />
                        </IGRPSelectTriggerPrimitive>
                      </IGRPFormControlPrimitive>
                      <IGRPSelectContentPrimitive>
                        {departmentOptions.map((department) => (
                          <IGRPSelectItemPrimitive
                            key={department.value}
                            value={department.value}
                          >
                            {department.label}
                          </IGRPSelectItemPrimitive>
                        ))}
                      </IGRPSelectContentPrimitive>
                    </IGRPSelectPrimitive>
                    {departmentError ? (
                      <p className='text-destructive'>{departmentError}</p>
                    ) : (
                      <>
                        <IGRPFormDescriptionPrimitive>
                          Departemento para aplicação.
                        </IGRPFormDescriptionPrimitive>
                        <IGRPFormMessagePrimitive />
                      </>
                    )}
                  </IGRPFormItemPrimitive>
                )}
              />

              <IGRPFormFieldPrimitive
                control={form.control}
                name='type'
                render={({ field }) => (
                  <IGRPFormItemPrimitive>
                    <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive'>
                      Tipo
                    </IGRPFormLabelPrimitive>
                    <IGRPSelectPrimitive
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <IGRPFormControlPrimitive>
                        <IGRPSelectTriggerPrimitive
                          className='w-full truncate'
                          disabled={disabledFields}
                        >
                          <IGRPSelectValuePrimitive placeholder='Selecione o tipo de aplicação' />
                        </IGRPSelectTriggerPrimitive>
                      </IGRPFormControlPrimitive>
                      <IGRPSelectContentPrimitive>
                        {APPLICATIONS_TYPES_FILTERED.map((opt, index) => (
                          <IGRPSelectItemPrimitive
                            key={index}
                            value={opt.value}
                          >
                            {opt.label}
                          </IGRPSelectItemPrimitive>
                        ))}
                      </IGRPSelectContentPrimitive>
                    </IGRPSelectPrimitive>
                    <IGRPFormDescriptionPrimitive>
                      O tipo de aplicação.
                    </IGRPFormDescriptionPrimitive>
                    <IGRPFormMessagePrimitive />
                  </IGRPFormItemPrimitive>
                )}
              />

              {type === 'INTERNAL' && (
                <IGRPFormFieldPrimitive
                  control={form.control}
                  name='slug'
                  render={({ field }) => (
                    <IGRPFormItemPrimitive>
                      <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive'>
                        URL Relativo
                      </IGRPFormLabelPrimitive>
                      <IGRPFormControlPrimitive>
                        <IGRPInputPrimitive
                          placeholder='app-exemplo'
                          {...field}
                          disabled={disabledFields}
                          className='placeholder:truncate border-primary/30 focus-visible:ring-[2px] focus-visible:ring-primary/30 focus-visible:border-primary/30'
                        />
                      </IGRPFormControlPrimitive>
                      <IGRPFormDescriptionPrimitive>O URL interno.</IGRPFormDescriptionPrimitive>
                      <IGRPFormMessagePrimitive />
                    </IGRPFormItemPrimitive>
                  )}
                />
              )}

              {type === 'EXTERNAL' && (
                <IGRPFormFieldPrimitive
                  control={form.control}
                  name='url'
                  render={({ field }) => (
                    <IGRPFormItemPrimitive>
                      <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive'>
                        URL
                      </IGRPFormLabelPrimitive>
                      <IGRPFormControlPrimitive>
                        <IGRPInputPrimitive
                          placeholder='https://exemplo.com'
                          {...field}
                          disabled={disabledFields}
                          className='placeholder:truncate border-primary/30 focus-visible:ring-[2px] focus-visible:ring-primary/30 focus-visible:border-primary/30'
                        />
                      </IGRPFormControlPrimitive>
                      <IGRPFormDescriptionPrimitive>
                        URL da aplicação externa.
                      </IGRPFormDescriptionPrimitive>
                      <IGRPFormMessagePrimitive />
                    </IGRPFormItemPrimitive>
                  )}
                />
              )}

              <IGRPFormFieldPrimitive
                control={form.control}
                name='image'
                render={({ field }) => (
                  <FileUploadField
                    value={field.value ?? null}
                    onChange={field.onChange}
                    maxSizeMB={1}
                    disabled={form.formState.isSubmitting}
                    btnLabel='Selecionar Logo'
                    placeholder='Arraste seu logo aqui'
                  />
                )}
              />

              <IGRPFormFieldPrimitive
                control={form.control}
                name='description'
                render={({ field }) => (
                  <IGRPFormItemPrimitive className='lg:col-span-2'>
                    <IGRPFormLabelPrimitive className='after:content-["*"] after:text-destructive'>
                      Descrição
                    </IGRPFormLabelPrimitive>
                    <IGRPFormControlPrimitive>
                      <IGRPTextAreaPrimitive
                        placeholder='Descreva a sua aplicação'
                        required={true}
                        rows={2}
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        className='resize-none placeholder:truncate border-primary/30 focus-visible:ring-[2px] focus-visible:ring-primary/30 focus-visible:border-primary/30'
                      />
                    </IGRPFormControlPrimitive>
                    <IGRPFormDescriptionPrimitive>
                      Uma breve descrição da sua aplicação.
                    </IGRPFormDescriptionPrimitive>
                    <IGRPFormMessagePrimitive />
                  </IGRPFormItemPrimitive>
                )}
              />
            </div>
          </IGRPCardContentPrimitive>

          <IGRPCardFooterPrimitive className='justify-end pt-6 gap-3 flex-col sm:flex-row'>
            <IGRPButton
              variant='outline'
              onClick={() => router.push(ROUTES.APPS)}
              type='button'
              disabled={disabledBtn}
              showIcon
              iconPlacement='start'
              iconName='Undo2'
              className='gap-1 w-full sm:max-w-36'
            >
              Cancelar
            </IGRPButton>
            <IGRPButton
              type='submit'
              disabled={disabledBtn}
              showIcon
              iconPlacement='end'
              loading={isLoading}
              iconName='Check'
              className='gap-1 w-full sm:max-w-36'
            >
              {submitLblBtn}
            </IGRPButton>
          </IGRPCardFooterPrimitive>
        </form>
      </IGRPFormPrimitive>
    </IGRPCardPrimitive>
  );
}
