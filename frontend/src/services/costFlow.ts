/* 🅵-3: costFlow.ts - order_id: string to match backend */
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

export const fetchCostFlows = (orderId: string, page = 1, pageSize = 20) =>
  api.get<{ items: CostFlow[]; total: number }>(
    `/orders/${orderId}/costs?page=${page}&page_size=${pageSize}`
  );

export const createCostFlow = (orderId: string, data: Partial<CostFlow>) =>
  api.post<CostFlow>(`/orders/${orderId}/costs`, data);

export const updateCostFlow = (orderId: string, flowId: string, data: Partial<CostFlow>) =>
  api.patch<CostFlow>(`/orders/${orderId}/costs/${flowId}`, data);

export const deleteCostFlow = (orderId: string, flowId: string) =>
  api.delete(`/orders/${orderId}/costs/${flowId}`);
