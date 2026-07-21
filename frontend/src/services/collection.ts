/**
 * 收入流水 / 成本流水 / 回款 / 支付 API 类型定义与服务
 */

import { api } from './api';
export { fetchOrdersByProject } from './order';
export type { OrderRecord } from './order';

/* ════════════════════════════════════════════════════════════════
   收入流水 IncomeFlow
   ════════════════════════════════════════════════════════════════ */

export interface IncomeFlowRecord {
  id: string;
  order_id: string;
  invoice_count: number;
  tax_rate: number | null;
  taxable_amount: number;
  non_taxable_amount: number;
  invoice_date: string | null;
  invoice_no: string | null;
  remark: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface IncomeFlowCreatePayload {
  invoice_count?: number;
  tax_rate?: number | null;
  taxable_amount?: number;
  non_taxable_amount?: number;
  invoice_date?: string | null;
  invoice_no?: string | null;
  remark?: string | null;
  status?: string;
}

export interface IncomeFlowUpdatePayload {
  invoice_count?: number;
  tax_rate?: number | null;
  taxable_amount?: number;
  non_taxable_amount?: number;
  invoice_date?: string | null;
  invoice_no?: string | null;
  remark?: string | null;
  status?: string;
}

export async function fetchIncomeFlows(
  orderId: string,
  page: number,
  pageSize: number,
) {
  return api.get<{
    items: IncomeFlowRecord[];
    total: number;
    page: number;
    page_size: number;
  }>(`/orders/${orderId}/incomes`, { page, page_size: pageSize });
}

export async function createIncomeFlow(orderId: string, data: IncomeFlowCreatePayload) {
  return api.post<IncomeFlowRecord>(`/orders/${orderId}/incomes`, data);
}

export async function updateIncomeFlow(
  orderId: string,
  flowId: string,
  data: IncomeFlowUpdatePayload,
) {
  return api.patch<IncomeFlowRecord>(`/orders/${orderId}/incomes/${flowId}`, data);
}

export async function deleteIncomeFlow(orderId: string, flowId: string) {
  return api.delete<void>(`/orders/${orderId}/incomes/${flowId}`);
}

/* ════════════════════════════════════════════════════════════════
   成本流水 CostFlow
   ════════════════════════════════════════════════════════════════ */

export interface CostFlowRecord {
  id: string;
  order_id: string;
  cost_party: string | null;
  cost_type: string;
  tax_rate: number | null;
  taxable_amount: number;
  non_taxable_amount: number;
  cost_subject: string | null;
  budget_item: string | null;
  remark: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface CostFlowCreatePayload {
  supplier_id?: number | null;
  cost_party?: string | null;
  cost_type?: string;
  tax_rate?: number | null;
  taxable_amount?: number;
  non_taxable_amount?: number;
  cost_subject?: string | null;
  budget_item?: string | null;
  remark?: string | null;
  status?: string;
}

export interface CostFlowUpdatePayload {
  cost_party?: string | null;
  cost_type?: string;
  tax_rate?: number | null;
  taxable_amount?: number;
  non_taxable_amount?: number;
  cost_subject?: string | null;
  budget_item?: string | null;
  remark?: string | null;
  status?: string;
}

export async function fetchCostFlows(orderId: string, page: number, pageSize: number) {
  return api.get<{
    items: CostFlowRecord[];
    total: number;
    page: number;
    page_size: number;
  }>(`/orders/${orderId}/costs`, { page, page_size: pageSize });
}

export async function createCostFlow(orderId: string, data: CostFlowCreatePayload) {
  return api.post<CostFlowRecord>(`/orders/${orderId}/costs`, data);
}

export async function updateCostFlow(
  orderId: string,
  flowId: string,
  data: CostFlowUpdatePayload,
) {
  return api.patch<CostFlowRecord>(`/orders/${orderId}/costs/${flowId}`, data);
}

export async function deleteCostFlow(orderId: string, flowId: string) {
  return api.delete<void>(`/orders/${orderId}/costs/${flowId}`);
}

/* ════════════════════════════════════════════════════════════════
   回款 Collection
   ════════════════════════════════════════════════════════════════ */

export interface CollectionRecord {
  id: string;
  flow_id: string;
  collection_date: string | null;
  amount: number;
  receipt_no: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface CollectionCreatePayload {
  collection_date?: string | null;
  amount: number;
  receipt_no?: string | null;
}

export interface CollectionUpdatePayload {
  collection_date?: string | null;
  amount?: number;
  receipt_no?: string | null;
}

export async function fetchCollections(orderId: string, flowId: string) {
  return api.get<{
    items: CollectionRecord[];
    total: number;
    page: number;
    page_size: number;
  }>(`/collection/${orderId}/incomes/${flowId}`, {
    page: 1,
    page_size: 200,
  });
}

export async function createCollection(
  orderId: string,
  flowId: string,
  data: CollectionCreatePayload,
) {
  return api.post<CollectionRecord>(
    `/collection/${orderId}/incomes/${flowId}`,
    data,
  );
}

export async function updateCollection(
  orderId: string,
  flowId: string,
  collectionId: string,
  data: CollectionUpdatePayload,
) {
  return api.patch<CollectionRecord>(
    `/collection/${orderId}/incomes/${flowId}/${collectionId}`,
    data,
  );
}

export async function deleteCollection(
  orderId: string,
  flowId: string,
  collectionId: string,
) {
  return api.delete<void>(
    `/collection/${orderId}/incomes/${flowId}/${collectionId}`,
  );
}

/* ════════════════════════════════════════════════════════════════
   支付 Payment
   ════════════════════════════════════════════════════════════════ */

export interface PaymentRecord {
  id: string;
  cost_id: string;
  payment_date: string | null;
  payee: string | null;
  voucher_no: string | null;
  amount: number;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface PaymentCreatePayload {
  payment_date?: string | null;
  payee?: string | null;
  voucher_no?: string | null;
  amount: number;
}

export async function fetchPayments(orderId: string, flowId: string) {
  return api.get<{
    items: PaymentRecord[];
    total: number;
    page: number;
    page_size: number;
  }>(`/payment/${orderId}/costs/${flowId}`, {
    page: 1,
    page_size: 200,
  });
}

export async function createPayment(
  orderId: string,
  flowId: string,
  data: PaymentCreatePayload,
) {
  return api.post<PaymentRecord>(
    `/payment/${orderId}/costs/${flowId}`,
    data,
  );
}

// ── Global list APIs ──
export const fetchAllCollections = (params?: { order_id?: number; page?: number; page_size?: number }) => {
  const q = new URLSearchParams();
  q.set('page', String(params?.page || 1));
  q.set('page_size', String(params?.page_size || 20));
  if (params?.order_id) q.set('order_id', String(params.order_id));
  return api.get<any>('/collections?' + q.toString());
};

export const fetchAllPayments = (params?: { order_id?: number; page?: number; page_size?: number }) => {
  const q = new URLSearchParams();
  q.set('page', String(params?.page || 1));
  q.set('page_size', String(params?.page_size || 20));
  if (params?.order_id) q.set('order_id', String(params.order_id));
  return api.get<any>('/payments?' + q.toString());
};
