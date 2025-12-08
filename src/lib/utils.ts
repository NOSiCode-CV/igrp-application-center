import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { STATUS_OPTIONS } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Checks if preview mode is enabled from environment variable.
 * Handles whitespace, case sensitivity, and quotes.
 */
export function isPreviewMode(): boolean {
  const rawValue = process.env.IGRP_PREVIEW_MODE;
  const previewModeValue = rawValue
    ?.trim()
    ?.replace(/^["']|["']$/g, "")
    ?.toLowerCase();
  return previewModeValue === "true";
}

export function getStatusColor(status: string) {
  return status === "ACTIVE" ? "status-active" : "status-inactive";
}

export function statusClass(status: string): import("clsx").ClassValue {
  if (!status) return "bg-gray-100 text-gray-800";

  switch (status.toLowerCase().trim()) {
    case "ACTIVE":
      return "bg-emerald-100 text-emerald-800";
    case "INATIVE":
      return "bg-yellow-100 text-yellow-800";
    case "DELETED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function statusInviteClass(status: string): import("clsx").ClassValue {
  if (!status) return "bg-gray-100 text-gray-800";

  switch (status.trim()) {
    case "REJECTED":
      return "bg-rose-100 text-rose-800";
    case "CANCELED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-amber-100 text-amber-800";
  }
}

export const geInviteTitle = (title: string) => {
  switch (title) {
    case "PENDING":
      return "Pendente";
    case "CANCELED":
      return "Cancelado";
    default:
      return "Rejeitado";
  }
};

export function getInitials(username: string) {
  const parts = username?.split(/[\s._-]+/).filter(Boolean);
  if (parts?.length === 0) return "";
  if (parts?.length === 1) return parts[0][0]?.toUpperCase() ?? "";
  return (parts[0][0] + parts[parts?.length - 1][0]).toUpperCase();
}

export function formatIconString(input: string): string {
  return input
    .replace(/([A-Z])/g, " $1")
    .replace(/([0-9]+)/g, " $1")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatConstanttoLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export const nullIfEmpty = (v: string | null | undefined): string | null =>
  typeof v === "string" && v.trim().length === 0 ? null : (v ?? null);

export function lowerCaseWithSpace(v: string | null | undefined) {
  if (v == null || v === undefined) return null;

  return typeof v === "string"
    ? v.toLowerCase().replace(/_/g, " ")
    : (v ?? null);
}

export function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("pt-PT", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function showStatus(status: string) {
  if (status == null || status === undefined) return null;
  return STATUS_OPTIONS.find((s) => s.value === status)?.label;
}

export const getMenuIcon = (type: string) => {
  switch (type) {
    case "FOLDER":
      return "Folder";
    case "EXTERNAL_PAGE":
      return "ExternalLink";
    case "MENU_PAGE":
      return "FileText";
    default:
      return "FileText";
  }
};

export function extractApiError(error: any): string {
  if (error?.details) {
    try {
      const parsed = JSON.parse(error.details);

      if (parsed.errors) {
        const errorMessages = Object.values(parsed.errors).join(", ");
        return errorMessages;
      }

      if (parsed.details) {
        return parsed.details;
      }

      return parsed.title || getDefaultErrorMessage(error.status);
    } catch {
      return error.details;
    }
  }

  if (error?.status) {
    return getDefaultErrorMessage(error.status);
  }

  if (error?.message) {
    return error.message;
  }

  return error?.message || "Erro desconhecido";
}

function getDefaultErrorMessage(status?: number): string {
  switch (status) {
    case 400:
      return "Requisição inválida";
    case 401:
      return "Não autorizado";
    case 403:
      return "Acesso negado";
    case 404:
      return "Recurso não encontrado";
    case 409:
      return "Conflito de dados";
    case 422:
      return "Dados inválidos";
    case 500:
      return "Erro interno do servidor";
    case 502:
      return "Servidor indisponível";
    case 503:
      return "Serviço temporariamente indisponível";
    default:
      return "Erro na operação";
  }
}
