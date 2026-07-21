/**
 * 数据字典 API 服务
 */

import { api } from './api';

/* ── 类型定义 ────────────────────────────────── */

export interface DictItem {
  id: number;
  category: string;
  value: string;
  label: string | null;
  sort_order: number | null;
}

export interface DictCategory {
  category: string;
  label: string;
  count: number;
}

export interface DictListResponse {
  items: DictItem[];
  total: number;
}

export interface DictCreatePayload {
  category: string;
  value: string;
  label?: string | null;
  sort_order?: number | null;
}

export interface DictUpdatePayload {
  category?: string;
  value?: string;
  label?: string | null;
  sort_order?: number | null;
}

/* ── API 函数 ───────────────────────────────── */

export async function fetchCategories() {
  return api.get<DictCategory[]>('/dict-categories');
}

export async function fetchDictItems(category: string) {
  return api.get<DictListResponse>(`/dict/${category}`);
}

export async function createDictItem(category: string, data: DictCreatePayload) {
  return api.post<DictItem>(`/dict/${category}`, data);
}

export async function updateDictItem(category: string, id: number, data: DictUpdatePayload) {
  return api.put<DictItem>(`/dict/${category}/${id}`, data);
}

export async function deleteDictItem(category: string, id: number) {
  return api.delete<void>(`/dict/${category}/${id}`);
}
