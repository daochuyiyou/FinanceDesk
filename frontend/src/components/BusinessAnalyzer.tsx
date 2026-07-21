import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { ObjectSelector } from './ObjectSelector';

// ── Types ──

export interface AnalyzerFilters {
  owner?: string;
  contractType?: string;
  contractStatus?: string;
  orderStatus?: string;
  revenueStatus?: string;
  costStatus?: string;
}

export interface AnalyzerState {
  period: string;
  dimension: 'company' | 'contract' | 'project' | 'order';
  objectId: string | null;
  filters: AnalyzerFilters;
}

export interface AnalyzerContextType {
  state: AnalyzerState;
  setPeriod: (period: string) => void;
  setDimension: (dim: AnalyzerState['dimension']) => void;
  setObjectId: (id: string | null) => void;
  setFilter: (key: keyof AnalyzerFilters, value: string) => void;
  reset: () => void;
}

// ── Defaults ──

const DEFAULT_PERIOD = '2026-06';

const DEFAULT_STATE: AnalyzerState = {
  period: DEFAULT_PERIOD,
  dimension: 'company',
  objectId: null,
  filters: {},
};

const STORAGE_KEY = 'fd_analyzer_state';

// ── Persistence ──

function loadState(): AnalyzerState | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function saveState(state: AnalyzerState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

function initFromUrl(): Partial<AnalyzerState> {
  try {
    const params = new URLSearchParams(window.location.search);
    const p: Partial<AnalyzerState> = {};
    const period = params.get('period');
    if (period) p.period = period;
    const dim = params.get('dimension');
    if (dim && ['company', 'contract', 'project', 'order'].includes(dim)) {
      p.dimension = dim as AnalyzerState['dimension'];
    }
    const obj = params.get('object');
    if (obj) p.objectId = obj;
    return p;
  } catch {
    return {};
  }
}

function syncToUrl(state: AnalyzerState) {
  try {
    const params = new URLSearchParams();
    if (state.period) params.set('period', state.period);
    if (state.dimension) params.set('dimension', state.dimension);
    if (state.objectId) params.set('object', state.objectId);
    const qs = params.toString();
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, '', url);
  } catch {}
}

// ── Init priority: URL > localStorage > default ──

function initState(): AnalyzerState {
  const urlPartial = initFromUrl();
  if (urlPartial.period && urlPartial.dimension) {
    return { ...DEFAULT_STATE, ...urlPartial };
  }
  const saved = loadState();
  if (saved) {
    return { ...DEFAULT_STATE, ...saved };
  }
  return DEFAULT_STATE;
}

// ── Context ──

const AnalyzerContext = createContext<AnalyzerContextType | null>(null);

export function useAnalyzer(): AnalyzerContextType {
  const ctx = useContext(AnalyzerContext);
  if (!ctx) throw new Error('useAnalyzer must be used within AnalyzerProvider');
  return ctx;
}

// ── Period options ──

const PERIOD_OPTIONS = [
  { value: '2026-01', label: '2026-01' },
  { value: '2026-02', label: '2026-02' },
  { value: '2026-03', label: '2026-03' },
  { value: '2026-04', label: '2026-04' },
  { value: '2026-05', label: '2026-05' },
  { value: '2026-06', label: '2026-06' },
];

const DIMENSION_OPTIONS = [
  { value: 'company', label: '公司' },
  { value: 'contract', label: '合同' },
  { value: 'project', label: '项目' },
  { value: 'order', label: '订单' },
] as const;

// ── Provider ──

interface AnalyzerProviderProps {
  children: ReactNode;
}

export function AnalyzerProvider({ children }: AnalyzerProviderProps) {
  const [state, setState] = useState<AnalyzerState>(initState);

  // Sync URL + persist on change
  useEffect(() => {
    syncToUrl(state);
    saveState(state);
  }, [state]);

  const setPeriod = useCallback((period: string) => {
    setState(prev => ({ ...prev, period }));
  }, []);

  const setDimension = useCallback((dimension: AnalyzerState['dimension']) => {
    setState(prev => ({ ...prev, dimension, objectId: null }));
  }, []);

  const setObjectId = useCallback((objectId: string | null) => {
    setState(prev => ({ ...prev, objectId }));
  }, []);

  const setFilter = useCallback((key: keyof AnalyzerFilters, value: string) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, [key]: value },
    }));
  }, []);

  const reset = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  return (
    <AnalyzerContext.Provider value={{ state, setPeriod, setDimension, setObjectId, setFilter, reset }}>
      {children}
    </AnalyzerContext.Provider>
  );
}

// ── Sub-components ──

interface PeriodSelectorProps {
  value: string;
  onChange: (period: string) => void;
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        padding: '4px 12px',
        borderRadius: 6,
        border: '1px solid #d9d9d9',
        fontSize: 14,
        minWidth: 120,
        height: 32,
        background: '#fff',
        cursor: 'pointer',
      }}
    >
      {PERIOD_OPTIONS.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

interface DimensionSelectorProps {
  value: string;
  onChange: (dimension: AnalyzerState['dimension']) => void;
}

export function DimensionSelector({ value, onChange }: DimensionSelectorProps) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {DIMENSION_OPTIONS.map(opt => (
        <label
          key={opt.value}
          style={{
            padding: '4px 14px',
            borderRadius: 6,
            border: `1px solid ${value === opt.value ? '#1677ff' : '#d9d9d9'}`,
            background: value === opt.value ? '#e6f4ff' : '#fff',
            color: value === opt.value ? '#1677ff' : '#666',
            fontSize: 13,
            cursor: 'pointer',
            userSelect: 'none',
            transition: 'all 0.2s',
          }}
        >
          <input
            type="radio"
            name="dimension"
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value as AnalyzerState['dimension'])}
            style={{ display: 'none' }}
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

interface AdvancedFilterProps {
  filters: AnalyzerFilters;
  onChange: (key: keyof AnalyzerFilters, value: string) => void;
}

export function AdvancedFilter({ filters, onChange }: AdvancedFilterProps) {
  const [open, setOpen] = useState(false);

  const filterFields: { key: keyof AnalyzerFilters; label: string; options: string[] }[] = [
    { key: 'owner', label: '负责人', options: ['全部', '张三', '李四', '王五'] },
    { key: 'contractType', label: '合同类型', options: ['全部', '框架合同', '单项合同'] },
    { key: 'contractStatus', label: '合同状态', options: ['全部', '进行中', '已完成', '已关闭'] },
    { key: 'orderStatus', label: '订单状态', options: ['全部', '进行中', '已完成'] },
    { key: 'revenueStatus', label: '收入状态', options: ['全部', '待开票', '已开票', '已回款'] },
    { key: 'costStatus', label: '成本状态', options: ['全部', '待支付', '已支付'] },
  ];

  return (
    <div>
      <div
        onClick={() => setOpen(!open)}
        style={{
          cursor: 'pointer',
          color: '#666',
          fontSize: 13,
          userSelect: 'none',
          padding: '2px 0',
        }}
      >
        {open ? '▼' : '▶'} 高级过滤
      </div>
      {open && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
          {filterFields.map(field => (
            <div key={field.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13, color: '#666', whiteSpace: 'nowrap' }}>{field.label}:</span>
              <select
                value={filters[field.key] || '全部'}
                onChange={e => onChange(field.key, e.target.value)}
                style={{
                  padding: '2px 8px',
                  borderRadius: 4,
                  border: '1px solid #d9d9d9',
                  fontSize: 13,
                  height: 28,
                  background: '#fff',
                }}
              >
                {field.options.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main BusinessAnalyzer ──

export function BusinessAnalyzer() {
  const { state, setPeriod, setDimension, setObjectId, setFilter } = useAnalyzer();
  const [advancedOpen, setAdvancedOpen] = useState(false);

  return (
    <div
      style={{
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        padding: '8px 24px',
      }}
    >
      {/* Row 1: Period + Object (always visible) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: '#666', whiteSpace: 'nowrap' }}>经营期间:</span>
          <PeriodSelector value={state.period} onChange={setPeriod} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: '#666', whiteSpace: 'nowrap' }}>经营对象:</span>
          <ObjectSelector
            dimension={state.dimension}
            value={state.objectId}
            onChange={setObjectId}
          />
        </div>
      </div>

      {/* Row 2: Advanced Filter (collapsed by default) */}
      <div style={{ marginTop: 6 }}>
        <div
          onClick={() => setAdvancedOpen(!advancedOpen)}
          style={{
            cursor: 'pointer',
            color: '#666',
            fontSize: 13,
            userSelect: 'none',
            padding: '2px 0',
          }}
        >
          {advancedOpen ? '▼' : '▶'} 高级筛选
        </div>
        {advancedOpen && (
          <div style={{ padding: '8px 0 4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#666', whiteSpace: 'nowrap' }}>分析维度:</span>
                <DimensionSelector value={state.dimension} onChange={setDimension} />
              </div>
            </div>
            <AdvancedFilter filters={state.filters} onChange={setFilter} />
          </div>
        )}
      </div>
    </div>
  );
}
