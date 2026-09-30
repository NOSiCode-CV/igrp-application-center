"use client";

import type { ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  IGRPButton,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string | ReactNode;
  onConfirm: () => void;
  isLoading?: boolean;
  confirmText?: string;
  cancelText?: string;
  iconName?: string;
  loadingText?: string;
  variant?: "default" | "destructive";
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  isLoading = false,
  iconName = "Trash",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  loadingText = "Processando...",
  variant = "destructive",
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <IGRPButton
            type="button"
            variant="outline"
            showIcon
            iconPlacement="start"
            iconName="X"
            disabled={isLoading}
            onClick={() => onOpenChange(false)}
          >
            {cancelText}
          </IGRPButton>
          <IGRPButton
            variant={variant}
            className="gap-2"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <IGRPIcon
                  iconName="LoaderCircle"
                  className="size-4 animate-spin motion-reduce:animate-none"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                {loadingText}
              </>
            ) : (
              <>
                <IGRPIcon
                  iconName={
                    variant === "destructive" ? (iconName ?? "Trash") : "Check"
                  }
                  className="size-4"
                  strokeWidth={2}
                />
                {confirmText}
              </>
            )}
          </IGRPButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
