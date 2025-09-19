'use client';

import { useEffect, useMemo } from 'react';
import {
  IGRPButtonPrimitive,
  IGRPFormControlPrimitive,
  IGRPFormDescriptionPrimitive,
  IGRPFormItemPrimitive,
  IGRPFormLabelPrimitive,
  IGRPFormMessagePrimitive,
  IGRPIcon,
} from '@igrp/igrp-framework-react-design-system';

import { useFileUpload } from '@/hooks/use-file-upload';

import type { FileWithPreview, FileMetadata } from '@/schemas/file';
import Image from 'next/image';

export interface FileUploadFieldProps {
  value?: FileWithPreview | null;
  onChange?: (file: FileWithPreview | null) => void;
  maxSizeMB?: number;
  accept?: string;
  label?: string;
  description?: string;
  placeholder?: string;
  disabled?: boolean;
  btnLabel?: string;
}

export function FileUploadField(props: FileUploadFieldProps) {
  const {
    value,
    onChange,
    maxSizeMB = 1,
    accept = 'image/svg+xml,image/png,image/jpeg,image/jpg,image/webp',
    label,
    description,
    placeholder = 'Arraste sua imagem',
    disabled = false,
    btnLabel = 'Selecionar Imagem',
  } = props;

  const maxSize = maxSizeMB * 1024 * 1024;

  const isControlled = Object.prototype.hasOwnProperty.call(props, 'value');

  const initialFile: FileMetadata | null = useMemo(() => {
    if (!value) return null;
    return value.file instanceof File
      ? {
          id: value.id,
          name: value.file.name,
          size: value.file.size,
          type: value.file.type,
          url: value.preview ?? '',
        }
      : value.file;
  }, [value]);

  const [
    { file, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      getInputProps,
      setFile,
    },
  ] = useFileUpload({
    accept,
    maxSize,
    initialFile,
    onFileChange: onChange, // for controlled, this notifies parent
    onFileAdded: () => {},
  });

  // Keep internal state in sync with controlled value
  useEffect(() => {
    if (!isControlled) return;

    // Parent cleared value → clear internal file
    if (!value && file) {
      removeFile();
      return;
    }

    // Parent set/changed value → mirror it internally
    if (value) {
      const currentId = file?.id;
      if (currentId !== value.id) {
        // setFile accepts File | FileMetadata (based on your hook)
        setFile(value.file instanceof File ? value.file : value.file);
      }
    }
  }, [isControlled, value, file, removeFile, setFile]);

  const previewUrl = file?.preview ?? null;
  const fileName = file?.file instanceof File ? file.file.name : (file?.file?.name ?? null);

  return (
    <IGRPFormItemPrimitive>
      {label && <IGRPFormLabelPrimitive>{label}</IGRPFormLabelPrimitive>}

      <IGRPFormControlPrimitive>
        <div className='flex flex-col gap-2'>
          <div className='relative'>
            <div
              onDragEnter={disabled ? undefined : handleDragEnter}
              onDragLeave={disabled ? undefined : handleDragLeave}
              onDragOver={disabled ? undefined : handleDragOver}
              onDrop={disabled ? undefined : handleDrop}
              data-dragging={isDragging || undefined}
              data-disabled={disabled || undefined}
              className='border-input data-[dragging=true]:bg-accent/50 data-[disabled=true]:opacity-50 data-[disabled=true]:cursor-not-allowed has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed transition-colors has-[input:focus]:ring-[2px] min-h-25'
            >
              <input
                {...getInputProps()}
                disabled={disabled}
                className='sr-only'
                aria-label='Selecionar Imagem'
              />

              {previewUrl ? (
                <div className='absolute inset-0 flex items-center justify-center p-4'>
                  <Image
                    src={previewUrl || '/igrp/placeholder.svg'}
                    alt={fileName || 'Atualizar imagem'}
                    className='mx-auto max-h-full rounded object-contain'
                  />
                </div>
              ) : (
                <div className='flex flex-col items-center justify-center px-4 py-3 text-center'>
                  <div
                    className='bg-background mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border'
                    aria-hidden='true'
                  >
                    <IGRPIcon
                      iconName='Image'
                      className='size-4 opacity-60'
                    />
                  </div>
                  <p className='mb-1.5 text-sm font-medium'>{placeholder}</p>
                  <p className='text-muted-foreground text-xs'>
                    {accept.includes('image') ? 'SVG, PNG, JPG ou WEBP' : 'Selecionar imagem'} (max.{' '}
                    {maxSizeMB} MB)
                  </p>
                  <IGRPButtonPrimitive
                    type='button'
                    variant='outline'
                    className='mt-4 bg-transparent'
                    onClick={disabled ? undefined : openFileDialog}
                    disabled={disabled}
                  >
                    <IGRPIcon
                      iconName='Upload'
                      className='-ms-1 size-3.5 opacity-60 text-sm'
                      aria-hidden='true'
                    />
                    {btnLabel}
                  </IGRPButtonPrimitive>
                </div>
              )}
            </div>

            {previewUrl && !disabled && (
              <div className='absolute top-4 right-4'>
                <button
                  type='button'
                  className='focus-visible:border-ring focus-visible:ring-ring/50 z-50 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-[color,box-shadow] outline-none hover:bg-black/80 focus-visible:ring-[3px]'
                  onClick={() => removeFile()}
                  aria-label='Remove file'
                >
                  <IGRPIcon
                    iconName='X'
                    className='size-4'
                    aria-hidden='true'
                  />
                </button>
              </div>
            )}
          </div>

          {errors.length > 0 && (
            <div
              className='text-destructive flex items-center gap-1 text-xs'
              role='alert'
            >
              <IGRPIcon
                iconName='AlertCircleIcon'
                className='size-3 shrink-0'
              />
              <span>{errors[0]}</span>
            </div>
          )}
        </div>
      </IGRPFormControlPrimitive>

      {description && <IGRPFormDescriptionPrimitive>{description}</IGRPFormDescriptionPrimitive>}
      <IGRPFormMessagePrimitive />
    </IGRPFormItemPrimitive>
  );
}
