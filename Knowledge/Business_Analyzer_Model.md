# Business Analyzer Model — 经营分析器模型

> **PDD-01 P3 输出 · 永久文档（Product SSoT）**
> 更新时间：2026-07-06
> **Dashboard 顶部经营分析器。所有 Dashboard 数据根据分析器刷新。**

---

## 一、分析器定位

Business Analyzer 是 Dashboard 的**唯一数据筛选入口**。

| 属性 | 值 |
|:----:|-----|
| 位置 | Dashboard 顶部，Header 下方 |
| 角色 | 经营分析控制器 |
| 数据 | 所有 KPI/Trend/Alert/Detail 均依赖分析器 |
| 刷新 | 改变任一选择器 → 整个 Dashboard 刷新 |

---

## 二、分析器组件

┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐ ┌──────┐
│ 经营期间   │ │ 分析视角 │ │ 分析对象 │ │负责人│ │类型 │
│ 2026-06 ▼│ │ ○公司    │ │ 全部 ▼  │ │全部▼│ │全部▼│
│           │ │ ○合同    │ │          │ │     │ │     │
│           │ │ ○项目    │ │          │ │     │ │     │
│           │ │ ○订单    │ │          │ │     │ │     │
└──────────┘ └──────────┘ └──────────┘ └──────┘ └──────┘

### 选择器定义

| 选择器 | 类型 | 必填 | 默认值 | 选项来源 |
|:-------|:-----|:----:|:-------|:---------|
| 经营期间 | 下拉 | ✅ | 最近导入月份 | `import_batch` 表 |
| 分析视角 | Radio | ✅ | 公司 (Company) | 固定 4 个 |
| 分析对象 | 下拉 | ✅ | 全部 | 根据视角动态 |
| 负责人 | 下拉 | ❌ | 全部 | Project.business_owner |
| 合同类型 | 下拉 | ❌ | 全部 | Project.project_type |

---

## 三、分析视角

| 视角 | 值 | 说明 | 对象来源 |
|:-----|:--:|:-----|:---------|
| **公司** | `company` | 公司整体经营 | 全部项目 |
| **合同** | `contract` | 合同经营分析 | Project 列表 |
| **项目** | `project` | 项目经营分析 | Project 列表（同合同级） |
| **订单** | `order` | 订单经营分析 | Order 列表 |

### 扩展预留

| 视角 | 未来支持 |
|:-----|:---------|
| Customer | ✅ 预留 |
| Department | ✅ 预留 |
| Business Owner | ✅ 预留 |

---

## 四、分析器数据流

```
User 选择经营期间
       ↓
User 选择分析视角 → 对象列表刷新
       ↓
User 选择分析对象
       ↓
API: GET /api/v1/dashboard/analytics?period=2026-06&perspective=contract&object_id=xx
       ↓
Summary Engine 计算
       ↓
KPI + Trend + Alerts + Actions + Detail 全部更新
```

### API 接口

```json
GET /api/v1/dashboard/analytics?period=2026-06&perspective=company
GET /api/v1/dashboard/analytics?period=2026-06&perspective=contract&object_id=5
```

### 返回格式

```json
{
  "period": "2026-06",
  "perspective": "company",
  "summary": {
    "contract_amount": 5000000.00,
    "revenue": 2500000.00,
    "cost": 1800000.00,
    "profit": 700000.00,
    "collection_rate": 0.72,
    "payment_rate": 0.65,
    "revenue_gap": 300000.00,
    "cost_gap": 200000.00
  },
  "trend": { "months": ["2025-07", ...], "revenue": [...], "cost": [...], "profit": [...] },
  "alerts": [{ "type": "erp_unmatch", "count": 3, ... }],
  "actions": [{ "type": "pending_match", "count": 5, ... }],
  "detail": [{ "id": 1, "name": "项目A", ... }]
}
```

---

## 五、分析器交互规则

| 交互 | 行为 |
|:-----|:------|
| 切换经营期间 | 全部数据刷新，视角重置为"公司" |
| 切换分析视角 | 对象列表更新，选择"全部" |
| 选择分析对象 | Detail 区域变为该对象明细 |
| 更改负责人/类型 | 数据筛选 |
| 点击 Alert | 跳转到对应业务页面 |
| 点击 Action | 跳转到对应工作台 |

---

## 六、与已有标准一致

| Standard | 符合 |
|:---------|:----:|
| AHF-03 Engine | ✅ 通过 Summary Engine 获取数据 |
| AHF-05 Summary | ✅ KPI 通过 Summary 计算 |
| AHF-06 Dashboard | ✅ 只读 |
| PDD-001 | ✅ 经营期间为第一筛选 |
| PDD-002 | ✅ 多层分析顺序固定 |

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-06 | 初始编制 |
