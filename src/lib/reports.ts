import { File } from 'expo-file-system';

import { api } from '@/lib/api';
import type { Category, NotificationItem, Paginated, Report } from '@/types/api';

export type NewReportPhoto = {
  uri: string;
  name: string;
  mimeType: string;
};

export type CreateReportInput = {
  categoryId: number | null;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  photo: NewReportPhoto;
};

export function listCategories(): Promise<{ data: Category[] }> {
  return api.get('/categories');
}

export function listReports(params: { status?: string; sort?: 'newest' | 'most_voted' } = {}): Promise<Paginated<Report>> {
  const query = new URLSearchParams(params as Record<string, string>).toString();
  return api.get(`/reports${query ? `?${query}` : ''}`);
}

export function myReports(params: { status?: string } = {}): Promise<Paginated<Report>> {
  const query = new URLSearchParams(params as Record<string, string>).toString();
  return api.get(`/reports/mine${query ? `?${query}` : ''}`);
}

export function getReport(id: number): Promise<{ data: Report }> {
  return api.get(`/reports/${id}`);
}

export async function createReport(input: CreateReportInput): Promise<{ data: Report }> {
  const form = new FormData();
  if (input.categoryId !== null) form.append('category_id', String(input.categoryId));
  form.append('description', input.description);
  form.append('latitude', String(input.latitude));
  form.append('longitude', String(input.longitude));
  form.append('address', input.address);
  form.append('photo', new File(input.photo.uri) as unknown as Blob, input.photo.name);

  return api.post('/reports', form);
}

export function upvote(reportId: number): Promise<{ votes_count: number }> {
  return api.post(`/reports/${reportId}/upvote`);
}

export function removeUpvote(reportId: number): Promise<{ votes_count: number }> {
  return api.delete(`/reports/${reportId}/upvote`);
}

export function listNotifications(): Promise<Paginated<NotificationItem>> {
  return api.get('/notifications');
}

export function registerDevice(token: string, platform: 'ios' | 'android'): Promise<{ message: string }> {
  return api.post('/devices', { token, platform });
}
