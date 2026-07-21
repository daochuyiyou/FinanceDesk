# AHF-04 Event Catalog — 标准事件目录

> **AHF-04 P3 输出 · 永久文档（Technical SSoT）**
> 更新时间：2026-07-06
> **30+ 标准业务事件。覆盖合同/订单/收入/成本/收款/付款/ERP导入/回滚/汇总。**

---

## 一、事件目录总表

| # | 事件类型 | 生产者 | 消费者 | 说明 |
|:-:|:---------|:-------|:-------|:------|
| | **Contract（合同）** | | | |
| 1 | `Contract.Created` | Contract Service | Summary | 合同创建 |
| 2 | `Contract.Updated` | Contract Service | Summary | 合同更新 |
| 3 | `Contract.Closed` | Contract Service | Summary | 合同关闭 |
| 4 | `Contract.AmountChanged` | Contract Service | Order | 合同金额变更 |
| | **Order（订单）** | | | |
| 5 | `Order.Created` | Order Service | Summary | 订单创建 |
| 6 | `Order.Updated` | Order Service | Summary | 订单更新 |
| 7 | `Order.Closed` | Order Service | Dashboard | 订单关闭 |
| 8 | `Order.Reopened` | Order Service | Dashboard | 订单重开 |
| 9 | `Order.StatusChanged` | Order Service | Summary | 订单状态变更 |
| | **Revenue（收入）** | | | |
| 10 | `IncomeFlow.Created` | Import Engine | Rule Engine, Summary | 收入流水创建 |
| 11 | `IncomeFlow.Updated` | Import Engine | Rule Engine, Summary | 收入流水更新 |
| 12 | `IncomeFlow.Reversed` | Import Engine | Rule Engine, Summary | 收入红冲 |
| 13 | `IncomeFlow.Deleted` | Import Engine | Summary | 收入逻辑删除 |
| 14 | `IncomeFlow.Imported` | Import Engine | Dashboard | 收入导入完成 |
| | **Cost（成本）** | | | |
| 15 | `CostFlow.Created` | Import Engine | Rule Engine, Summary | 成本流水创建 |
| 16 | `CostFlow.Updated` | Import Engine | Rule Engine, Summary | 成本流水更新 |
| 17 | `CostFlow.Reversed` | Import Engine | Rule Engine, Summary | 成本红冲 |
| 18 | `CostFlow.Deleted` | Import Engine | Summary | 成本逻辑删除 |
| 19 | `CostFlow.Imported` | Import Engine | Dashboard | 成本导入完成 |
| | **Collection（收款）** | | | |
| 20 | `Collection.Created` | Import Engine | Summary | 收款创建 |
| 21 | `Collection.Updated` | Import Engine | Summary | 收款更新 |
| 22 | `Collection.Deleted` | Import Engine | Summary | 收款逻辑删除 |
| | **Payment（付款）** | | | |
| 23 | `Payment.Created` | Import Engine | Summary | 付款创建 |
| 24 | `Payment.Updated` | Import Engine | Summary | 付款更新 |
| 25 | `Payment.Deleted` | Import Engine | Summary | 付款逻辑删除 |
| | **ERP Import（导入）** | | | |
| 26 | `ERPImport.BatchCreated` | Workbench | Dashboard | 导入批次创建 |
| 27 | `ERPImport.BatchExecuted` | Import Engine | Summary, Dashboard | 导入执行完成 |
| 28 | `ERPImport.BatchRolledBack` | Import Engine | Summary, Dashboard | 导入回滚 |
| 29 | `ERPImport.MatchCompleted` | Match Engine | Import Engine | 匹配完成 |
| 30 | `ERPImport.DuplicateSkipped` | Import Engine | Audit | 重复跳过 |
| 31 | `ERPImport.Error` | Import Engine | Audit, AI | 导入异常 |
| | **Rollback（回滚）** | | | |
| 32 | `Rollback.Executed` | Import Engine | Summary | 回滚执行 |
| 33 | `Rollback.Reversed` | Import Engine | Summary | 回滚逆转 |
| | **Summary（汇总）** | | | |
| 34 | `RevenueSummary.Refreshed` | Summary Engine | Dashboard | 收入汇总刷新 |
| 35 | `CostSummary.Refreshed` | Summary Engine | Dashboard | 成本汇总刷新 |
| 36 | `OrderSummary.Refreshed` | Summary Engine | Dashboard | 订单汇总刷新 |
| 37 | `OrderSummary.AnomalyDetected` | Summary Engine | AI | 汇总异常检测 |
| | **System（系统）** | | | |
| 38 | `System.HealthCheck` | System | Monitor | 健康检查 |
| 39 | `System.MigrationExecuted` | Migration | Audit | 数据迁移 |

---

## 二、事件分组

| 分组 | 数量 | 范围 |
|:-----|:----:|:-----|
| Contract | 4 | 合同生命周期 |
| Order | 5 | 订单生命周期 |
| Revenue | 5 | 收入流水 |
| Cost | 5 | 成本流水 |
| Collection | 3 | 收款 |
| Payment | 3 | 付款 |
| ERP Import | 6 | 导入流程 |
| Rollback | 2 | 回滚流程 |
| Summary | 4 | 汇总刷新 |
| System | 2 | 系统事件 |
| **合计** | **39** | — |

---

## 三、事件依赖关系

```
ERPImport.BatchCreated
    ↓
ERPImport.MatchCompleted
    ↓
IncomeFlow.Created / CostFlow.Created / Collection.Created / Payment.Created
    ↓
RevenueSummary.Refreshed / CostSummary.Refreshed
    ↓
OrderSummary.Refreshed
    ↓
Dashboard
```

---

## 四、事件扩展规则

| 规则 | 说明 |
|:-----|:------|
| **新增事件** | 在 Catalog 注册新类型 + 定义 payload |
| **新增消费者** | 订阅事件类型，不影响生产者 |
| **修改事件** | 仅允许增加 payload 字段（向后兼容） |
| **废弃事件** | 标记 deprecated，保留 2 个版本 |

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-06 | 初始编制，39 个标准事件 |
