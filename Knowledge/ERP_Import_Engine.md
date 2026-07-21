# ERP Import Engine — 事务导入引擎

> **BDD-06F P1 输出 · 永久文档（SSoT）**
> 更新时间：2026-07-05
> **事务安全 > 数据一致 > 可追溯 > 可回滚 > 导入速度**

---

## 一、定位

ERP Import Engine 是**将暂存数据正式写入业务表的唯一通道**。

| 属性 | 值 |
|:----:|-----|
| 角色 | 事务性数据写入引擎 |
| 输入 | `erp_staging_flow`（已匹配数据） |
| 输出 | `IncomeFlow` / `CostFlow` / `Collection` / `Payment` + Summary 更新 |
| 可写 | ✅ 写入业务表（Import 模块专属） |
| 可回滚 | ✅ 支持按 Batch 整体回滚 |
| 事务保障 | ✅ BEGIN → 全部完成 → COMMIT；任何失败 → ROLLBACK |

### 禁止

| 行为 | 后果 |
|:----:|------|
| 跳过 Workbench 直接写库 | 数据完整性无法保障 |
| 部分成功 | 违反事务原则，数据不一致 |
| 直接删除业务数据 | 违反可追溯原则，必须用 Rollback |

---

## 二、事务流程

```
[Batch] 确认导入 → Impact Preview 通过
                          ↓
               BEGIN TRANSACTION
                          ↓
               ┌─ 1. 校验 (Validation)
               ├─ 2. Direction 分流 (贷方→收入 / 借方→成本)
               ├─ 3. Business Object 创建
               │     ├── IncomeFlow (贷方，非收款类)
               │     ├── CostFlow   (借方，非付款类)
               │     ├── Collection (贷方，收款类)
               │     └── Payment    (借方，付款类)
               ├─ 4. Summary 更新
               │     ├── Revenue Summary
               │     ├── Cost Summary
               │     └── Order Summary
               └─ 5. Import Log 写入
                          ↓
                    COMMIT
                          ↓
               [Result] 成功 / 失败
```

### 事务边界

| 阶段 | 操作 | 事务内 | 
|:----:|------|:------:|
| 校验 | 字段/业务规则检查 | ✅ |
| 分流 | 按 direction 确定目标表 | ✅ |
| 创建 | 写入 IncomeFlow/CostFlow 等 | ✅ |
| Summary | 更新汇总表 | ✅ |
| 日志 | 写入导入日志 | ✅ |
| **COMMIT** | 全部成功 | — |
| **ROLLBACK** | 任何失败 | — |

---

## 三、Direction 分流规则

| Direction | amount_in | amount_out | 目标表 |
|:---------:|:---------:|:----------:|:------:|
| 贷方 / 收入 | `> 0` | `= 0` | `IncomeFlow` |
| 借方 / 成本 | `= 0` | `> 0` | `CostFlow` |
| 收款类 | `> 0` 且 `record_type='collection'` | `= 0` | `Collection` |
| 付款类 | `= 0` 且 `record_type='payment'` | `> 0` | `Payment` |

### 分流决策树

```python
def route_to_business_object(flow: ERPStagingFlow) -> ModelClass:
    if flow.record_type == "collection":
        return Collection
    elif flow.record_type == "payment":
        return Payment
    elif flow.amount_in > 0 and flow.amount_out == 0:
        return IncomeFlow
    elif flow.amount_out > 0 and flow.amount_in == 0:
        return CostFlow
    else:
        raise ImportError("无法分流: 金额异常")
```

---

## 四、Business Object 映射

### ERPStagingFlow → IncomeFlow

| 暂存字段 | 业务字段 | 转换规则 |
|:--------:|:--------:|---------|
| `erp_record_id` | `invoice_no` | 直接映射 |
| `occur_date` | `invoice_date` | 直接映射 |
| `amount_in` | `taxable_amount` | 直接映射 |
| `summary` | `remark` | 直接映射 |
| `matched_order_id` | `order_id` | 匹配结果 |
| — | `non_taxable_amount` | 设为 0.0 |
| — | `status` | 设为"待回款" |

### ERPStagingFlow → CostFlow

| 暂存字段 | 业务字段 | 转换规则 |
|:--------:|:--------:|---------|
| `erp_record_id` | `voucher_no` | 直接映射 |
| `occur_date` | `cost_date` | 直接映射 |
| `amount_out` | `taxable_amount` | 直接映射 |
| `summary` | `remark` | 直接映射 |
| `matched_order_id` | `order_id` | 匹配结果 |
| — | `status` | 设为"待支付" |

### ERPStagingFlow → Collection

| 暂存字段 | 业务字段 | 转换规则 |
|:--------:|:--------:|---------|
| `erp_record_id` | `receipt_no` | 直接映射 |
| `occur_date` | `collection_date` | 直接映射 |
| `amount_in` | `amount` | 直接映射 |
| `matched_order_id` | `order_id` | 匹配结果 |

### ERPStagingFlow → Payment

| 暂存字段 | 业务字段 | 转换规则 |
|:--------:|:--------:|---------|
| `erp_record_id` | `voucher_no` | 直接映射 |
| `occur_date` | `payment_date` | 直接映射 |
| `amount_out` | `amount` | 直接映射 |
| `matched_order_id` | `order_id` | 匹配结果 |

---

## 五、Summary 更新

| Summary | 数据来源 | 更新方式 |
|:-------:|:--------:|---------|
| Revenue Summary | 新写入的 IncomeFlow | 按 order_id 聚合 sum(taxable_amount) |
| Cost Summary | 新写入的 CostFlow | 按 order_id 聚合 sum(taxable_amount) |
| Order Summary | 以上两者 | 重新计算订单维度汇总 |

### 更新策略

```python
def update_summaries(imported_flows: list, db: Session):
    """按 order_id 聚合更新 Summary。"""
    affected_order_ids = set()
    for flow in imported_flows:
        if flow.matched_order_id:
            affected_order_ids.add(flow.matched_order_id)
    
    for oid in affected_order_ids:
        recalc_order_summary(oid, db)  # 重新计算该订单的汇总
```

---

## 六、Import Log

| 字段 | 说明 |
|:----:|------|
| batch_no | 关联的 Import Batch |
| flow_id | 处理的暂存记录 ID |
| action | `created` / `skipped` / `failed` |
| target_table | 写入的目标表名 |
| target_id | 写入的业务记录 ID |
| detail | 详细信息 |
| created_at | 记录时间 |

---

## 七、Batch Rollback

### 触发条件

| 场景 | 说明 |
|:----:|------|
| 用户发现导入错误 | 人工触发 Rollback |
| 数据异常检测 | 系统自动标记需要回滚 |
| 业务验收失败 | 测试后回滚 |

### 回滚流程

```
确认回滚
  ↓
BEGIN TRANSACTION
  ↓
查找 Batch 关联的所有业务记录 (IncomeFlow/CostFlow/Collection/Payment)
  ↓
逻辑删除所有关联记录 (is_deleted = True)
  ↓
恢复 Batch 状态为 rolled_back
  ↓
COMMIT
```

### 回滚原则

| 原则 | 说明 |
|:----:|------|
| **不得直接删除** | 使用逻辑删除 (`is_deleted = True`) |
| **可追溯** | 回滚操作记入 Audit Log |
| **幂等** | 同一 Batch 多次回滚结果一致 |
| **不可逆** | 已回滚的 Batch 不可恢复 |

---

## 八、API 接口

| 方法 | 路径 | 说明 |
|:----:|------|------|
| POST | `/api/v1/erp/engine/execute/{batch_no}` | 执行导入事务 |
| POST | `/api/v1/erp/engine/rollback/{batch_no}` | 回滚导入 |
| GET | `/api/v1/erp/engine/status/{batch_no}` | 查询导入状态 |

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-05 | 初始编制 |
