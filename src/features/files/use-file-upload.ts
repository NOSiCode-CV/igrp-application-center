"use client";

import {
  type ChangeEvent,
  type DragEvent,
  type InputHTMLAttributes,
  useCallback,
  useRef,
  useState,
} from "react";

import type { FileWithPreview } from "./files-schemas";

/**
 * Single-file pick / drop with an object-URL preview (the one shape
 * `FileUploadField` uses). `errors` only signals "too large"; the field shows
 * its own translated message.
 */
export function useFileUpload({
  accept = "*",
  maxSize = Infinity,
}: {
  accept?: string;
  maxSize?: number;
} = {}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDragging, setDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const revoke = (list: FileWithPreview[]) => {
    for (const f of list) if (f.preview) URL.revokeObjectURL(f.preview);
  };

  const clearFiles = useCallback(() => {
    setFiles((prev) => {
      revoke(prev);
      return [];
    });
    setErrors([]);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const addFile = useCallback(
    (file: File) => {
      clearFiles();
      if (file.size > maxSize) {
        setErrors(["tooLarge"]);
        return;
      }
      setFiles([
        {
          file,
          id: `${file.name}-${Date.now()}`,
          preview: URL.createObjectURL(file),
        },
      ]);
    },
    [clearFiles, maxSize],
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      revoke(prev.filter((f) => f.id === id));
      return prev.filter((f) => f.id !== id);
    });
    setErrors([]);
  }, []);

  const stop = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = useCallback((e: DragEvent<HTMLElement>) => {
    stop(e);
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLElement>) => {
    stop(e);
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
  }, []);

  const handleDragOver = useCallback(stop, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLElement>) => {
      stop(e);
      setDragging(false);
      if (inputRef.current?.disabled) return;
      const file = e.dataTransfer.files?.[0];
      if (file) addFile(file);
    },
    [addFile],
  );

  const openFileDialog = useCallback(() => inputRef.current?.click(), []);

  const getInputProps = useCallback(
    (props: InputHTMLAttributes<HTMLInputElement> = {}) => ({
      ...props,
      type: "file" as const,
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) addFile(file);
      },
      accept: props.accept || accept,
      multiple: false,
      ref: inputRef,
    }),
    [accept, addFile],
  );

  return [
    { files, isDragging, errors },
    {
      removeFile,
      clearFiles,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      getInputProps,
    },
  ] as const;
}
