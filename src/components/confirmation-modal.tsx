"use client";

import {
  IGRPAlertDialogPrimitive,
  IGRPAlertDialogContentPrimitive,
  IGRPAlertDialogHeaderPrimitive,
  IGRPAlertDialogTitlePrimitive,
  IGRPAlertDialogDescriptionPrimitive,
  IGRPAlertDialogFooterPrimitive,
  IGRPButton,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";
import { ReactNode } from "react";

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
    <IGRPAlertDialogPrimitive open={open} onOpenChange={onOpenChange}>
      <IGRPAlertDialogContentPrimitive>
        <IGRPAlertDialogHeaderPrimitive>
          <IGRPAlertDialogTitlePrimitive>{title}</IGRPAlertDialogTitlePrimitive>
          <IGRPAlertDialogDescriptionPrimitive>
            {description}
          </IGRPAlertDialogDescriptionPrimitive>
        </IGRPAlertDialogHeaderPrimitive>
        <IGRPAlertDialogFooterPrimitive>
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
            className={
              variant === "destructive"
                ? "bg-destructive hover:bg-destructive/90 gap-2 text-white"
                : "gap-2"
            }
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <IGRPIcon
                  iconName="LoaderCircle"
                  className="w-4 h-4 animate-spin"
                  strokeWidth={2}
                />
                {loadingText}
              </>
            ) : (
              <>
                <IGRPIcon
                  iconName={
                    variant === "destructive" ? (iconName ?? "Trash") : "Check"
                  }
                  className="w-4 h-4"
                  strokeWidth={2}
                />
                {confirmText}
              </>
            )}
          </IGRPButton>
        </IGRPAlertDialogFooterPrimitive>
      </IGRPAlertDialogContentPrimitive>
    </IGRPAlertDialogPrimitive>
  );
}
