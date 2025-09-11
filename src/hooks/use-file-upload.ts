'use client';

import type React from 'react';
import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type InputHTMLAttributes,
} from 'react';

import type { FileWithPreview, FileMetadata } from '@/schemas/file';

// export type FileMetadata = {
//   name: string;
//   size: number;
//   type: string;
//   url: string;
//   id: string;
// };

// export type FileWithPreview = {
//   file: File | FileMetadata;
//   id: string;
//   preview?: string;
// };

export type FileUploadOptions = {
  maxSize?: number; // in bytes
  accept?: string;
  initialFile?: FileMetadata | null;
  onFileChange?: (file: FileWithPreview | null) => void;
  onFileAdded?: (file: FileWithPreview) => void;
};

export type FileUploadState = {
  file: FileWithPreview | null;
  isDragging: boolean;
  errors: string[];
};

export type FileUploadActions = {
  setFile: (file: File | FileMetadata) => void;
  removeFile: () => void;
  clearErrors: () => void;
  handleDragEnter: (e: DragEvent<HTMLElement>) => void;
  handleDragLeave: (e: DragEvent<HTMLElement>) => void;
  handleDragOver: (e: DragEvent<HTMLElement>) => void;
  handleDrop: (e: DragEvent<HTMLElement>) => void;
  handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  openFileDialog: () => void;
  getInputProps: (
    props?: InputHTMLAttributes<HTMLInputElement>,
  ) => InputHTMLAttributes<HTMLInputElement> & {
    ref: React.Ref<HTMLInputElement>;
  };
};

export const useFileUpload = (
  options: FileUploadOptions = {},
): [FileUploadState, FileUploadActions] => {
  const {
    maxSize = Infinity,
    accept = '*',
    initialFile = null,
    onFileChange,
    onFileAdded,
  } = options;

  const [state, setState] = useState<FileUploadState>({
    file: initialFile ? { file: initialFile, id: initialFile.id, preview: initialFile.url } : null,
    isDragging: false,
    errors: [],
  });

  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File | FileMetadata): string | null => {
      const size = file instanceof File ? file.size : file.size;

      if (size > maxSize) {
        return `Ficheiro "${file.name}" excede o tamanho máximo de ${formatBytes(maxSize)}.`;
      }

      if (accept !== '*') {
        const acceptedTypes = accept.split(',').map((type) => type.trim());
        const fileType = file instanceof File ? file.type || '' : file.type;
        const fileName = file instanceof File ? file.name : file.name;
        const fileExtension = `.${fileName.split('.').pop() ?? ''}`.toLowerCase();

        const isAccepted = acceptedTypes.some((type) => {
          if (type.startsWith('.')) {
            return fileExtension.toLowerCase() === type.toLowerCase();
          }
          if (type.endsWith('/*')) {
            const baseType = type.split('/')[0];
            return fileType.startsWith(`${baseType}/`);
          }
          return fileType === type;
        });

        if (!isAccepted) {
          return `Ficheiro "${file instanceof File ? file.name : file.name}" não é um tipo de arquivo aceite.`;
        }
      }

      return null;
    },
    [accept, maxSize],
  );

  const createPreview = useCallback((file: File | FileMetadata): string | undefined => {
    if (file instanceof File) {
      return URL.createObjectURL(file);
    }
    return file.url;
  }, []);

  const generateUniqueId = useCallback((file: File | FileMetadata): string => {
    if (file instanceof File) {
      return `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    return file.id;
  }, []);

  const revokeIfNeeded = (f: FileWithPreview | null) => {
    if (f && f.preview && f.file instanceof File && f.file.type.startsWith('image/')) {
      URL.revokeObjectURL(f.preview);
    }
  };

  const clearInput = () => {
    if (inputRef.current) inputRef.current.value = '';
  };

  const setFile = useCallback(
    (file: File | FileMetadata) => {
      const error = validateFile(file);
      if (error) {
        setState((prev) => ({ ...prev, errors: [error] }));
        clearInput();
        return;
      }

      const next: FileWithPreview = {
        file,
        id: generateUniqueId(file),
        preview: createPreview(file),
      };

      setState((prev) => {
        // Clean old preview if needed
        revokeIfNeeded(prev.file);

        const newState = { ...prev, file: next, errors: [] };
        onFileAdded?.(next);
        onFileChange?.(next);
        return newState;
      });

      clearInput();
    },
    [validateFile, generateUniqueId, createPreview, onFileAdded, onFileChange],
  );

  const removeFile = useCallback(() => {
    setState((prev) => {
      revokeIfNeeded(prev.file);
      const newState = { ...prev, file: null, errors: [] };
      onFileChange?.(null);
      return newState;
    });
    clearInput();
  }, [onFileChange]);

  const clearErrors = useCallback(() => {
    setState((prev) => ({ ...prev, errors: [] }));
  }, []);

  const handleDragEnter = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setState((p) => ({ ...p, isDragging: true }));
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setState((p) => ({ ...p, isDragging: false }));
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setState((p) => ({ ...p, isDragging: false }));
      if (inputRef.current?.disabled) return;

      const dt = e.dataTransfer;
      if (dt?.files && dt.files.length > 0) {
        setFile(dt.files[0]); // single file only
      }
    },
    [setFile],
  );

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) setFile(f);
    },
    [setFile],
  );

  const openFileDialog = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const getInputProps = useCallback(
    (props: InputHTMLAttributes<HTMLInputElement> = {}) => ({
      ...props,
      type: 'file' as const,
      onChange: handleFileChange,
      accept: props.accept || accept,
      multiple: false as const,
      ref: inputRef,
    }),
    [accept, handleFileChange],
  );

  return [
    state,
    {
      setFile,
      removeFile,
      clearErrors,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      handleFileChange,
      openFileDialog,
      getInputProps,
    },
  ];
};

// Helper function to format bytes to human-readable format
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + sizes[i];
};
