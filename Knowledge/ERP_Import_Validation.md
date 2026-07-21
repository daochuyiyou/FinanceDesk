# ERP Import Validation — 导入校验规则

> **BDD-06F P4 输出 · 永久文档（SSoT）**
> 更新时间：2026-07-05
> **数据可信优先于功能数量。**

---

## 一、校验层级

```
字段校验（格式/类型）
    ↓
业务校验（关联/约束）
    ↓
事务校验（完整性/一致性）
```

| 层级 | 时机 | 失败处理 |
|:----:|:----:|---------|
| 字段 | 解析时 (Phase 1) | 标记为 failed，跳过 |
| 业务 | 导入引擎 (Phase 3) | 标记为 failed，不中断事务 |
| 事务 | COMMIT 前 | **整个事务 ROLLBACK** |

---

## 二、字段校验规则

### 通用规则

| # | 规则 | 字段 | 条件 | 错误处理 |
|:-:|------|:----:|:----:|:--------:|
| F1 | 不可为空 | `amount_in` 或 `amount_out` | 两者均为空 | failed |
| F2 | 金额为正数 | `amount_in` / `amount_out` | < 0（除红冲场景） | warning |
| F3 | 金额格式 | `amount_in` / `amount_out` | 非数字字符 | failed |
| F4 | 日期格式 | `occur_date` | 非 ISO 日期 | failed |
| F5 | 凭证号长度 | `erp_record_id` | > 200 字符 | truncated |
| F6 | 摘要长度 | `summary` | > 1000 字符 | truncated |
| F7 | 方向互斥 | `amount_in` / `amount_out` | 两者均 > 0 | failed |

### 收入校验

| # | 规则 | 字段 | 条件 | 错误处理 |
|:-:|------|:----:|:----:|:--------:|
| R1 | 订单存在 | `matched_order_id` | Order 须存在 | failed |
| R2 | 订单未删除 | `matched_order_id` | Order.is_deleted=False | failed |
| R3 | Invoice No 唯一 | `invoice_no` | 不能重复（同一订单） | duplicate |

### 成本校验

| # | 规则 | 字段 | 条件 | 错误处理 |
|:-:|------|:----:|:----:|:--------:|
| C1 | 订单存在 | `matched_order_id` | Order 须存在 | failed |
| C2 | 金额 > 0 | `amount_out` | 必须 > 0（非红冲） | failed |
| C3 | 供应商存在 | — | 通过摘要匹配 | warning |

### 收款/付款校验

| # | 规则 | 字段 | 条件 | 错误处理 |
|:-:|------|:----:|:----:|:--------:|
| P1 | 流水关联 | `flow_id` / `cost_id` | 须对应已导入的流水 | failed |
| P2 | 金额一致性 | `amount` | 不超过对应流水金额 | warning |

---

## 三、业务校验规则

### 匹配校验

| # | 规则 | 说明 | 严重程度 |
|:-:|------|------|:--------:|
| M1 | 匹配状态为 auto_matched 或 manual_matched | pending 的记录不能导入 | ERROR |
| M2 | matched_order_id 必须有效 | 引用的 Order 必须存在 | ERROR |
| M3 | matched_project_id 必须有效 | 引用的 Project 必须存在 | ERROR |
| M4 | 重复匹配 | 同一 erp_record_id 匹配同一订单的不同行 | WARN |

### 金额校验

| # | 规则 | 条件 | 处理 |
|:-:|------|:----:|:----:|
| A1 | 收入合计 ≤ 订单金额 | sum(income) ≤ Order.amount | WARN |
| A2 | 成本合计 ≤ 订单金额 | sum(cost) ≤ Order.amount | WARN |
| A3 | 收款合计 ≤ 收入合计 | sum(collection) ≤ sum(income) | WARN |
| A4 | 付款合计 ≤ 成本合计 | sum(payment) ≤ sum(cost) | WARN |

---

## 四、事务校验规则

| # | 规则 | 说明 |
|:-:|------|------|
| T1 | 事务内全部操作成功才能 COMMIT | 任何业务表写入失败 → ROLLBACK |
| T2 | Summary 更新必须在同一事务内 | 事务提交前完成所有汇总计算 |
| T3 | Import Log 必须在同一事务内 | 日志与数据同时提交或回滚 |
| T4 | 事务超时保护 | 超过 30 秒自动 ROLLBACK |
| T5 | 事务大小限制 | 单事务不超过 5000 行 |

---

## 五、Batch Rollback 规则

| # | 规则 | 说明 |
|:-:|------|------|
| RB1 | 仅 ROLLBACK 已 completed 的 Batch | 未完成或已回滚的 Batch 不可操作 |
| RB2 | 使用逻辑删除 | 设置 `is_deleted = True`，不执行 DELETE |
| RB3 | 级联回滚 | 同时回滚关联的 Summary 更新 |
| RB4 | 记录审计 | Rollback 操作写入 `audit_log` |
| RB5 | 幂等 | 同一 Batch 多次 Rollback 结果一致 |

---

## 六、校验优先级

| 优先级 | 校验阶段 | 校验项 |
|:------:|---------|--------|
| P0 | 导入前 | T1-T5 事务规则 |
| P1 | 字段级 | F1-F7 字段规则 |
| P2 | 匹配级 | M1-M4 匹配规则 |
| P3 | 业务级 | R1-R3, C1-C3 业务规则 |
| P4 | 金额级 | A1-A4 金额规则 |

---

## 七、错误码定义

| 错误码 | 说明 | 处理方式 |
|:------:|------|:--------:|
| E001 | 金额为空 | 跳过 |
| E002 | 日期无效 | 跳过 |
| E003 | 匹配不存在 | 跳过 |
| E004 | 订单不存在 | 跳过 |
| E005 | 唯一约束冲突 | 标记重复 |
| E006 | 事务超时 | ROLLBACK |
| E007 | 事务过大 | 拒绝 |
| E008 | 数据异常 | 标记 failed |
| W001 | 金额超订单额 | 警告 |
| W002 | 负数金额(非红冲) | 警告 |

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-05 | 初始编制 |
