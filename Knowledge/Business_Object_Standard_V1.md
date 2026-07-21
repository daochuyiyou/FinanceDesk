# Business Object Standard V1

> 永久标准。AD-2026-005 批准冻结。
> 所有业务对象（Contract、Order、Revenue、Cost、Collection、Payment）的唯一设计标准。
> 以后任何新增或修改业务对象，都必须遵循本 BOS，不允许各对象自行定义规则。

---

## 1. 定位

本文件定义 FinanceDesk 全部 6 个经营业务对象的通用架构标准。不是建议，是约束。

### 1.1 适用范围

| 对象 | 模型 | 表名 | BOS 覆盖 |
|:----:|:----:|:----:|:--------:|
| **Contract** | `Project` | `project` | ✅ |
| **Order** | `Order` | `order` | ✅ |
| **Revenue** | `IncomeFlow` | `income_flow` | ✅ |
| **Cost** | `CostFlow` | `cost_flow` | ✅ |
| **Collection** | `Collection` | `collection` | ✅ |
| **Payment** | `Payment` | `payment` | ✅ |

### 1.2 三层分离（不可违反）

```
ERP 事实层                FD 经营层                Dashboard 分析层
（暂存/匹配/不可修改）     （业务对象 CRUD）          （只读聚合）
ERPStagingFlow            IncomeFlow / CostFlow     /dashboard/*
ImportBatch               Collection / Payment     /api/v1/dashboard/*
ProjectKeywordMapping     Order / Project          实时 SQL 聚合
```

---

## 2. 双状态模型

每个业务对象拥有**两个独立状态维度**，互不替代：

### 2.1 Lifecycle（生命周期状态）

| 属性 | 说明 |
|:----|------|
| **定义** | 对象所处的流程阶段 |
| **存储** | 模型 `status` 列，持久化落库 |
| **推导** | **系统自动推导**，禁止人工修改 |
| **例外** | 仅允许人工将 Lifecycle 设为"终止"或"已作废" |

### 2.2 Business Status（经营分析状态）

| 属性 | 说明 |
|:----|------|
| **定义** | 对象当前的经营健康度 |
| **存储** | **不落库**，实时推导 |
| **推导** | Dashboard/Summary 端点中系统计算 |
| **更新** | 每次查询时根据下游数据实时派生 |

### 2.3 双状态关系

```
Lifecycle（数据库 status 列）     Business Status（Dashboard 计算）
    映射到                             独立于
订单的流程阶段                      订单的经营健康度

示例：
  订单 Lifecycle = 执行中
  订单 Business Status = 待回款（收入＞回款）
```

---

## 3. 字段分类标准

每个业务对象的每个字段必须明确归属于以下四类之一：

### 3.1 四类字段

| 类别 | 来源 | 允许编辑 | 存储 | 示例 |
|:----:|:----:|:--------:|:----:|------|
| **🅴 ERP** | ERP 系统自动导入 | ❌ 只读 | 模型列 | `erp_no`、`voucher_no` |
| **🅼 人工** | 用户录入 | ✅ 可编辑 | 模型列 | `order_name`、`amount` |
| **🅲 系统计算** | 系统自动推导 | ❌ 只读 | 模型列或实时 | `order_source`、`status` |
| **🆁 关联** | 引用其他对象 | ❌ 创建后锁定 | FK 列 | `project_id`、`order_id` |

### 3.2 字段命名规则

| 规则 | 示例 | 说明 |
|:----|:----:|------|
| 金额字段用 `amount` / `taxable_amount` | `contract_amount` | 统一后缀，不混用 `price`/`sum` |
| 日期字段用 `_date` 后缀 | `sign_date` | 统一格式 `YYYY-MM-DD` |
| 布尔字段用 `is_` 前缀 | `is_deleted` | 不混用 `flag`/`status` |
| 编号字段用 `_no` 后缀 | `order_no` | 唯一标识符 |
| 引用字段用 `_id` 后缀 | `project_id` | FK 列命名一致 |
| Mirror 字段对称命名 | `invoice_stage` ↔ `cost_stage` | 收入/成本镜像字段名必须一致 |

### 3.3 锁定字段规则

| 规则 | 说明 |
|:----|------|
| 创建后锁定 | `order_no`、`project_id`、`order_source` 等创建后不可修改 |
| 系统计算锁定 | `order_source`、`status`（Lifecycle）不可人工修改 |
| 仅终止例外 | Lifecycle 唯一允许的人工操作是设为终止/已作废 |

---

## 4. 对象关系标准

### 4.1 钻取链（PDD-006）

```
Company → Contract → Order → Revenue / Cost → Collection / Payment
```

- 每个上游对象可点击跳转到下游对象列表
- 所有经营数字必须可钻取到来源
- Dashboard KPI → 点击跳转对应 Workbench

### 4.2 关联结构

```
Contract (1) ───→ Order (N) ←─── Supplier (1)
                       │
            ┌──────────┼──────────┐
            ↓          ↓          ↓
        IncomeFlow  CostFlow   Collection/Payment
        (1:N)       (1:N)      (via IncomeFlow/CostFlow)

Revenue ↔ Cost: Mirror Architecture
Collection ↔ Payment: Mirror Architecture
```

### 4.3 Mirror Architecture（收入 ↔ 成本镜像）

收入链和成本链必须保持**镜像设计**：

| Revenue 链 | Cost 链 | 规则 |
|:----------:|:-------:|:----:|
| `IncomeFlow` | `CostFlow` | 对称模型 |
| `Collection` | `Payment` | 对称模型 |
| `invoice_stage` | `cost_stage` | 对称命名 |
| `invoice_reason` | `cost_reason` | 对称命名 |
| `invoice_date` | — | 收入特有 |
| — | `cost_type` | 成本特有 |
| `expected_collection_date` | `expected_payment_date` | 对称命名 |
| `business_date` | `business_date` | 完全相同 |
| `business_owner` | `business_owner` | 完全相同 |

新增字段时，收入侧新增则成本侧必须同步评估是否需要镜像字段。

---

## 5. 各对象 Lifecycle 状态机

### 5.1 Contract

```
待执行 ──(首订单创建)──→ 执行中 ──(全部订单已完成/已作废)──→ 已完成
   │                         │
   └──(手动终止)─────────────┴──(手动终止)───────────────→ 终止
```

**推导规则**：根据下属 Order 的 Lifecycle 状态聚合：
- 无订单 → `待执行`
- 有任一订单未完成（待执行/执行中） → `执行中`
- 全部订单已完成或已作废 → `已完成`
- 人工设 `终止` 则不覆盖

### 5.2 Order

```
待执行 ──(首录收入/成本流水)──→ 执行中 ──(收入=回款 且 成本=付款)──→ 已完成
   │                               │
   └──(人工作废)───────────────────┴──(人工作废)─────────────────→ 已作废
```

**推导规则**：根据下属 IncomeFlow/CostFlow 及回款/付款情况：
- 无流水 → `待执行`
- 有流水但未完成 → `执行中`
- 全部收入=回款 且 全部成本=付款 → `已完成`

> ⚠️ **G3 暂停**：Order Lifecycle 状态机推导函数待 BOS 冻结后统一实现。

### 5.3 Revenue (IncomeFlow)

```
待开票 → 已开票 → 部分回款 → 已结清
             ↓
          红冲 ← 可反复
```

**推导规则**：
- `invoice_reason = 红冲` → 红冲
- 有下属 `Collection.amount` 占 `IncomeFlow.taxable_amount` 比例：
  - 0% → `待回款`
  - (0%, 100%) → `部分回款`
  - 100% → `已结清`

### 5.4 Cost (CostFlow)

```
待支付 → 部分付款 → 已结清
```

**推导规则**（同 Revenue 镜像）：
- 无下属 Payment → `待支付`
- Payment > 0 且 < Cost → `部分付款`
- Payment = Cost → `已结清`

### 5.5 Collection / Payment

```
  新建 → 到账确认 → 核销完成
```

**推导规则**：
- 创建时 → `已到账`
- 核销后 → `已核销`
- 状态最简单，核心是金额校验：Collection.amount ≤ IncomeFlow.taxable_amount - 其他 Collection.sum

---

## 6. 各对象 Business Status 推导

Business Status 不落库，由 Dashboard/Summary 端点实时计算：

### 6.1 通用推导模式

```
下游聚合数据 → 阈值判断 → Business Status
```

每个对象的 Business Status 从**该对象的直接下游**聚合得出，避免递归跨层。

### 6.2 各对象 Business Status 规则

| 对象 | Business Status | 条件 |
|:----:|:--------------:|:----:|
| **Contract** | 等待确认收入/成本 | income=0 AND cost=0 |
| | 等待收款 | income>0 AND collection=0 |
| | 等待付款 | cost>0 AND payment=0 |
| | 继续收款 | income>collection |
| | 继续安排付款 | cost>payment |
| | 已完成 | income=collection AND cost=payment |
| **Order** | 待开票 | income=0 AND cost=0 |
| | 待回款 | income>0 AND collection=0 |
| | 待付款 | cost>0 AND payment=0 |
| | 部分回款 | 0<collection<income |
| | 部分付款 | 0<payment<cost |
| | 成本超支 | cost > order_amount |
| | 利润异常 | income>0 AND profit<0 |
| | 正常 | 以上皆否 |
| **Revenue** | 待回款 | collection=0 |
| | 部分回款 | 0<collection<income |
| | 已结清 | collection≥income |
| | 红冲 | invoice_reason=红冲 |
| **Cost** | 待付款 | payment=0 |
| | 部分付款 | 0<payment<cost |
| | 已结清 | payment≥cost |
| **Collection** | 正常 | amount > 0 |
| **Payment** | 正常 | amount > 0 |

---

## 7. CRUD 治理标准

### 7.1 通用 CRUD 要求

| 操作 | 端点 | 规则 |
|:----:|:----:|:------|
| **POST** (创建) | `POST /api/v1/{objects}` | 201，返回 `id` |
| **GET list** (列表) | `GET /api/v1/{objects}` | 200，分页，`items` + `total` |
| **GET detail** (查看) | `GET /api/v1/{objects}/{id}` | 200，404 |
| **PATCH** (编辑) | `PATCH /api/v1/{objects}/{id}` | 200，锁定字段拒改，422 |
| **DELETE** (删除) | `DELETE /api/v1/{objects}/{id}` | 204，逻辑删除 |

### 7.2 删除保护规则

| 对象 | 保护规则 |
|:----:|:---------|
| **Contract** | DELETE 前检查 Order 引用数，>0 则 409 拒绝 |
| **Order** | DELETE 前检查 IncomeFlow/CostFlow 引用数，>0 则 409 拒绝 |
| **Revenue** | DELETE 前检查 Collection 引用数，>0 则 409 拒绝 |
| **Cost** | DELETE 前检查 Payment 引用数，>0 则 409 拒绝 |
| **Collection** | 允许删除（不影响流水） |
| **Payment** | 允许删除（不影响流水） |

### 7.3 状态修改保护

| 操作 | 规则 |
|:----|:-----|
| 系统推导 | Lifecycle 由系统按 5.1-5.5 自动推导，不允许人工传入 |
| 终止/作废 | 仅允许人工将 Lifecycle 设为`终止`或`已作废`，不可恢复 |
| Business Status | 始终系统推导，前端仅展示，不存在修改入口 |

---

## 8. 关联关系与删除级联

### 8.1 物理外键

| # | 子表 | FK 字段 | → 父表 | 删除规则 |
|:-:|:----:|:-------:|:------:|:--------:|
| 1 | `project_budget` | `project_id` | `project.id` | RESTRICT |
| 2 | `income_flow` | `order_id` | `order.id` | RESTRICT |
| 3 | `cost_flow` | `order_id` | `order.id` | RESTRICT |
| 4 | `collection` | `flow_id` | `income_flow.id` | RESTRICT |
| 5 | `payment` | `cost_id` | `cost_flow.id` | RESTRICT |
| 6 | `order` | `project_id` | `project.id` | RESTRICT |

### 8.2 逻辑删除级联

应用层逻辑删除不触发数据库级联。上下游逻辑删除状态独立维护，查询时通过 `is_deleted = 0` 过滤。

---

## 9. Business Analyzer 集成标准

| 要求 | 说明 |
|:----|:------|
| 每个 Workbench 页面必须响应 Analyzer | 导入 `useAnalyzer()`，`useEffect` 依赖 `analyzer.state` |
| 当前 period 筛选 | Workbench 传 `period` 参数给后端 Dashboard 端点 |
| 维度跳转 | Dashboard KPI → `onNavigate('{key}', { focusId })` |
| 无 Mock | 所有数据来自真实 API，禁止 `genMock*()` |

---

## 10. BOS 合规检查清单

每次新对象创建或现有对象修改后，逐项检查：

| # | 检查项 | 标准 |
|:-:|:-------|:-----|
| ① | 双状态模型 | Lifecycle（落库推导）+ Business Status（不落库实时） |
| ② | 字段分类 | 每个字段标注 🅴/🅼/🅲/🆁 |
| ③ | 锁定字段 | 创建后锁定 + 系统计算锁定的字段清单 |
| ④ | 状态机定义 | 符合 5.1-5.5 相应对象的状态图 |
| ⑤ | 状态推导函数 | `derive_{object}_status()` 对应实现 |
| ⑥ | 删除保护 | 按 7.2 表执行 |
| ⑦ | Mirror 对称 | 收入侧新增字段 → 成本侧同步评估 |
| ⑧ | Analyzer 集成 | `useAnalyzer()` + period 参数 |
| ⑨ | Drill-down | KPI 可点击跳转 Workbench |
| ⑩ | 命名合规 | 符合 3.2 命名规则 |

---

## 11. BOS 变更流程

1. 提交 Architecture Decision Record（ADR）
2. 标注 `BOS-CHANGE`
3. 说明变更影响（哪些对象受影响）
4. 审批后更新本文件版本号
5. 更新所有受影响对象的实现

**禁止以"这个对象特殊"为由绕过 BOS。**

---

## 附录 A：各对象当前合规状态

| 对象 | ①双状态 | ②字段分类 | ③锁定字段 | ④状态机 | ⑤推导函数 | ⑥删除保护 | ⑦Mirror | ⑧Analyzer | ⑨Drill-down | ⑩命名 |
|:----:|:-------:|:---------:|:---------:|:-------:|:---------:|:---------:|:--------:|:---------:|:-----------:|:----:|
| **Contract** | ⚠️ Lifecycle ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ |
| **Order** | ⚠️ Lifecycle ⏸ | ⚠️ G1修 | ✅ | ⏸ G3 | ⏸ G3 | ✅ G2 | ✅ | ✅ G4 | ✅ | ✅ |
| **Revenue** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ✅ | ⬜ | ✅ | ✅ |
| **Cost** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ✅ | ⬜ | ✅ | ✅ |
| **Collection** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ✅ | ⬜ | ✅ | ✅ |
| **Payment** | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ✅ | ⬜ | ✅ | ✅ |

> 图例: ✅ 合规 / ⚠️ 有缺口 / ⏸ 暂停 / ⬜ 待审计

---

## 附录 B：版本历史

| 版本 | 日期 | ADR | 变更说明 |
|:----:|:----:|:---:|:---------|
| V1 | 2026-07-07 | AD-2026-005 | 初始冻结 |
