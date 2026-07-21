/* 🅵-1: supplierUnitPrice.ts - kill the `any` */
import { api } from './api';

export interface SupplierUnitPriceRecord {
  id: number;
  supplier_id: number;
  year: number;
  laborer_price: number | null;
  technician_price: number | null;
  senior_technician_price: number | null;
  special_work_price: number | null;
  comprehensive_price: number | null;
  remark: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface SupplierUnitPriceCreatePayload {
  supplier_id: number;
  year: number;
  laborer_price?: number | null;
  technician_price?: number | null;
  senior_technician_price?: number | null;
  special_work_price?: number | null;
  comprehensive_price?: number | null;
  remark?: string | null;
}

export const fetchSupplierUnitPrices = (params?: { supplier_id?: number; year?: number; page?: number; page_size?: number }) => {
  const q = new URLSearchParams();
  q.set('page', String(params?.page || 1));
  q.set('page_size', String(params?.page_size || 20));
  if (params?.supplier_id) q.set('supplier_id', String(params.supplier_id));
  if (params?.year) q.set('year', String(params.year));
  return api.get<{ items: SupplierUnitPriceRecord[]; total: number; page: number; page_size: number }>('/supplier-unit-prices?' + q.toString());
};

export const createSupplierUnitPrice = (data: SupplierUnitPriceCreatePayload) =>
  api.post<SupplierUnitPriceRecord>('/supplier-unit-prices', data);

export const updateSupplierUnitPrice = (id: number, data: Partial<SupplierUnitPriceCreatePayload>) =>
  api.patch<SupplierUnitPriceRecord>(`/supplier-unit-prices/${id}`, data);

export const deleteSupplierUnitPrice = (id: number) =>
  api.delete<void>(`/supplier-unit-prices/${id}`);
