/**
 * 合同（Project）API 类型定义与服务
 *
 * BDD-01 F1 更新：新增 contract_no, owner_name, contract_type 等字段
 */

import { api } from './api';

/* ── 类型定义 ───────────────────────────────────── */

export interface ProjectRecord {
  id: string;
  framework_name: string;
  contract_no: string | null;
  contract_type: string;
  owner_name: string;
  owner_contact: string | null;
  owner_phone: string | null;
  contract_amount: number | null;
  budget_amount: number | null;
  sign_date: string | null;
  start_date: string | null;
  end_date: string | null;
  contract_year: number | null;
  department: string | null;
  manager: string | null;
  internal_or_external: string;
  project_type: string;
  status: string | null;
  remark: string | null;
  erp_no: string | null;
  total_order_amount: number;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface ProjectCreatePayload {
  framework_name: string;
  contract_no: string;
  contract_type: string;
  owner_name: string;
  owner_contact?: string | null;
  owner_phone?: string | null;
  contract_amount?: number | null;
  budget_amount?: number | null;
  sign_date?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  contract_year?: number | null;
  department?: string | null;
  manager?: string | null;
  internal_or_external: string;
  project_type?: string;
  status?: string;
  remark?: string | null;
}

export interface ProjectUpdatePayload {
  framework_name?: string;
  contract_no?: string;
  contract_type?: string;
  owner_name?: string;
  owner_contact?: string | null;
  owner_phone?: string | null;
  contract_amount?: number | null;
  budget_amount?: number | null;
  sign_date?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  contract_year?: number | null;
  department?: string | null;
  manager?: string | null;
  internal_or_external?: string;
  project_type?: string;
  status?: string;
  remark?: string | null;
}

/* ── API 函数 ──────────────────────────────────── */

export async function fetchProjects(page: number, pageSize: number) {
  return api.get<PaginatedResponse<ProjectRecord>>('/projects', {
    page,
    page_size: pageSize,
  });
}

export async function getProject(id: number) {
  return api.get<ProjectRecord>('/projects/' + id);
}

export async function createProject(data: ProjectCreatePayload) {
  return api.post<ProjectRecord>('/projects', data);
}

export async function updateProject(id: string, data: ProjectUpdatePayload) {
  return api.patch<ProjectRecord>(`/projects/${id}`, data);
}

export async function deleteProject(id: string) {
  return api.delete<void>(`/projects/${id}`);
}
