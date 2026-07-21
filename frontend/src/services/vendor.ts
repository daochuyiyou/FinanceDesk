/**
 * Vendor API
 */
import { api } from './api';

export interface VendorRecord {
  id: string;
  name: string;
  remark: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface VendorCreatePayload {
  name: string;
  remark?: string | null;
}

export interface VendorUpdatePayload {
  name?: string;
  remark?: string | null;
}

export interface PaginatedVendors {
  items: VendorRecord[];
  total: number;
  page: number;
  page_size: number;
}

export async function fetchVendors(page = 1, pageSize = 200) {
  return api.get<PaginatedVendors>('/vendors', { page, page_size: pageSize });
}
export async function createVendor(data: VendorCreatePayload) {
  return api.post<VendorRecord>('/vendors', data);
}
export async function updateVendor(id: string, data: VendorUpdatePayload) {
  return api.patch<VendorRecord>('/vendors/' + id, data);
}
export async function deleteVendor(id: string) {
  return api.delete<void>('/vendors/' + id);
}
