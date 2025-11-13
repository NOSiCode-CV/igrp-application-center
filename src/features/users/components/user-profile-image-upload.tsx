'use client';

import Image from 'next/image';
import type React from 'react';
import { useState, useCallback, useEffect } from 'react';

interface ImageUploadProps {
  value?: File | string | null;
  onChange?: (file: File | null) => void;
  alt?: string;
}

export function ProfileImageUpload({ value = null, onChange = () => {} }: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Handle initial value
  useEffect(() => {
    if (!value) {
      setPreviewUrl(null);
      return;
    }

    // If value is already a string URL, use it directly
    if (typeof value === 'string') {
      setPreviewUrl(value);
      return;
    }

    // Otherwise create an object URL from the File
    try {
      const objectUrl = URL.createObjectURL(value);
      setPreviewUrl(objectUrl);

      return () => {
        // Only revoke if we created an object URL (not for string URLs)
        if (typeof value !== 'string') {
          URL.revokeObjectURL(objectUrl);
        }
      };
    } catch (error) {
      console.error('Error creating object URL:', error);
      return;
    }
  }, [value]);

  // Completely rewritten function to avoid instanceof issues
  const createSafeObjectURL = useCallback((file: File): string | null => {
    // First check if file exists
    if (!file) {
      return null;
    }

    // Check if it has the necessary properties of a File or Blob
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

    // Clean up previous preview URL
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    if (file) {
      const objectURL = createSafeObjectURL(file);
      setPreviewUrl(objectURL);
      // Ensure onChange is a function before calling it
      if (typeof onChange === 'function') {
        onChange(file);
      }
    } else {
      setPreviewUrl(null);
      // Ensure onChange is a function before calling it
      if (typeof onChange === 'function') {
        onChange(null);
      }
    }
  };

  // Clean up on unmount
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
            {/* <img src={previewUrl || '/placeholder.svg'} alt='Profile preview' className='h-full w-full object-cover' /> */}
            <Image
              src={previewUrl || '/placeholder.svg'}
              alt='Profile preview'
              className='h-full w-full object-cover'
              width={100}
              height={100}
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
