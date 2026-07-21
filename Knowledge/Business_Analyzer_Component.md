# Business Analyzer Component — 经营分析器组件规范

> **PDD-02 P3 输出 · 永久文档（Product SSoT）**
> 更新时间：2026-07-06
> **Business Analyzer 组件规范。全局唯一、禁止重复开发。**

---

## 一、组件定位

`<BusinessAnalyzer />` 是 FinanceDesk **全局唯一分析入口组件**。

| 属性 | 值 |
|:----:|-----|
| 文件位置 | `components/BusinessAnalyzer.tsx` |
| 依赖 | `AnalyzerContext` |
| 复用 | 所有业务页面共享 |
| 状态 | 全局（非页面级） |

---

## 二、组件结构

```
┌──────────────────────────────────────────────────────────────┐
│ 经营期间：                                                      │
│ ┌──────────────────────────────────────────────────────┐     │
│ │ 2026-06  ▼                                            │     │
│ └──────────────────────────────────────────────────────┘     │
│                                                              │
│ 分析维度：                                                     │
│ ○ 公司    ○ 合同    ○ 项目    ○ 订单                          │
│                                                              │
│ 经营对象：                                                     │
│ ┌──────────────────────────────────────────────────────┐     │
│ │ 请选择...(维度=公司时禁用)                            │     │
│ └──────────────────────────────────────────────────────┘     │
│                                                              │
│ ▶ 高级过滤（默认折叠，点击展开）                               │
│   负责人：全部 ▼   合同类型：全部 ▼                           │
│   合同状态：全部 ▼ 订单状态：全部 ▼                           │
│   收入状态：全部 ▼ 成本状态：全部 ▼                           │
└──────────────────────────────────────────────────────────────┘
```

---

## 三、Props 定义

```typescript
interface BusinessAnalyzerProps {
  /** 页面标识（用于统计/日志） */
  page?: string;
  /** 是否显示高级过滤（默认 true） */
  showAdvancedFilter?: boolean;
  /** 自定义样式 */
  style?: React.CSSProperties;
}
```

---

## 四、子组件

| 组件 | 职责 | 
|:-----|:------|
| `PeriodSelector` | 经营期间下拉选择 |
| `DimensionRadio` | 分析维度 Radio 组 |
| `ObjectSelect` | 经营对象动态下拉 |
| `AdvancedFilter` | 高级过滤折叠面板 |

---

## 五、组件接口

```typescript
// PeriodSelector
interface PeriodSelectorProps {
  value: string;
  options: { value: string; label: string }[];
  onChange: (period: string) => void;
}

// DimensionRadio
interface DimensionRadioProps {
  value: string;
  onChange: (dimension: string) => void;
}

// ObjectSelect
interface ObjectSelectProps {
  dimension: string;
  value: string | null;
  onChange: (id: string | null) => void;
}

// AdvancedFilter
interface AdvancedFilterProps {
  filters: Record<string, string>;
  onChange: (key: string, value: string) => void;
}
```

---

## 六、使用示例

```typescript
// Dashboard 页面
function Dashboard() {
  return (
    <div>
      <BusinessAnalyzer page="dashboard" />
      <KPISummary />
      <MonthlyTrend />
      <BusinessAlerts />
      <BusinessActions />
      <CurrentDetail />
    </div>
  );
}

// 合同中心
function ContractCenter() {
  return (
    <div>
      <BusinessAnalyzer page="contracts" />
      <ContractTable />
    </div>
  );
}
```

---

## 七、组件行为

| 行为 | 实现 |
|:-----|:------|
| 初始加载 | 从 URL → localStorage → 默认 |
| 期间切换 | 调用 `setPeriod()` |
| 维度切换 | 调用 `setDimension()` → 对象列表刷新 |
| 对象选择 | 调用 `setObject()` |
| 高级过滤 | 调用 `setFilter()` |
| 重置 | 调用 `reset()` → 恢复默认 |

---

## 八、禁止事项

| 禁止 | 原因 |
|:-----|:------|
| ❌ 每个页面自己实现 Analyzer | 违反 PDD-003 |
| ❌ 页面级 Analyzer 状态 | 违反 PDD-004 |
| ❌ 改变分析顺序 | 违反 PDD-005 |
| ❌ 移除经营期间 | 违反 PDD-001 |
| ❌ 展示日/周粒度 | 月度经营分析 |

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-06 | 初始编制 |
