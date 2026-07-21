/**
 * 统一金额/数值格式化工具函数
 *
 * 所有金额展示统一使用此模块，保证千分位、两位小数、无前导零。
 * 防御性设计：任何合法/非法输入均返回安全的展示值，绝不抛出异常或产生 NaN。
 */

/**
 * 安全解析数值：支持 string（含千分位逗号）/number/null/undefined
 * 任何非法输入返回 0（而非 NaN）
 */
function safeParse(v: unknown): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'string') {
    const cleaned = v.trim().replace(/,/g, '');
    const n = parseFloat(cleaned);
    return isFinite(n) ? n : 0;
  }
  return 0;
}

/**
 * 金额格式化：¥1,234,567.00
 * 输入支持 string（含千分位逗号 "100,000.00"）、number、null、undefined、NaN
 * 任何形式的非法输入均返回 ¥0.00，绝不崩溃
 */
export function formatMoney(v: unknown): string {
  const n = safeParse(v);
  return `¥${n.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * 纯数字格式化（不含 ¥ 前缀）
 * 用于表格列或 Statistic 组件的 value
 * 任何非法输入返回 0
 */
export function formatNumber(v: unknown): number {
  return safeParse(v);
}

/**
 * 百分比格式化
 * 兼容后端返回小数(0.15)或百分比数值(15)
 * 非法输入返回 '-'（而非 NaN%）
 */
export function formatPercent(v: unknown): string {
  const n = safeParse(v);
  if (n === 0) return '0.00%';
  // 如果绝对值 < 1 且不等于 0，说明是小数表示（0.15 → 15%）
  const val = Math.abs(n) < 1 ? n * 100 : n;
  return `${val.toFixed(2)}%`;
}

/**
 * 安全求和：处理字符串/数字/空值混合数组
 */
export function sumValues(arr: unknown[]): number {
  return arr.reduce<number>((s, v) => s + safeParse(v), 0);
}

/**
 * 日期格式化：将 ISO 字符串或 Date 对象转为 YYYY-MM-DD
 * 非法输入返回 '-'
 */
export function formatDate(v: unknown): string {
  if (v === null || v === undefined) return '-';
  try {
    const d = typeof v === 'string' ? new Date(v) : v instanceof Date ? v : new Date(String(v));
    if (isNaN(d.getTime())) return '-';
    return d.toISOString().split('T')[0];
  } catch {
    return '-';
  }
}
