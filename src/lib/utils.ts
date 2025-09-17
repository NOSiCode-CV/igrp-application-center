import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { STATUS_OPTIONS } from './constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function statusClass(status: string) {
  return status === 'ACTIVE' ? 'status-active' : 'status-inactive';
}

export function getInitials(username: string) {
  const parts = username.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatIconString(input: string): string {
  return input
    .replace(/([A-Z])/g, ' $1')
    .replace(/([0-9]+)/g, ' $1')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatConstanttoLabel(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export const nullIfEmpty = (v: string | null | undefined): string | null =>
  typeof v === 'string' && v.trim().length === 0 ? null : (v ?? null);

export function lowerCaseWithSpace(v: string | null | undefined) {
  if (v == null || v === undefined) return null;

  return typeof v === 'string' ? v.toLowerCase().replace(/_/g, ' ') : (v ?? null);
}

export function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-PT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function showStatus(status: string) {
  if (status == null || status === undefined) return null;
  return STATUS_OPTIONS.find((s) => s.value === status)?.label;
}
