# Business Analyzer State — 经营分析器状态管理

> **PDD-02 P2 输出 · 永久文档（Product SSoT）**
> 更新时间：2026-07-06
> **Business Analyzer 是全局状态。页面切换后保持分析条件。**

---

## 一、状态模型

```typescript
interface AnalyzerState {
  /** 经营期间（如 "2026-06"） */
  period: string;
  /** 分析维度 */
  dimension: 'company' | 'contract' | 'project' | 'order';
  /** 经营对象 ID（维度=company 时为空） */
  objectId: string | null;
  /** 高级过滤 */
  filters: {
    owner?: string;
    contractType?: string;
    contractStatus?: string;
    orderStatus?: string;
    revenueStatus?: string;
    costStatus?: string;
  };
  /** 上次更新时间 */
  lastUpdated: string;
}
```

---

## 二、状态存储

| 存储 | 用途 | 说明 |
|:-----|:-----|:------|
| **React Context** | 运行时状态 | 全局 Context 提供 AnalyzerState |
| **localStorage** | 持久化 | 浏览器刷新后恢复 |
| **URL params** | 分享/书签 | `?period=2026-06&dimension=project&object=P001` |

### 优先级

```
URL params > localStorage > 默认值（最近导入月份）
```

---

## 三、状态生命周期

```
用户操作（切换期间/维度/对象/过滤）
       ↓
更新 React Context
       ↓
更新 URL（replaceState，不刷新页面）
       ↓
保存到 localStorage
       ↓
触发页面数据刷新
       ↓
页面重新渲染
```

---

## 四、Context 设计

```typescript
// 创建 Context
const AnalyzerContext = createContext<{
  state: AnalyzerState;
  setPeriod: (period: string) => void;
  setDimension: (dim: AnalyzerState['dimension']) => void;
  setObject: (id: string | null) => void;
  setFilter: (key: string, value: string) => void;
  reset: () => void;
}>(...);

// 使用
function PageComponent() {
  const { state, setPeriod, setDimension } = useAnalyzer();
  
  // 当 analyzer 变化时刷新数据
  useEffect(() => {
    fetchData(state.period, state.dimension, state.objectId);
  }, [state]);
}
```

---

## 五、URL 同步

```typescript
// 读取 URL 参数初始化
function initFromUrl(): Partial<AnalyzerState> {
  const params = new URLSearchParams(window.location.search);
  return {
    period: params.get('period') || undefined,
    dimension: params.get('dimension') as any || undefined,
    objectId: params.get('object') || undefined,
  };
}

// 状态变化时更新 URL
function syncToUrl(state: AnalyzerState) {
  const params = new URLSearchParams();
  if (state.period) params.set('period', state.period);
  if (state.dimension) params.set('dimension', state.dimension);
  if (state.objectId) params.set('object', state.objectId);
  const qs = params.toString();
  const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState(null, '', url);
}
```

---

## 六、状态变化事件

```typescript
// Analyzer 变化时触发全局事件
type AnalyzerChangeEvent = {
  type: 'analyzer:change';
  detail: {
    prev: AnalyzerState;
    current: AnalyzerState;
    changedField: 'period' | 'dimension' | 'object' | 'filter';
  };
};

// 页面监听此事件刷新数据
window.addEventListener('analyzer:change', (e) => {
  refreshData();
});
```

---

## 七、初始化流程

```
页面加载
    ↓
检查 URL params → 有 → 解析为 AnalyzerState
    ↓
无 ↓
检查 localStorage → 有 → 恢复 AnalyzerState
    ↓
无 ↓
使用默认值（最近导入月份 + 公司维度）
    ↓
初始化 Context
    ↓
页面首次渲染
```

---

## 八、状态持久化示例

```typescript
// 保存到 localStorage
const STORAGE_KEY = 'fd_analyzer_state';

function saveState(state: AnalyzerState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

function loadState(): AnalyzerState | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}
```

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-06 | 初始编制 |
