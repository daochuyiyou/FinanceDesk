# Context Consistency Audit — 上下文一致性审计

> **日期**: 2026-07-09
> **原则**: 修复用户浏览经营链时的连续性体验，不新增任何字段/功能/维护

---

## 审计方法

跟踪用户从 Dashboard 开始，逐层下钻到合同→订单→流水时的 Analyzer 状态继承情况。

## 业务 Analyzer 状态流

```
AnalyzerProvider (App.tsx)
  ├── state: { period, dimension, objectId, filters }
  ├── 持久化: localStorage + URL params
  └── 注入: useAnalyzer() 到所有子页面
```

---

## 当前状态矩阵

| 页面 | 使用 Analyzer | 按 Analyzer 筛选数据 | 一致性 |
|:----|:------------:|:--------------------:|:------:|
| Dashboard | ✅ useAnalyzer | ✅ `project_id=oid` 传给 API | ✅ |
| 合同管理 | ✅ useAnalyzer | ❌ 不传 analyzer 参数 | ⚠️ |
| 订单管理 | ✅ useAnalyzer | ❌ 不传 analyzer 参数 | ⚠️ |
| 收入管理 | ✅ useAnalyzer | ❌ 只 `void state` 触发刷新，不传 project_id | ❌ |
| 成本执行 | ✅ useAnalyzer | ❌ 同上 | ❌ |
| 收款管理 | ✅ useAnalyzer | ❌ 同上 | ❌ |
| 付款管理 | ✅ useAnalyzer | ❌ 同上 | ❌ |
| 预算管理 | ❌ 独立选择器 | ❌ 不相关 | ⚠️ |

---

## 发现的不一致问题

### C1: 页面间跳转 Analyzer 条件丢失（所有 4 个流水页面）

**复现路径**:
```
Dashboard (选择项目: "XX工程", 维度=项目)
  → 点击"累计收入 ¥100万"
  → 收入管理页面加载 ALL 收入数据，未按项目筛选
```

**根因**: 4 个流水页面已导入 `useAnalyzer()`、已实现 `projectId` 客户端过滤逻辑、`loadData` 依赖 `analyzer.state` 触发刷新，但**均未从 analyzer.state 提取 project_id 传递给过滤逻辑**。

| 页面 | 已具备 | 缺少 |
|:----|:-------|:-----|
| 收入管理 | `useAnalyzer()` + `projectId` 过滤 | analyzer → projectId 映射 |
| 成本执行 | `useAnalyzer()` + `projectId` 过滤 | analyzer → projectId 映射 |
| 收款管理 | `useAnalyzer()` + `projectId` 过滤 | analyzer → projectId 映射 |
| 付款管理 | `useAnalyzer()` + `projectId` 过滤 | analyzer → projectId 映射 |

**代码层面**（以收入管理为例）:
```tsx
// 当前: props 传 projectId，但 App.tsx 从不传
const IncomeManagement: React.FC<Props> = ({ projectId, onNavigate }) => {
  // projectId 一直为 undefined
  // loadData 中 if (projectId) 从未执行过
  
  // 修复: 从 analyzer.state 补间 projectId
  const effectiveProjectId = projectId ?? (
    analyzer.state.objectId && ['project','contract'].includes(analyzer.state.dimension)
      ? Number(analyzer.state.objectId) : undefined
  );
```

---

### C2: BudgetPage 独立项目选择器（设计性不一致）

**复现路径**: 在 Dashboard 选择了项目后→切到预算管理→需要**再次选择项目**

**根因**: BudgetPage 未使用 Business Analyzer，有独立的 `<Select>` 项目选择器。这是设计层面的不一致，但预算管理本身是独立的计划层（非经营层），与 Analyzer 的维度逻辑不同。

**建议**: 该问题已知（PS-013 审计中已记录为 B9 Enhancement），不纳入本次修复。

---

### C3: 合同/订单页面未传递 Analyzer project_id 到 API

**复现路径**: 在 Analyzer 选择了项目→合同管理→合同列表展示所有合同（未按项目筛选）

**根因**: Contract/Order workbench 虽然使用 `useAnalyzer()`，但调用 `/dashboard/contract-summary` 时未传 analyzer 参数。

**影响**: 低于 C1，因为用户可以在合同页面使用顶部搜索框过滤，且合同数量通常不多。

---

## 修复清单

| # | 页面 | 修复内容 | 代码量 | 影响 |
|:-:|:----|:---------|:------:|:-----|
| C1a | 收入管理 | 从 `analyzer.state` 提取 projectId | +4 行 | Dashboard 跳转后数据自动过滤 |
| C1b | 成本执行 | 同上 | +4 行 | 同上 |
| C1c | 收款管理 | 同上 | +4 行 | 同上 |
| C1d | 付款管理 | 同上 | +4 行 | 同上 |
| C2 | 预算管理 | ⏸ Enhancement 排队 | — | 不做 |
| C3 | 合同/订单 | ⏸ 低优先级 | — | 不做 |

**所有修复不新增字段、不新增 API 参数、不改后端、不新增维护。**

---

## 验证

| 检查项 | 方法 |
|:-------|:-----|
| 从 Dashboard 选项目→跳收入→显示项目数据 | 浏览器 + console |
| 从 Dashboard 选项目→跳成本→显示项目数据 | 浏览器 + console |
| 从 Dashboard 选项目→跳收款→显示项目数据 | 浏览器 + console |
| 从 Dashboard 选项目→跳付款→显示项目数据 | 浏览器 + console |
| Analyzer 维度=公司时，不限制 project | 逻辑验证 |
