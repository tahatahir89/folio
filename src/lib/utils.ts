import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

export function formatRelative(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  const abs = Math.abs(diff);
  const m = 60_000;
  if (abs < m) return 'Just now';
  if (abs < 60 * m) return rtf.format(Math.round(diff / m), 'minute');
  if (abs < 24 * 60 * m) return rtf.format(Math.round(diff / (60 * m)), 'hour');
  if (abs < 7 * 24 * 60 * m) return rtf.format(Math.round(diff / (24 * 60 * m)), 'day');
  return new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
}

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || '?';

export const readingTime = (words: number) => (words === 0 ? '0 min' : `${Math.max(1, Math.round(words / 200))} min`);
