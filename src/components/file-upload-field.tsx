"use client";

import {
  cn,
  IGRPButtonPrimitive,
  IGRPFormControlPrimitive,
  IGRPFormDescriptionPrimitive,
  IGRPFormItemPrimitive,
  IGRPFormLabelPrimitive,
  IGRPFormMessagePrimitive,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";
import Image from "next/image";
import { useEffect, useMemo } from "react";
import {
  type FileWithPreview,
  useFileUpload,
} from "../features/files/use-file-upload";

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
    accept = "image/svg+xml,image/png,image/jpeg,image/jpg,image/webp,image/gif",
    label,
    description,
    placeholder = "Arraste sua imagem",
    disabled = false,
    btnLabel = "Selecionar Imagem",
  } = props;

  const maxSize = maxSizeMB * 1024 * 1024;

  const [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      getInputProps,
      clearFiles,
    },
  ] = useFileUpload({
    accept,
    maxSize,
  });

  const current = useMemo<FileWithPreview | null>(() => {
    if (value) return value;
    const f = files[0];
    return f
      ? ({
          id: f.id,
          file: f.file,
          preview: f.preview,
        } as FileWithPreview)
      : null;
  }, [value, files]);

  const previewUrl = current?.preview || null;
  const fileName = current?.file.name || null;

  useEffect(() => {
    if (!onChange) return;
    const f = current;
    if (f) {
      onChange({
        id: f.id,
        file: f.file,
        preview: f.preview,
      } as FileWithPreview);
    }
    if (!f && !value) onChange(null);
  }, [current, value, onChange]);

  // 2) When the external form value is cleared (e.g. reset), clear the hook UI
  useEffect(() => {
    if (!value) {
      try {
        clearFiles?.(); // if your hook supports it
      } catch {
        // safe no-op if not available
      }
    }
  }, [value, clearFiles]);

  const handleRemove = () => {
    // Remove from hook (if present)
    if (files[0]?.id) removeFile(files[0].id);
    // Also clear controlled value
    onChange?.(null);
  };

  return (
    <IGRPFormItemPrimitive>
      {label && <IGRPFormLabelPrimitive>{label}</IGRPFormLabelPrimitive>}

      <IGRPFormControlPrimitive>
        <div className="flex flex-col gap-2">
          <div className="relative">
            <div
              onDragEnter={disabled ? undefined : handleDragEnter}
              onDragLeave={disabled ? undefined : handleDragLeave}
              onDragOver={disabled ? undefined : handleDragOver}
              onDrop={disabled ? undefined : handleDrop}
              data-dragging={isDragging || undefined}
              data-disabled={disabled || undefined}
              className={cn(
                "border-input data-[dragging=true]:bg-accent/50 data-[disabled=true]:opacity-50",
                "data-[disabled=true]:cursor-not-allowed has-[input:focus]:border-ring",
                "has-[input:focus]:ring-ring/50 relative flex flex-col items-center justify-center",
                "overflow-hidden rounded-xl border border-dashed transition-colors",
                "has-[input:focus]:ring-[2px] min-h-25",
              )}
            >
              <input
                {...getInputProps()}
                disabled={disabled}
                className="sr-only"
                aria-label="Selecionar Imagem"
              />

              {previewUrl ? (
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <Image
                    src={previewUrl || "/igrp/placeholder.svg"}
                    alt={fileName || "Atualizar Imagem"}
                    className="mx-auto max-h-full rounded object-contain"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    fill
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center px-4 py-3 text-center">
                  <div
                    className="bg-background mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border"
                    aria-hidden="true"
                  >
                    <IGRPIcon iconName="Image" className="size-4 opacity-60" />
                  </div>
                  <p className="mb-1.5 text-sm font-medium">{placeholder}</p>
                  <p className="text-muted-foreground text-xs">
                    {accept.includes("image")
                      ? "SVG, PNG, JPG, GIF ou WEBP"
                      : "Selecionar imagem"}{" "}
                    (max. {maxSizeMB} MB)
                  </p>
                  <IGRPButtonPrimitive
                    type="button"
                    variant="outline"
                    className="mt-4 bg-transparent"
                    onClick={disabled ? undefined : openFileDialog}
                    disabled={disabled}
                  >
                    <IGRPIcon
                      iconName="Upload"
                      className="-ms-1 size-3.5 opacity-60 text-sm"
                      aria-hidden="true"
                    />
                    {btnLabel}
                  </IGRPButtonPrimitive>
                </div>
              )}
            </div>

            {previewUrl && !disabled && (
              <div className="absolute top-4 right-4">
                <button
                  type="button"
                  className="focus-visible:border-ring focus-visible:ring-ring/50 z-50 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-[color,box-shadow] outline-none hover:bg-black/80 focus-visible:ring-[3px]"
                  onClick={handleRemove}
                  aria-label="Remove file"
                >
                  <IGRPIcon iconName="X" className="size-4" />
                </button>
              </div>
            )}
          </div>

          {errors.length > 0 && (
            <div
              className="text-destructive flex items-center gap-1 text-xs"
              role="alert"
            >
              <IGRPIcon
                iconName="AlertCircleIcon"
                className="size-3 shrink-0"
              />
              <span>{errors[0]}</span>
            </div>
          )}
        </div>
      </IGRPFormControlPrimitive>

      {description && (
        <IGRPFormDescriptionPrimitive>
          {description}
        </IGRPFormDescriptionPrimitive>
      )}
      <IGRPFormMessagePrimitive />
    </IGRPFormItemPrimitive>
  );
}
