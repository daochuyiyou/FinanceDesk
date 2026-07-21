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

export const fetchIncomeFlows = (params?: { order_id?: number; page?: number; page_size?: number }) =>
  api.get<{ items: IncomeFlow[]; total: number; page: number; page_size: number }>(params ? `/income-flows?page=${params.page || 1}&page_size=${params.page_size || 20}${params.order_id ? '&order_id=' + params.order_id : ''}` : '/income-flows');

export const createIncomeFlow = (orderId: number, data: any) =>
  api.post<IncomeFlow>(`/orders/${orderId}/incomes`, data);

export const updateIncomeFlow = (orderId: number, flowId: number, data: any) =>
  api.patch<IncomeFlow>(`/orders/${orderId}/incomes/${flowId}`, data);

export const deleteIncomeFlow = (orderId: number, flowId: number) =>
  api.delete(`/orders/${orderId}/incomes/${flowId}`);
