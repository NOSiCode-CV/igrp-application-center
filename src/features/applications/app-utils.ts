//TODO: review this if is not fullname
export const formattedName = (userName: string) =>
  userName
    .split('.')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

// TDOD: add locale

export const typeClass = (type: string) =>
  type === 'INTERNAL' ? 'bg-primary/10 text-primary' : 'bg-muted-foreground text-muted';

export function formatSlug(slug: string): string {
  if (slug.startsWith('/apps')) {
    return slug;
  }

  return `/apps/${slug}`;
}

export const APPLICATIONS_TYPES = ['EXTERNAL', 'INTERNAL', 'SYSTEM'] as const;

export const APPLICATIONS_TYPES_EXCLUDE = ['EXTERNAL', 'INTERNAL'] as const;

export const APPLICATIONS_TYPES_FILTERED = [
  { value: 'EXTERNAL', label: 'External' },
  { value: 'INTERNAL', label: 'Internal' },
] as const;
