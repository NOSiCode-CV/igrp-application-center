'use client';

import type React from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  IGRPButtonPrimitive,
  IGRPCardPrimitive,
  IGRPCardContentPrimitive,
  IGRPCardDescriptionPrimitive,
  IGRPCardHeaderPrimitive,
  IGRPCardTitlePrimitive,
  IGRPFormPrimitive,
  IGRPFormControlPrimitive,
  IGRPFormDescriptionPrimitive,
  IGRPFormFieldPrimitive,
  IGRPFormItemPrimitive,
  IGRPFormLabelPrimitive,
  IGRPFormMessagePrimitive,
  IGRPInputPrimitive,
  IGRPIcon,
  useIGRPToast,
} from '@igrp/igrp-framework-react-design-system';

import { BackButton } from '@/components/back-button';

import { ROUTES } from '@/lib/constants';
import { useCurrentUser } from '../use-users';
import { UpdateUserArgs, UpdateUserSchema } from '../user-schema';
import { updateUser } from '@/actions/user';
import { ProfileImageUpload } from './user-profile-image-upload';
import { ProfileSignature } from './user-profile-signature';
import { AppCenterLoading } from '@/components/loading';
import { AppCenterNotFound } from '@/components/not-found';

export function ProfileUserForm() {
  const router = useRouter();
  const { igrpToast } = useIGRPToast();

  const { data: user, isLoading, error } = useCurrentUser();

  if (!user) {
    return (
      <AppCenterNotFound
        iconName="User"
        title="Nenhum utilizador encontrada."
      />
    );
  }

  if (isLoading) {
    return <AppCenterLoading descrption="Carregando profile..." />;
  }

  const form = useForm<z.infer<typeof UpdateUserSchema>>({
    resolver: zodResolver(UpdateUserSchema),
  });

  useEffect(() => {
    if (user) {
      const defaultValues: UpdateUserArgs = {
        email: user.email ?? '',
        name: user.name ?? '',
      };

      form.reset(defaultValues);
    }
  }, [user, form]);

  async function onSubmit(values: z.infer<typeof UpdateUserSchema>) {
    const formData = new FormData();
    formData.append('fullname', values.name || '');
    formData.append('email', values.email || '');

    if (values.picture) {
      formData.append('picture', values.picture);
    }

    if (values.signature) {
      formData.append('signature', values.signature);
    }

    user && await updateUser(user.id, formData as any);

    igrpToast({
      type: 'success',
      title: 'Usuario Atualizado',
      description: 'O Usuario foi atualizado com sucesso!',
      duration: 2000,
    });

    router.push(ROUTES.USER_PROFILE);
    router.refresh();
  }

  return (
    <div className='space-y-6 animate-fade-in'>
      <div className='flex flex-col gap-1'>
        <div className='flex items-center gap-2'>
          <BackButton />
          <h3 className='text-2xl font-bold tracking-tight'>Edit User Profile</h3>
        </div>
      </div>

      <IGRPCardPrimitive>
        <IGRPCardHeaderPrimitive className='mb-3'>
          <IGRPCardTitlePrimitive>Detailed information about this user.</IGRPCardTitlePrimitive>
          <IGRPCardDescriptionPrimitive>
            Manage your personal information and account settings.
          </IGRPCardDescriptionPrimitive>
        </IGRPCardHeaderPrimitive>
        <IGRPFormPrimitive {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <IGRPCardContentPrimitive className='flex flex-col gap-8'>
              <div className='grid sm:grid-cols-2 gap-6'>
                <IGRPFormFieldPrimitive
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <IGRPFormItemPrimitive>
                      <IGRPFormLabelPrimitive>Full Name</IGRPFormLabelPrimitive>
                      <IGRPFormControlPrimitive>
                        <IGRPInputPrimitive
                          placeholder='johndoe'
                          {...field}
                          value={field.value ?? ''}
                        />
                      </IGRPFormControlPrimitive>
                      <IGRPFormDescriptionPrimitive>
                        The user full name.
                      </IGRPFormDescriptionPrimitive>
                      <IGRPFormMessagePrimitive />
                    </IGRPFormItemPrimitive>
                  )}
                />

              </div>

              <div className='grid md:grid-cols-2 gap-6'>
                <IGRPFormFieldPrimitive
                  control={form.control}
                  name='picture'
                  render={({ field }) => (
                    <IGRPFormItemPrimitive>
                      <IGRPFormLabelPrimitive>Profile Image</IGRPFormLabelPrimitive>
                      <IGRPFormControlPrimitive>
                        <ProfileImageUpload
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </IGRPFormControlPrimitive>
                      <IGRPFormDescriptionPrimitive>
                        Upload a profile picture for this user.
                      </IGRPFormDescriptionPrimitive>
                      <IGRPFormMessagePrimitive />
                    </IGRPFormItemPrimitive>
                  )}
                />

                <IGRPFormFieldPrimitive
                  control={form.control}
                  name='signature'
                  render={({ field }) => (
                    <IGRPFormItemPrimitive>
                      <IGRPFormLabelPrimitive>Signature</IGRPFormLabelPrimitive>
                      <IGRPFormControlPrimitive>
                        <ProfileSignature
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </IGRPFormControlPrimitive>
                      <IGRPFormDescriptionPrimitive>
                        The user&apos;s digital signature.
                      </IGRPFormDescriptionPrimitive>
                      <IGRPFormMessagePrimitive />
                    </IGRPFormItemPrimitive>
                  )}
                />
              </div>
            </IGRPCardContentPrimitive>
            <IGRPCardHeaderPrimitive className='flex justify-end gap-2 pt-6'>
              <IGRPButtonPrimitive
                variant='outline'
                onClick={() => router.back()}
                disabled={isLoading}
                type='button'
              >
                Cancelar
              </IGRPButtonPrimitive>
              <IGRPButtonPrimitive
                type='submit'
                disabled={isLoading}
              >
                {isLoading ? (
                  <span>
                    <IGRPIcon
                      iconName='Loader'
                      className='mr-2 animate-spin'
                    />
                    Guardarndo...
                  </span>
                ) : user ? (
                  'Atualizar Utilizador'
                ) : (
                  'Criar Utilizador'
                )}
              </IGRPButtonPrimitive>
            </IGRPCardHeaderPrimitive>
          </form>
        </IGRPFormPrimitive>
      </IGRPCardPrimitive>
    </div>
  );
}
