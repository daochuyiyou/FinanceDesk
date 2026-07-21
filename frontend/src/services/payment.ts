/* 🅵-2: payment.ts - PaymentRecord.id: string to match collection.ts */
import { api } from './api';

export interface PaymentRecord {
  id: string;
  cost_id: string;
  payment_date: string | null;
  payee: string | null;
  amount: number;
  voucher_no: string | null;
  remark: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface PaymentCreatePayload {
  payment_date?: string | null;
  payee?: string | null;
  amount: number;
  voucher_no?: string | null;
}

export interface PaymentUpdatePayload {
  payment_date?: string | null;
  payee?: string | null;
  amount?: number;
  voucher_no?: string | null;
}

export const createPayment = (orderId: string, costId: string, data: PaymentCreatePayload) =>
  api.post<PaymentRecord>(`/payment/${orderId}/costs/${costId}`, data);

export const updatePayment = (orderId: string, costId: string, paymentId: string, data: PaymentUpdatePayload) =>
  api.patch<PaymentRecord>(`/payment/${orderId}/costs/${costId}/${paymentId}`, data);

export const deletePayment = (orderId: string, costId: string, paymentId: string) =>
  api.delete<void>(`/payment/${orderId}/costs/${costId}/${paymentId}`);

export const fetchAllPayments = (params?: { order_id?: number; page?: number; page_size?: number }) => {
  const q = new URLSearchParams();
  q.set('page', String(params?.page || 1));
  q.set('page_size', String(params?.page_size || 20));
  if (params?.order_id) q.set('order_id', String(params.order_id));
  return api.get<{ items: any[]; total: number; page: number; page_size: number }>('/payments?' + q.toString());
};
