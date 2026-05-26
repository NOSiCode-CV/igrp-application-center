export function formatSlug(slug: string): string {
  if (slug.startsWith("/apps")) return slug;
  return `/apps/${slug}`;
}

export const APPLICATIONS_TYPES = ["EXTERNAL", "INTERNAL"] as const;

export const APPLICATIONS_TYPES_FILTERED = [
  { value: "EXTERNAL", label: "External" },
  { value: "INTERNAL", label: "Internal" },
] as const;
