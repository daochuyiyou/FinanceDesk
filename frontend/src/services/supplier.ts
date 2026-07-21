/**
 * 供应商 API 类型定义与服务
 */

import { api } from './api';

/* ── 类型定义 ────────────────────────────────── */

export interface SupplierRecord {
  id: string;
  name: string;
  framework: string | null;
  framework_no: string;
  framework_start_date: string | null;
  framework_end_date: string | null;
  year: number | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface SupplierCreatePayload {
  name: string;
  framework?: string | null;
  framework_no: string;
  framework_start_date?: string | null;
  framework_end_date?: string | null;
  year?: number | null;
}

export interface SupplierUpdatePayload {
  name?: string;
  framework?: string | null;
  framework_no?: string;
  framework_start_date?: string | null;
  framework_end_date?: string | null;
  year?: number | null;
}

/* ── API 函数 ───────────────────────────────── */

export async function fetchSuppliers(page: number, pageSize: number) {
  return api.get<PaginatedResponse<SupplierRecord>>('/suppliers', {
    page,
    page_size: pageSize,
  });
}

export async function createSupplier(data: SupplierCreatePayload) {
  return api.post<SupplierRecord>('/suppliers', data);
}

export async function updateSupplier(id: string, data: SupplierUpdatePayload) {
  return api.patch<SupplierRecord>(`/suppliers/${id}`, data);
}

export async function deleteSupplier(id: string) {
  return api.delete<void>(`/suppliers/${id}`);
}
