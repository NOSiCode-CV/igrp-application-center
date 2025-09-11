'use client';

import type React from 'react';
import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';

interface ImageUploadProps {
  value?: File | string | null;
  onChange?: (file: File | null) => void;
  alt?: string;
}

export function Upload({ value = null, onChange = () => {} }: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setPreviewUrl(null);
      return;
    }

    if (typeof value === 'string') {
      setPreviewUrl(value);
      return;
    }

    try {
      const objectUrl = URL.createObjectURL(value);
      setPreviewUrl(objectUrl);

      return () => {
        if (typeof value !== 'string') {
          URL.revokeObjectURL(objectUrl);
        }
      };
    } catch (error) {
      console.error('Error creating object URL:', error);
      return;
    }
  }, [value]);

  const createSafeObjectURL = useCallback((file: File): string | null => {
    if (!file) {
      return null;
    }

    if (typeof file !== 'object' || !('size' in file) || !('type' in file)) {
      return null;
    }

    try {
      return URL.createObjectURL(file);
    } catch (error) {
      console.error('Error creating object URL:', error);
      return null;
    }
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;

    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    if (file) {
      const objectURL = createSafeObjectURL(file);
      setPreviewUrl(objectURL);
      if (typeof onChange === 'function') {
        onChange(file);
      }
    } else {
      setPreviewUrl(null);
      if (typeof onChange === 'function') {
        onChange(null);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className='flex flex-col gap-2'>
      <input
        type='file'
        accept='image/*'
        onChange={handleFileChange}
        className='hidden'
        id='profile-image-upload'
      />
      <div className='flex items-center gap-4'>
        {previewUrl ? (
          <div className='relative h-24 w-24 overflow-hidden rounded-full border'>
            <Image
              src={previewUrl || '/placeholder.svg'}
              alt='Profile preview'
              className='h-full w-full object-cover'
            />
          </div>
        ) : (
          <div className='flex h-24 w-24 items-center justify-center rounded-full border bg-muted'>
            <span className='text-sm text-muted-foreground'>No image</span>
          </div>
        )}
        <div className='flex flex-col gap-2'>
          <label
            htmlFor='profile-image-upload'
            className='inline-flex h-9 cursor-pointer items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90'
          >
            Upload image
          </label>
          {previewUrl && (
            <button
              type='button'
              onClick={() => {
                if (previewUrl && previewUrl.startsWith('blob:')) {
                  URL.revokeObjectURL(previewUrl);
                }
                setPreviewUrl(null);
                // Ensure onChange is a function before calling it
                if (typeof onChange === 'function') {
                  onChange(null);
                }
              }}
              className='inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground'
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
