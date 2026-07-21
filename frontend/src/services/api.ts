/**
 * API 基础配置与请求封装
 *
 * 全局拦截器：所有请求失败时记录详细日志，捕获网络错误而非抛给渲染层。
 */

const BASE_URL = '/api/v1';

interface RequestOptions {
  method?: string;
  body?: unknown;
  params?: Record<string, string | number | undefined>;
}

export class ApiError extends Error {
  status: number;
  url: string;
  constructor(message: string, status: number, url: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.url = url;
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params } = options;

  let url = `${BASE_URL}${path}`;
  if (params) {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v!)}`)
      .join('&');
    if (qs) url += `?${qs}`;
  }

  try {
    const res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 204) return undefined as T;
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({ detail: res.statusText }));
      const detail = typeof errBody.detail === 'object' && errBody.detail !== null
        ? JSON.stringify(errBody.detail)
        : errBody.detail;
      throw new ApiError(detail ?? '请求失败', res.status, url);
    }
    return res.json();
  } catch (err) {
    // 网络层错误统一拦截：Failed to fetch, CORS, timeout, DNS 等
    if (err instanceof ApiError) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[API Error] ${method} ${url} — ${msg}`);
    throw new ApiError(msg, 0, url);
  }
}

export const api = {
  get: <T>(path: string, params?: Record<string, string | number | undefined>) =>
    request<T>(path, { params }),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
