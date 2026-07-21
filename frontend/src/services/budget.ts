/**
 * 预算编制 & 预算调整 API 类型定义与服务
 *
 * 后端实际路径（嵌套在项目下）：
 *   GET /projects/{projectId}/budgets?page=&page_size=
 *   POST /projects/{projectId}/budgets
 *   PATCH /projects/{projectId}/budgets/{id}
 *   DELETE /projects/{projectId}/budgets/{id}
 *
 *   GET /projects/{projectId}/adjustments?page=&page_size=
 *   POST /projects/{projectId}/adjustments
 *   PATCH /projects/{projectId}/adjustments/{id}
 *   DELETE /projects/{projectId}/adjustments/{id}
 */

import { api } from './api';

/* ════════════════════════════════════════════════════════════════
   预算编制
   ════════════════════════════════════════════════════════════════ */

export interface BudgetRecord {
  id: string;
  project_id: string;
  budget_type: string;
  labor_budget: number;
  material_budget: number;
  management_budget: number;
  gross_margin_rate: number | null;
  preparation_date: string | null;
  preparer: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface BudgetCreatePayload {
  budget_type?: string;
  labor_budget?: number;
  material_budget?: number;
  management_budget?: number;
  gross_margin_rate?: number | null;
  preparation_date?: string | null;
  preparer?: string | null;
}

export interface BudgetUpdatePayload {
  budget_type?: string;
  labor_budget?: number;
  material_budget?: number;
  management_budget?: number;
  gross_margin_rate?: number | null;
  preparation_date?: string | null;
  preparer?: string | null;
}

export async function fetchBudgets(projectId: string, page: number, pageSize: number) {
  return api.get<{
    items: BudgetRecord[];
    total: number;
    page: number;
    page_size: number;
  }>(`/projects/${projectId}/budgets`, { page, page_size: pageSize });
}

export async function createBudget(projectId: string, data: BudgetCreatePayload) {
  return api.post<BudgetRecord>(`/projects/${projectId}/budgets`, data);
}

export async function updateBudget(
  projectId: string,
  budgetId: string,
  data: BudgetUpdatePayload,
) {
  return api.patch<BudgetRecord>(`/projects/${projectId}/budgets/${budgetId}`, data);
}

export async function deleteBudget(projectId: string, budgetId: string) {
  return api.delete<void>(`/projects/${projectId}/budgets/${budgetId}`);
}

/* ════════════════════════════════════════════════════════════════
   预算调整
   ════════════════════════════════════════════════════════════════ */

export interface AdjustmentRecord {
  id: string;
  project_id: string;
  adjustment_date: string | null;
  adjustment_reason: string | null;
  adjustment_amount: number;
  remark: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface AdjustmentCreatePayload {
  adjustment_date?: string | null;
  adjustment_reason?: string | null;
  adjustment_amount: number;
  remark?: string | null;
}

export interface AdjustmentUpdatePayload {
  adjustment_date?: string | null;
  adjustment_reason?: string | null;
  adjustment_amount?: number;
  remark?: string | null;
}

export async function fetchAdjustments(projectId: string, page: number, pageSize: number) {
  return api.get<{
    items: AdjustmentRecord[];
    total: number;
    page: number;
    page_size: number;
  }>(`/projects/${projectId}/adjustments`, { page, page_size: pageSize });
}

export async function createAdjustment(projectId: string, data: AdjustmentCreatePayload) {
  return api.post<AdjustmentRecord>(`/projects/${projectId}/adjustments`, data);
}

export async function updateAdjustment(
  projectId: string,
  adjustmentId: string,
  data: AdjustmentUpdatePayload,
) {
  return api.patch<AdjustmentRecord>(
    `/projects/${projectId}/adjustments/${adjustmentId}`,
    data,
  );
}

export async function deleteAdjustment(projectId: string, adjustmentId: string) {
  return api.delete<void>(`/projects/${projectId}/adjustments/${adjustmentId}`);
}
