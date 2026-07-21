/**
 * 供应商年度综合单价 API（宽表格式）
 * GET/POST/PATCH/DELETE /api/v1/vendors/{sid}/year-prices
 */

import { api } from './api';

export interface SupplierYearPriceRecord {
  id: string;
  vendor_id: string;
  year: number | null;
  laborer_unit_price: number | null;
  technician_unit_price: number | null;
  senior_technician_unit_price: number | null;
  special_work_type: string | null;
  special_work_price: number | null;
  comprehensive_unit_price: number | null;
  remark: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface SupplierYearPriceCreatePayload {
  year: number;
  laborer_unit_price?: number | null;
  technician_unit_price?: number | null;
  senior_technician_unit_price?: number | null;
  special_work_type?: string | null;
  special_work_price?: number | null;
  comprehensive_unit_price?: number | null;
  remark?: string | null;
}

export interface SupplierYearPriceUpdatePayload {
  year?: number;
  laborer_unit_price?: number | null;
  technician_unit_price?: number | null;
  senior_technician_unit_price?: number | null;
  special_work_type?: string | null;
  special_work_price?: number | null;
  comprehensive_unit_price?: number | null;
  remark?: string | null;
}

export interface PaginatedSupplierYearPrices {
  items: SupplierYearPriceRecord[];
  total: number;
  page: number;
  page_size: number;
}

export async function fetchSupplierYearPrices(supplierId: string, page = 1, pageSize = 200) {
  return api.get<PaginatedSupplierYearPrices>(`/vendors/${supplierId}/year-prices`, { page, page_size: pageSize });
}

export async function createSupplierYearPrice(supplierId: string, data: SupplierYearPriceCreatePayload) {
  return api.post<SupplierYearPriceRecord>(`/vendors/${supplierId}/year-prices`, data);
}

export async function updateSupplierYearPrice(supplierId: string, priceId: string, data: SupplierYearPriceUpdatePayload) {
  return api.patch<SupplierYearPriceRecord>(`/vendors/${supplierId}/year-prices/${priceId}`, data);
}

export async function deleteSupplierYearPrice(supplierId: string, priceId: string) {
  return api.delete<void>(`/vendors/${supplierId}/year-prices/${priceId}`);
}