/**
 * 订单管理 API 类型定义与服务
 */

import { api } from './api';

/* ── 类型定义 ────────────────────────────────── */

export interface OrderRecord {
  id: string;
  project_id: string;
  supplier_id: string;
  order_no: string;
  order_name: string | null;
  order_date: string | null;
  amount: number;
  non_tax_amount: number | null;
  erp_no: string | null;
  mobile_project_no: string | null;
  order_type: string | null;
  mobile_contact: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface OrderCreatePayload {
  project_id: number;
  supplier_id: number;
  order_no: string;
  order_name?: string | null;
  order_date?: string | null;
  amount: number;
  non_tax_amount?: number | null;
  erp_no?: string | null;
  mobile_project_no?: string | null;
  order_type?: string | null;
  mobile_contact?: string | null;
  status?: string | null;
}

export interface OrderUpdatePayload {
  supplier_id?: number;
  order_no?: string;
  order_name?: string | null;
  order_date?: string | null;
  amount?: number;
  non_tax_amount?: number | null;
  erp_no?: string | null;
  mobile_project_no?: string | null;
  order_type?: string | null;
  mobile_contact?: string | null;
  status?: string | null;
}

/* ── API 函数 ───────────────────────────────── */

export async function fetchOrders(page: number, pageSize: number, projectId?: string) {
  const params: Record<string, string | number | undefined> = {
    page,
    page_size: pageSize,
  };
  if (projectId) params.project_id = projectId;
  return api.get<{
    items: OrderRecord[];
    total: number;
    page: number;
    page_size: number;
  }>('/orders', params);
}

export async function fetchOrdersByProject(projectId: string) {
  return api.get<OrderRecord[]>(`/projects/${projectId}/orders`);
}

export async function createOrder(data: OrderCreatePayload) {
  const payload = {
    ...data,
    // 确保 string→number 转换（前端 Select 可能绑定字符串值）
    project_id: Number(data.project_id),
    supplier_id: data.supplier_id != null ? Number(data.supplier_id) : undefined,
  };
  return api.post<OrderRecord>('/orders', payload);
}

export async function updateOrder(id: string, data: OrderUpdatePayload) {
  const payload = {
    ...data,
    supplier_id: data.supplier_id != null ? Number(data.supplier_id) : undefined,
  };
  return api.patch<OrderRecord>(`/orders/${id}`, payload);
}

export async function deleteOrder(id: string) {
  return api.delete<void>(`/orders/${id}`);
}
