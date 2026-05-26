import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";

export function formatSlug(slug: string): string {
  if (slug.startsWith("/apps")) return slug;
  return `/apps/${slug}`;
}

export const APPLICATIONS_TYPES = ["EXTERNAL", "INTERNAL"] as const;

export const APPLICATIONS_TYPES_FILTERED = [
  { value: "EXTERNAL", label: "External" },
  { value: "INTERNAL", label: "Internal" },
] as const;

export function isSystemApp(app: Pick<ApplicationDTO, "type">): boolean {
  return (app.type as string) === "SYSTEM";
}

export const APP_DESCRIPTION_FALLBACK = "Sem descrição.";
