import type { Category, ReportStatus } from '@/types/api';

type Translate = (key: string, params?: Record<string, string | number>) => string;

export function timeAgo(iso: string, t: Translate): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return t('common.justNow');
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t('common.minutesAgo', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('common.hoursAgo', { count: hours });
  return t('common.daysAgo', { count: Math.floor(hours / 24) });
}

export function statusLabel(status: ReportStatus, t: Translate): string {
  return t(`status.${status}`);
}

/**
 * Categories come from the API with an English name. The default ones are
 * translated by slug; any category an administrator adds later falls back to
 * the name it was given in the panel.
 */
export function categoryName(category: Category, t: Translate): string {
  const key = `categories.${category.slug}`;
  const translated = t(key);
  return translated === key ? category.name : translated;
}
