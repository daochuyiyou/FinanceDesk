import { api } from './api';

export interface CostFlow {
  id: number;
  order_id: string;
  supplier_id: number | null;
  cost_party: string | null;
  cost_type: string;
  tax_rate: number | null;
  taxable_amount: number;
  non_taxable_amount: number;
  cost_subject: string | null;
  budget_item: string | null;
  remark: string | null;
  status: string;
}

export const fetchCostFlows = (params?: { order_id?: number; supplier_id?: number; page?: number; page_size?: number }) => {
  const query = new URLSearchParams();
  query.set('page', String(params?.page || 1));
  query.set('page_size', String(params?.page_size || 20));
  if (params?.order_id) query.set('order_id', String(params.order_id));
  if (params?.supplier_id) query.set('supplier_id', String(params.supplier_id));
  return api.get<{ items: CostFlow[]; total: number; page: number; page_size: number }>('/cost-flows?' + query.toString());
};

export const createCostFlow = (orderId: number, data: any) =>
  api.post<CostFlow>(`/orders/${orderId}/costs`, data);

export const updateCostFlow = (orderId: number, flowId: number, data: any) =>
  api.patch<CostFlow>(`/orders/${orderId}/costs/${flowId}`, data);

export const deleteCostFlow = (orderId: number, flowId: number) =>
  api.delete(`/orders/${orderId}/costs/${flowId}`);
