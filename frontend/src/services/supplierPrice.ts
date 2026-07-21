/**
 * 供应商单价 API 类型定义与服务
 *
 * 路径：/api/v1/suppliers/{supplier_id}/prices
 */

import { api } from './api';

/* ── 类型定义 ────────────────────────────────── */

export interface SupplierPriceRecord {
  id: string;
  supplier_id: string;
  work_type: string;
  unit_price: string | null;
  remark: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface SupplierPriceCreatePayload {
  work_type: string;
  unit_price?: string | null;
  remark?: string | null;
}

export interface SupplierPriceUpdatePayload {
  work_type?: string;
  unit_price?: string | null;
  remark?: string | null;
}

export interface PaginatedSupplierPrices {
  items: SupplierPriceRecord[];
  total: number;
  page: number;
  page_size: number;
}

/* ── API 函数 ───────────────────────────────── */

export async function fetchSupplierPrices(
  supplierId: string,
  page: number = 1,
  pageSize: number = 200,
) {
  return api.get<PaginatedSupplierPrices>(
    `/suppliers/${supplierId}/prices`,
    { page, page_size: pageSize },
  );
}

export async function createSupplierPrice(
  supplierId: string,
  data: SupplierPriceCreatePayload,
) {
  return api.post<SupplierPriceRecord>(
    `/suppliers/${supplierId}/prices`,
    data,
  );
}

export async function updateSupplierPrice(
  supplierId: string,
  priceId: string,
  data: SupplierPriceUpdatePayload,
) {
  return api.patch<SupplierPriceRecord>(
    `/suppliers/${supplierId}/prices/${priceId}`,
    data,
  );
}

export async function deleteSupplierPrice(
  supplierId: string,
  priceId: string,
) {
  return api.delete<void>(
    `/suppliers/${supplierId}/prices/${priceId}`,
  );
}
