# Business Impact — 订单模型补充字段影响分析

> **BDD-02A.1 P3 输出**
> 生成时间：2026-07-05
> 影响范围：order_source · owner_project_name · owner_project_no

---

## 一、字段定义回顾

| 字段 | 类型 | 来源 | 核心规则 |
|------|:----:|:----:|---------|
| `order_no` | String(100) | M | 甲方订单编号，ERP 按此匹配，禁止自动生成，必须人工录入 |
| `order_source` | String(20) | S | 根据合同类型自动推导（框架合同/单项合同），禁止人工修改 |
| `owner_project_name` | String(200) | M | 甲方项目名称，仅归属信息，不建立立项模块，允许为空 |
| `owner_project_no` | String(100) | M | 甲方项目编号，可选 |

---

## 二、对各模块影响

### 2.1 ERP 集成

| 字段 | 影响 | 说明 |
|------|:----:|------|
| `order_no` | 🔴 **重大** | ERP 匹配键从 `id` 变为 `order_no`。所有 ETL 匹配逻辑需使用 `order_no` 作为关联键 |
| `order_source` | 🟢 无 | 自动推导，ERP 不涉及 |
| `owner_project_name` | 🟡 中 | ERP 同步时可填充甲方项目名称，用于交叉核对 |

**ERP 匹配变更**：

```
之前：ERP数据 → 模糊匹配 order.id
之后：ERP数据 → 精确匹配 order_no（统一由甲方订单编号）
```

### 2.2 Dashboard

| 字段 | 影响 | 说明 |
|------|:----:|------|
| `order_no` | 🟢 无 | Dashboard 不直接使用 |
| `order_source` | 🟡 中 | Dashboard 可按订单来源分组展示（框架合同项目 vs 单项合同项目） |
| `owner_project_name` | 🟢 无 | 仅归属信息 |

**Dashboard 新增分组维度**：

```
经营驾驶舱 → 可按"订单来源"过滤/分组展示
```

### 2.3 收入管理（IncomeFlow）

| 字段 | 影响 | 说明 |
|------|:----:|------|
| `order_no` | 🟢 无 | 收入流水通过 `order_id` 关联，不直接使用 `order_no` |
| `order_source` | 🟢 无 | 不直接影响收入流水 |
| `owner_project_name` | 🟢 无 | 仅归属信息 |

### 2.4 成本执行（CostFlow）

| 字段 | 影响 | 说明 |
|------|:----:|------|
| `order_no` | 🟢 无 | 成本流水通过 `order_id` 关联 |
| `order_source` | 🟢 无 | 不直接影响成本执行 |
| `owner_project_name` | 🟢 无 | 仅归属信息 |

### 2.5 收付款（Collection / Payment）

| 字段 | 影响 | 说明 |
|------|:----:|------|
| `order_no` | 🟢 无 | 通过流水关联订单 |
| `order_source` | 🟢 无 | 不直接影响 |
| `owner_project_name` | 🟢 无 | 仅归属信息 |

---

## 三、影响总结矩阵

| 模块 | order_no | order_source | owner_project_name | owner_project_no |
|:----:|:--------:|:------------:|:------------------:|:----------------:|
| ERP 集成 | 🔴 匹配键变更 | 🟢 无关 | 🟡 可填充 | 🟢 无关 |
| Dashboard | 🟢 无关 | 🟡 新增维度 | 🟢 无关 | 🟢 无关 |
| 收入管理 | 🟢 无关 | 🟢 无关 | 🟢 无关 | 🟢 无关 |
| 成本执行 | 🟢 无关 | 🟢 无关 | 🟢 无关 | 🟢 无关 |
| 收款管理 | 🟢 无关 | 🟢 无关 | 🟢 无关 | 🟢 无关 |
| 付款管理 | 🟢 无关 | 🟢 无关 | 🟢 无关 | 🟢 无关 |

---

## 四、BDD-02B 开发影响

| 影响项 | 说明 | 工作量 |
|--------|------|:------:|
| Order 模型新增 3 字段 | `order_source`(S), `owner_project_name`(M), `owner_project_no`(M) | 🟢 低 |
| Order Schema 新增 3 字段 | Create/Update/Response 同步更新 | 🟢 低 |
| 订单新增表单 | layout 调整 + order_source 自动推导 | 🟡 中 |
| DB 迁移 | ALTER TABLE 新增 3 列 | 🟢 低 |
| ERP 匹配逻辑 | 匹配键改为 `order_no` | 🟡 中（当前 ETL 未上线） |
| Dashboard 分组 | `order_source` 分组维度 | 🟢 低（BDD-07） |

---

## 五、结论

> **3 个补充字段对现有系统影响可控。ERP 匹配键变更是唯一需要重点关注的影响点。**
>
> 建议在 BDD-02B（订单新增）开发时同步实施字段增加，ETL 匹配键变更在 BDD-06（财务集成核对）时处理。
