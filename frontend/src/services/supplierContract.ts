/* 🅵-1: supplierContract.ts - kill the `any` */
import { api } from './api';

export interface SupplierContractRecord {
  id: number;
  supplier_id: number;
  contract_no: string;
  sign_date: string | null;
  start_date: string | null;
  end_date: string | null;
  amount: number | null;
  status: string | null;
  remark: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface SupplierContractCreatePayload {
  supplier_id: number;
  contract_no: string;
  sign_date?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  amount?: number | null;
  status?: string | null;
  remark?: string | null;
}

export const fetchSupplierContracts = (params?: { supplier_id?: number; page?: number; page_size?: number }) => {
  const q = new URLSearchParams();
  q.set('page', String(params?.page || 1));
  q.set('page_size', String(params?.page_size || 20));
  if (params?.supplier_id) q.set('supplier_id', String(params.supplier_id));
  return api.get<{ items: SupplierContractRecord[]; total: number; page: number; page_size: number }>('/supplier-contracts?' + q.toString());
};

export const createSupplierContract = (data: SupplierContractCreatePayload) =>
  api.post<SupplierContractRecord>('/supplier-contracts', data);

export const updateSupplierContract = (id: number, data: Partial<SupplierContractCreatePayload>) =>
  api.patch<SupplierContractRecord>(`/supplier-contracts/${id}`, data);

export const deleteSupplierContract = (id: number) =>
  api.delete<void>(`/supplier-contracts/${id}`);
