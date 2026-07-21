/* 🅵-3: incomeFlow.ts - order_id: string to match backend */
import { api } from './api';

export interface IncomeFlow {
  id: number;
  order_id: string;
  invoice_count: number;
  tax_rate: number | null;
  taxable_amount: number;
  non_taxable_amount: number;
  invoice_date: string | null;
  invoice_no: string | null;
  remark: string | null;
  status: string;
}

export const fetchIncomeFlows = (orderId: string, page = 1, pageSize = 20) =>
  api.get<{ items: IncomeFlow[]; total: number }>(
    `/orders/${orderId}/incomes?page=${page}&page_size=${pageSize}`
  );

export const createIncomeFlow = (orderId: string, data: Partial<IncomeFlow>) =>
  api.post<IncomeFlow>(`/orders/${orderId}/incomes`, data);

export const updateIncomeFlow = (orderId: string, flowId: string, data: Partial<IncomeFlow>) =>
  api.patch<IncomeFlow>(`/orders/${orderId}/incomes/${flowId}`, data);

export const deleteIncomeFlow = (orderId: string, flowId: string) =>
  api.delete(`/orders/${orderId}/incomes/${flowId}`);
