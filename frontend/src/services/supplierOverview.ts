/* 🅵-1: supplierOverview.ts - kill the `any[]` */
/**
 * 供应商年度概况 + 三合一批量导入
 */
import { api } from './api';

export interface SupplierOverviewRecord {
  vendor_id: string;
  vendor_name: string;
  framework_no: string;
  framework_start_date: string | null;
  framework_end_date: string | null;
  laborer_unit_price: number | null;
  technician_unit_price: number | null;
  senior_technician_unit_price: number | null;
  comprehensive_unit_price: number | null;
  status: string; // NEW | RENEWED | EXITED
}

export interface BatchImportRow {
  vendor_name: string;
  framework_no: string;
  framework_start_date?: string | null;
  framework_end_date?: string | null;
  laborer_unit_price?: number | null;
  technician_unit_price?: number | null;
  senior_technician_unit_price?: number | null;
  comprehensive_unit_price?: number | null;
  status?: string;
}

export async function fetchSupplierOverview(year: number) {
  return api.get<SupplierOverviewRecord[]>('/overview', { year });
}

export async function batchImportSuppliers(year: number, data: BatchImportRow[]) {
  return api.post<{ success: number; fail: number; errors: string[] }>('/overview/batch-import', { year, data });
}
